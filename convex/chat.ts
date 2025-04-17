import { v, ConvexError } from "convex/values";
import { internalAction, internalMutation, mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai'
import * as z from 'zod'

export const isAuthenticatedMiddleware = async (ctx: MutationCtx | QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Not authenticated");

  return userId;
};

const google = createGoogleGenerativeAI({
  // custom settings
  apiKey: process.env.CONVEX_GOOGLE_AI_API_KEY
});

const model = google('gemini-2.0-flash-001', {
  structuredOutputs: false,
});

type Message = Doc<"messages">;
type Character = Doc<"characters">;

export const getMessages = query({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_character_and_user", (q) =>
        q.eq("characterId", args.characterId)
          .eq("userId", userId)
      )
      .collect();

    return messages;
  },
});

export const sendMessage = mutation({
  args: {
    characterId: v.id("characters"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await isAuthenticatedMiddleware(ctx)

    // Save user message
    await ctx.db.insert('messages', {
      characterId: args.characterId,
      userId,
      content: args.message,
      isAiResponse: false,
    });

    const currentScore = await ctx.db.query('leaderboard')
      .withIndex('by_user_and_character', (q) => q.eq('userId', userId).eq('characterId', args.characterId))
      .unique();

    // Generate AI response
    await ctx.scheduler.runAfter(0, internal.chat.generateResponse, {
      characterId: args.characterId,
      userId,
      currentScore: currentScore?.score || 0,
      lastMessage: args.message,
    });
  },
});

export const generateResponse = internalAction({
  args: {
    characterId: v.id("characters"),
    userId: v.id('users'),
    currentScore: v.number(),
    lastMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Get character details
    const character = await ctx.runQuery(api.chat.getCharacterDetails, {
      characterId: args.characterId
    }) as Character;
    if (!character) throw new Error("Character not found");

    // Get conversation history
    const messages = await ctx.runQuery(api.chat.getConversationHistory, {
      characterId: args.characterId,
      userId: args.userId,
    });

    const prompt = `You are ${character.name}, ${character.personality}. ${character.background}  
      Your interests include: ${character.interests.join(", ")}.  
      You like: ${character.preferences.likes.join(", ")}.  
      You dislike: ${character.preferences.dislikes.join(", ")}.  

      Current Affection Score: ${args.currentScore} (scale: 1–50)

      Your task:
      - Stay fully in character and reply to the user's latest message.
      - Respond naturally and briefly, as if chatting with someone you’ve just met. Be curious, playful, or guarded depending on how the message feels.
      - Progress the conversation — ask a question or give a comment that keeps it going.
      - Avoid sounding robotic or overly familiar.
      - Punish repetition and boredom.

      Also, analyze the user's latest message:
      - "${args.lastMessage}"
      - Rate it from **-10 to 10** in three areas:
        - **Humor**: Was it funny, clever, or playful?
        - **Creativity**: Was it original or surprising?
        - **Chemistry**: Did it build connection or flirty energy?

      Sum the three scores and return the result in this JSON format:
      \`\`\`json
      {
        "message": "Your in-character reply here.",
        "scores": number
      }
      \`\`\`

      Message History:
      ${messages.map((m: Message) => `${m.isAiResponse ? character.name : "User"}: ${m.content}`).join("\n")}
    `

    const result = await generateObject({
      model: model,
      schema: z.object({
        message: z.string(),
        scores: z.number(),
      }),
      maxRetries: 3,
      prompt: prompt
    })

    // Save AI response
    await ctx.runMutation(internal.chat.saveAiResponse, {
      characterId: args.characterId,
      userId: args.userId,
      content: result.object.message,
      score: result.object.scores / 3,
    });

    return true;
  },
});

export const getCharacterDetails = query({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.characterId);
  },
});

export const getConversationHistory = query({
  args: {
    characterId: v.id("characters"),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_character_and_user", (q) =>
        q.eq("characterId", args.characterId)
          .eq("userId", args.userId)
      )
      .collect();
  },
});

export const saveAiResponse = internalMutation({
  args: {
    characterId: v.id("characters"),
    content: v.string(),
    score: v.number(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {

    await ctx.db.insert('messages', {
      characterId: args.characterId,
      userId: args.userId,
      content: args.content,
      score: args.score,
      isAiResponse: true,
    });

    await ctx.scheduler.runAfter(0, internal.leaderboard.updateLeaderboard, {
      characterId: args.characterId,
      score: args.score,
      userId: args.userId,
    })
  },
});
