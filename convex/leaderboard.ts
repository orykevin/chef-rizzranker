import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    // Get today's top 10 players
    const leaderboard = await ctx.db
      .query("leaderboard")
      .order("desc")
      .take(10);

    // Get user details for each leaderboard entry
    const leaderboardWithUsers = leaderboard.map((entry) => ({
      ...entry,
      username: `Player ${entry.userId.slice(0, 6)}`, // Create a short player ID
    }));

    return leaderboardWithUsers;
  },
});

export const updateLeaderboard = internalMutation({
  args: {
    characterId: v.id("characters"),
    score: v.number(),
    userId: v.id('users'),
  }, handler: async (ctx, args) => {
    const leaderboard = await ctx.db.query('leaderboard').withIndex('by_user_and_character', (q) => q.eq('userId', args.userId).eq('characterId', args.characterId)).unique()
    const globalLeaderboard = await ctx.db.query('globalLeaderboard').withIndex('by_user', (q) => q.eq('userId', args.userId)).unique();

    if (leaderboard) {
      await ctx.db.patch(leaderboard._id, {
        score: leaderboard.score + args.score,
        messageCount: leaderboard.messageCount + 1,
      })
    } else {
      await ctx.db.insert('leaderboard', {
        score: args.score,
        messageCount: 1,
        userId: args.userId,
        characterId: args.characterId
      })
    }

    if (globalLeaderboard) {
      await ctx.db.patch(globalLeaderboard._id, { totalScore: globalLeaderboard.totalScore + args.score })
    } else {
      await ctx.db.insert('globalLeaderboard', { totalScore: args.score, userId: args.userId })
    }
  }
})