import { v } from "convex/values";
import { query } from "./_generated/server";

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
