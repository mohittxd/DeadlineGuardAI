import { db } from "./index.ts";
import { users, tasks, habits, chatMessages } from "./schema.ts";
import { eq } from "drizzle-orm";

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({ uid, email })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to get/create user in DB:", error);
    try {
      const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (existing.length > 0) return existing[0];
    } catch (innerErr) {
      console.error("Secondary fallback select failed:", innerErr);
    }
    throw new Error("Failed to authenticate or initialize user profile in database.", { cause: error });
  }
}

export async function getTasksForUser(uid: string, email: string) {
  const user = await getOrCreateUser(uid, email);
  return db.select().from(tasks).where(eq(tasks.userId, user.id));
}

export async function syncTasksForUser(uid: string, email: string, clientTasks: any[]) {
  const user = await getOrCreateUser(uid, email);
  
  // Clear existing tasks
  await db.delete(tasks).where(eq(tasks.userId, user.id));
  
  if (clientTasks.length > 0) {
    const valuesToInsert = clientTasks.map((t) => ({
      userId: user.id,
      taskId: t.id,
      name: t.name,
      priority: t.priority,
      deadline: t.deadline || null,
      duration: t.duration,
      completed: t.completed ?? false,
      matrixQuadrant: t.matrixQuadrant || null,
      tacticalHint: t.tacticalHint || null,
      category: t.category || null,
      completedAt: t.completedAt || null,
    }));
    await db.insert(tasks).values(valuesToInsert);
  }
  return db.select().from(tasks).where(eq(tasks.userId, user.id));
}

export async function getHabitsForUser(uid: string, email: string) {
  const user = await getOrCreateUser(uid, email);
  return db.select().from(habits).where(eq(habits.userId, user.id));
}

export async function syncHabitsForUser(uid: string, email: string, clientHabits: any[]) {
  const user = await getOrCreateUser(uid, email);
  
  // Clear existing habits
  await db.delete(habits).where(eq(habits.userId, user.id));
  
  if (clientHabits.length > 0) {
    const valuesToInsert = clientHabits.map((h) => ({
      userId: user.id,
      habitId: h.id,
      name: h.name,
      streak: h.streak ?? 0,
      completedToday: h.completedToday ?? false,
      frequency: h.frequency || "Daily",
    }));
    await db.insert(habits).values(valuesToInsert);
  }
  return db.select().from(habits).where(eq(habits.userId, user.id));
}

export async function getChatMessagesForUser(uid: string, email: string) {
  const user = await getOrCreateUser(uid, email);
  return db.select().from(chatMessages).where(eq(chatMessages.userId, user.id));
}

export async function syncChatMessagesForUser(uid: string, email: string, clientMessages: any[]) {
  const user = await getOrCreateUser(uid, email);
  
  // Clear existing messages
  await db.delete(chatMessages).where(eq(chatMessages.userId, user.id));
  
  if (clientMessages.length > 0) {
    const valuesToInsert = clientMessages.map((m) => ({
      userId: user.id,
      messageId: m.id,
      role: m.role,
      text: m.text,
      timestamp: m.timestamp,
    }));
    await db.insert(chatMessages).values(valuesToInsert);
  }
  return db.select().from(chatMessages).where(eq(chatMessages.userId, user.id));
}
