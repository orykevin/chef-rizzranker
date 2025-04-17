import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const getActiveCharacter = query({
  args: {},
  handler: async (ctx) => {
    const character = await ctx.db
      .query("characters")
      .order("desc")
      .collect();

    if (!character) {
      throw new Error("No character available");
    }

    return character;
  },
});

export const getPreviousCharacter = query({
  args: {},
  handler: async (ctx) => {
    const character = await ctx.db
      .query("characters")
      .order("desc")
      .collect();

    if (!character) {
      throw new Error("No character available");
    }

    return character;
  },
});

export const createNewCharacter = internalMutation({
  args: {
    name: v.string(),
    personality: v.string(),
    background: v.string(),
    interests: v.array(v.string()),
    preferences: v.object({
      likes: v.array(v.string()),
      dislikes: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('characters', {
      name: args.name,
      personality: args.personality,
      background: args.background,
      interests: args.interests,
      preferences: {
        likes: args.preferences.likes,
        dislikes: args.preferences.dislikes,
      },
    });
  },
});