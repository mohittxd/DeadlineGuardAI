import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Users table mapped to Firebase UID
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  taskId: text("task_id").notNull(), // Client-side UUID
  name: text("name").notNull(),
  priority: text("priority").notNull(), // Critical, High, Medium, Low
  deadline: text("deadline"),
  duration: integer("duration").notNull(), // in minutes
  completed: boolean("completed").notNull().default(false),
  matrixQuadrant: text("matrix_quadrant"), // doFirst, schedule, delegate, defer
  tacticalHint: text("tactical_hint"),
  category: text("category"),
  completedAt: text("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habits table
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  habitId: text("habit_id").notNull(), // Client-side UUID
  name: text("name").notNull(),
  streak: integer("streak").notNull().default(0),
  completedToday: boolean("completed_today").notNull().default(false),
  frequency: text("frequency").notNull(), // Daily, Every Focus Block
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  messageId: text("message_id").notNull(), // Client-side UUID
  role: text("role").notNull(), // user, model
  text: text("text").notNull(),
  timestamp: text("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  habits: many(habits),
  chatMessages: many(chatMessages),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));
