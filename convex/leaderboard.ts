import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAuthenticatedMiddleware } from "./chat";

export const getLeaderboard = query({
  args: {characterId: v.id("characters")},
  handler: async (ctx, args) => {
    const leaderboard = await ctx.db
      .query("leaderboard")
      .withIndex("by_character", (q) => q.eq("characterId", args.characterId))
      .order("desc")
      .take(10);

    // Get user details for each leaderboard entry
    const leaderboardWithUsers = await Promise.all(leaderboard.map(async (entry) => {
      const user = await ctx.db.get(entry.userId);
      return {
        ...entry,
        username: user?.name || `Player ${entry.userId.slice(0, 6)}`,
      };
    }));

    return leaderboardWithUsers;
  },
});

export const getGlobalLeaderboard = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const topTenGlobalLeaderboard = await ctx.db
      .query("globalLeaderboard")
      .withIndex('by_total_score')
      .order("desc")
      .take(10);
      
      if(userId){
        const userGlobalLeaderboard = await ctx.db
          .query("globalLeaderboard")
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .unique();

        if(userGlobalLeaderboard && !topTenGlobalLeaderboard.some((entry) => entry._id === userGlobalLeaderboard._id)){
          topTenGlobalLeaderboard.push(userGlobalLeaderboard);
        }
      }

    // Get user details for each leaderboard entry
    const leaderboardWithUsers = await Promise.all(topTenGlobalLeaderboard.map(async (entry) => {
      const user = await ctx.db.get(entry.userId);
      return {
        ...entry,
        username: user?.name || `Player ${entry.userId.slice(0, 6)}`,
      };
    }));

    return leaderboardWithUsers;
  },
});

export const getTopThreeGlobalLeaderboard = query({
  handler: async (ctx) => {
    const leaderboard = await ctx.db
      .query("globalLeaderboard")
      .withIndex('by_total_score')
      .order("desc")
      .take(3);

    // Get user details for each leaderboard entry
    const leaderboardWithUsers = await Promise.all(leaderboard.map(async (entry) => {
      const user = await ctx.db.get(entry.userId);
      if(!user) return null;
      const allCharaterLeaderboard = await ctx.db
        .query("leaderboard")
        .withIndex('by_user_score', (q) => q.eq('userId', entry.userId))
        .collect();

      return {
        ...entry,
        username: user?.name || `Player ${entry.userId.slice(0, 6)}`,
        characterCount: allCharaterLeaderboard.length,
        messageCount: allCharaterLeaderboard.reduce((acc, entry) => acc + entry.messageCount, 0),
      };
    }));

    return leaderboardWithUsers;
  },
});

export const getAllUserLeaderboards = query({
  handler: async (ctx) => {
    const userId = await isAuthenticatedMiddleware(ctx);
    return await ctx.db
      .query("leaderboard")
      .withIndex('by_user_score', (q) => q.eq('userId', userId))
      .collect();
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