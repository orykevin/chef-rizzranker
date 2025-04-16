import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const CHARACTERS = [
  {
    name: "Luna",
    personality: "mysterious and artistic",
    background: "A talented painter who spends her nights stargazing and creating cosmic-inspired art",
    interests: ["astronomy", "abstract art", "poetry", "midnight walks"],
    preferences: {
      likes: ["deep conversations", "creative expression", "starry nights"],
      dislikes: ["small talk", "rushing things", "materialistic attitudes"],
    },
  },
  {
    name: "Alex",
    personality: "witty and adventurous",
    background: "A travel photographer who's visited 50 countries and loves extreme sports",
    interests: ["photography", "rock climbing", "street food", "storytelling"],
    preferences: {
      likes: ["spontaneity", "courage", "genuine laughter"],
      dislikes: ["playing it safe", "predictable conversations", "negativity"],
    },
  },
  {
    name: "Sophia",
    personality: "intellectual and playful",
    background: "A quantum physicist who moonlights as a jazz pianist",
    interests: ["quantum mechanics", "jazz music", "philosophy", "chess"],
    preferences: {
      likes: ["intellectual banter", "musical references", "clever wordplay"],
      dislikes: ["anti-science attitudes", "closed-mindedness", "lack of curiosity"],
    },
  },
];

export const createDailyCharacter = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have today's character
    const existingCharacter = await ctx.db
      .query("characters")
      .withIndex("by_active_date", (q) => q.eq("activeDate", today))
      .first();
    
    if (existingCharacter) {
      return;
    }
    
    // Create new character for today
    const characterIndex = Math.floor(Math.random() * CHARACTERS.length);
    const character = CHARACTERS[characterIndex];
    
    await ctx.db.insert('characters', {
      ...character,
      activeDate: today,
    });
  },
});

// Create the cron jobs
const crons = cronJobs();

// Run createDailyCharacter every day at midnight UTC
crons.interval("create-daily-character", { hours: 24 }, internal.crons.createDailyCharacter);

export default crons;
