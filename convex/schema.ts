import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  characters: defineTable({
    name: v.string(),
    personality: v.string(),
    background: v.string(),
    interests: v.array(v.string()),
    preferences: v.object({
      likes: v.array(v.string()),
      dislikes: v.array(v.string()),
    }),
  }),

  messages: defineTable({
    characterId: v.id("characters"),
    userId: v.id('users'),
    content: v.string(),
    score: v.optional(v.number()),
    isAiResponse: v.boolean(),
  })
    .index("by_character", ["characterId"])
    .index("by_user", ["userId"])
    .index("by_character_and_user", ["characterId", "userId"]),

  leaderboard: defineTable({
    userId: v.id('users'),
    score: v.number(),
    messageCount: v.number(),
    characterId: v.optional(v.id("characters")), // Optional for backward compatibility
  })
    .index("by_user_and_character", ["userId", "characterId"])
    .index("by_character", ["characterId", "score", "messageCount"])
    .index("by_user_score", ["userId", "score"]),

  globalLeaderboard: defineTable({
    userId: v.id('users'),
    totalScore: v.number()
  }).index('by_user', ['userId']).index('by_total_score', ['totalScore'])
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
