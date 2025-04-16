import { v } from "convex/values";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import OpenAI from "openai";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAuthenticatedMiddleware } from "./middleware";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai'
import * as z from 'zod'

const google = createGoogleGenerativeAI({
  // custom settings
  apiKey: process.env.CONVEX_GOOGLE_AI_API_KEY
});

const model = google('gemini-2.0-flash-001', {
  structuredOutputs: false,
});

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
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
    });
  },
});

export const generateResponse = internalAction({
  args: {
    characterId: v.id("characters"),
    userId: v.id('users'),
    currentScore: v.number(),
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
      Your interests are: ${character.interests.join(", ")}
      You like: ${character.preferences.likes.join(", ")}
      You dislike: ${character.preferences.dislikes.join(", ")}

      Please respond to the conversation in character. Rate the user's last message for humor (-10-10), creativity (-10-10), and chemistry (-10-10) and sum the scores.
      Format your response as JSON with "message" and "scores" fields. Keep replies short, like a natural chat with someone new. Talk like you're just getting to know each other—don’t get too familiar too quickly.\n

      Current Affections score: ${args.currentScore}\n

      Previous messages:\n
      ${messages.map((m: Message) => `${m.isAiResponse ? character.name : "User"}: ${m.content}`).join("\n")}\n

    `;

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
