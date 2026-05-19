import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router = Router();

// Get current user profile
router.get("/users/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.userId!));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Admin: list all users
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list users");
    res.status(500).json({ error: "Failed to list users" });
  }
});

// Admin: update user role
router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" }); return;
  }
  try {
    const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update user role");
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;
