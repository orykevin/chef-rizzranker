import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.CONVEX_GOOGLE_AI_API_KEY
});

const model = google('gemini-2.0-flash-001', {
  structuredOutputs: false,
});

export const createDailyCharacter = internalAction({
  args: {},
  handler: async (ctx) => {

    const previousCharacter = await ctx.runQuery(api.characters.getPreviousCharacter, {});

    const prompt = `
    Last character: ${previousCharacter.map((character) => {
      return `
       -  Name: ${character.name}
       -  Personality: ${character.personality}
       -  Background: ${character.background}
       -  Interests: ${character.interests.join(', ')}
       -  Preferences: ${character.preferences.likes.join(', ')} / ${character.preferences.dislikes.join(', ')}
      `
    }).join('\n\n')}
    Create a new and different from previous character for a dating simulation game using this structure:
    - Name: A unique and memorable first name.
    - Personality: A short phrase combining two traits (e.g., “intellectual and playful”).
    - Background: A quirky description that combines a high-level profession with a surprising hobby.
    - Interests: A list of 4 distinct interests that help define the character’s personality.
    - Preferences:
    - likes: A list of 3 things the character enjoys in conversation or behavior.
    - dislikes: A list of 3 things the character finds off-putting or frustrating.
`
    
    const response = await generateObject({
      model,
      prompt: prompt,
      schema: z.object({
        name: z.string(),
        personality: z.string(),
        background: z.string(),
        interests: z.array(z.string()).min(4).max(4),
        preferences: z.object({
          likes: z.array(z.string()).min(3).max(3),
          dislikes: z.array(z.string()).min(3).max(3),
        }),
      }),
      maxRetries: 3,
      temperature: 0.8,
    })

    await ctx.runMutation(internal.characters.createNewCharacter, {
      name: response.object.name,
      personality: response.object.personality,
      background: response.object.background,
      interests: response.object.interests,
      preferences: response.object.preferences,
    });
  },
});

// Create the cron jobs
const crons = cronJobs();

// Run createDailyCharacter every day at midnight UTC
crons.interval("create-daily-character", { hours: 24 }, internal.crons.createDailyCharacter);

export default crons;
