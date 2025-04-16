import { ConvexError } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const isAuthenticatedMiddleware = async (ctx: MutationCtx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Not authenticated");

  return userId;
};
