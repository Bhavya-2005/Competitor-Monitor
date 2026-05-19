import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userDbId?: number;
      userRole?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = clerkId;

  // JIT provision user in DB
  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    if (!user) {
      const email = (auth.sessionClaims?.email as string) ?? "";
      [user] = await db
        .insert(usersTable)
        .values({ clerkId, email, role: "user" })
        .onConflictDoNothing()
        .returning();
      if (!user) {
        [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
      }
    }
    if (user) {
      req.userDbId = user.id;
      req.userRole = user.role;
    }
  } catch (err) {
    req.log.warn({ err }, "Failed to JIT provision user");
  }

  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  await requireAuth(req, res, () => {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden — admin only" });
      return;
    }
    next();
  });
};
