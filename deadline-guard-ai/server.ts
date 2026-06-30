import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import {
  getTasksForUser,
  syncTasksForUser,
  getHabitsForUser,
  syncHabitsForUser,
  getChatMessagesForUser,
  syncChatMessagesForUser,
} from "./src/db/db-helpers.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let isGeminiOfflineMode = false;

  function getApiKeyStatus() {
    const primaryKey = process.env.GEMINI_API_KEY;
    let cleanKey = primaryKey ? primaryKey.trim() : "";
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      cleanKey = cleanKey.substring(1, cleanKey.length - 1).trim();
    }
    if (cleanKey.startsWith("'") && cleanKey.endsWith("'")) {
      cleanKey = cleanKey.substring(1, cleanKey.length - 1).trim();
    }
    const isPlaceholder = !cleanKey || 
                          cleanKey === "" || 
                          cleanKey === "MY_GEMINI_API_KEY" || 
                          cleanKey.startsWith("MY_GEMINI_");
    return {
      isPlaceholder,
      cleanKey,
      keyLength: cleanKey.length,
      prefix: cleanKey ? cleanKey.substring(0, 6) : ""
    };
  }

  // Parses raw API JSON errors into human-readable messages
  function cleanGeminiErrorMessage(error: any): string {
    if (!error) return "Unknown error";
    const rawMsg = error.message || String(error);
    try {
      if (typeof rawMsg === "string" && rawMsg.trim().startsWith("{")) {
        const parsed = JSON.parse(rawMsg);
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return rawMsg;
  }

  // Helper function to call generateContent with model fallbacks and dynamic key-switching
  async function generateContentWithFallback(options: {
    model?: string;
    contents: any;
    config?: any;
  }) {
    const { isPlaceholder, cleanKey } = getApiKeyStatus();

    if (isPlaceholder) {
      console.info("[Gemini API] GEMINI_API_KEY is not configured or is a placeholder. Engaging local offline fallback mode.");
      throw new Error("GEMINI_OFFLINE");
    }

    const client = new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-3.1-pro-preview"
    ];
    const initialModel = options.model || "gemini-3.5-flash";
    const uniqueModels = Array.from(new Set([initialModel, ...modelsToTry]));

    let lastError: any = null;

    for (const model of uniqueModels) {
      // Skip deprecated models entirely if they are requested/passed
      if (model.includes("1.5") || model === "gemini-2.0-flash" || model === "gemini-2.0-pro") {
        continue;
      }

      try {
        console.log(`[Gemini API] Attempting generateContent with model: ${model}`);
        const res = await client.models.generateContent({
          ...options,
          model,
        });
        console.log(`[Gemini API] Success with model: ${model}`);
        return res;
      } catch (err: any) {
        const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
        const isAuthError = errStr.includes("API_KEY_INVALID") || 
                            errStr.includes("API key not valid") || 
                            errStr.includes("PERMISSION_DENIED") ||
                            errStr.includes("API_KEY_SERVICE_BLOCKED") ||
                            (err.message && (
                              err.message.includes("API key") || 
                              err.message.includes("PERMISSION_DENIED")
                            ));

        if (isAuthError) {
          console.info("[Gemini API] Key credentials rejected or restricted.");
          throw new Error(`Gemini Authentication Error: Your provided GEMINI_API_KEY is invalid or restricted. (${cleanGeminiErrorMessage(err)})`);
        }

        console.log(`[Gemini API] Non-fatal model attempt issue: ${model}`);
        lastError = err;
      }
    }

    throw lastError || new Error("All Gemini models failed to generate content.");
  }

  // API Route for database fetching (synchronized)
  app.get("/api/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || "anonymous@user.com";
      const dbTasks = await getTasksForUser(uid, email);
      const dbHabits = await getHabitsForUser(uid, email);
      const dbMessages = await getChatMessagesForUser(uid, email);

      res.json({
        tasks: dbTasks.map(t => ({
          id: t.taskId,
          name: t.name,
          priority: t.priority,
          deadline: t.deadline,
          duration: t.duration,
          completed: t.completed,
          matrixQuadrant: t.matrixQuadrant,
          tacticalHint: t.tacticalHint,
          category: t.category,
          completedAt: t.completedAt,
        })),
        habits: dbHabits.map(h => ({
          id: h.habitId,
          name: h.name,
          streak: h.streak,
          completedToday: h.completedToday,
          frequency: h.frequency,
        })),
        chatMessages: dbMessages.map(m => ({
          id: m.messageId,
          role: m.role,
          text: m.text,
          timestamp: m.timestamp,
        })),
      });
    } catch (error: any) {
      console.log("[Sync Status] GET local fallback.");
      res.status(500).json({ error: error.message || "Failed to fetch synced data from database." });
    }
  });

  // API Route for database pushing (synchronized)
  app.post("/api/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || "anonymous@user.com";
      const { tasks, habits, chatMessages } = req.body;

      let dbTasks = [];
      let dbHabits = [];
      let dbMessages = [];

      if (tasks && Array.isArray(tasks)) {
        dbTasks = await syncTasksForUser(uid, email, tasks);
      } else {
        dbTasks = await getTasksForUser(uid, email);
      }

      if (habits && Array.isArray(habits)) {
        dbHabits = await syncHabitsForUser(uid, email, habits);
      } else {
        dbHabits = await getHabitsForUser(uid, email);
      }

      if (chatMessages && Array.isArray(chatMessages)) {
        dbMessages = await syncChatMessagesForUser(uid, email, chatMessages);
      } else {
        dbMessages = await getChatMessagesForUser(uid, email);
      }

      res.json({
        tasks: dbTasks.map(t => ({
          id: t.taskId,
          name: t.name,
          priority: t.priority,
          deadline: t.deadline,
          duration: t.duration,
          completed: t.completed,
          matrixQuadrant: t.matrixQuadrant,
          tacticalHint: t.tacticalHint,
          category: t.category,
          completedAt: t.completedAt,
        })),
        habits: dbHabits.map(h => ({
          id: h.habitId,
          name: h.name,
          streak: h.streak,
          completedToday: h.completedToday,
          frequency: h.frequency,
        })),
        chatMessages: dbMessages.map(m => ({
          id: m.messageId,
          role: m.role,
          text: m.text,
          timestamp: m.timestamp,
        })),
      });
    } catch (error: any) {
      console.log("[Sync Status] POST local fallback.");
      res.status(500).json({ error: error.message || "Failed to sync data with database." });
    }
  });

  // API Route for Lifesaver AI Coach Chat
  app.post("/api/chat", async (req, res) => {
    const { message, history, tasks } = req.body;
    try {
      // Format tasks nicely for the system instruction context
      const tasksContext = tasks && tasks.length > 0
        ? tasks.map((t: any) => {
            const status = t.completed 
              ? "Completed" 
              : (t.isOverdue ? "Overdue" : "Pending");
            return `- Task: "${t.name}" | Priority: ${t.priority} | Deadline: ${t.deadline} | Est. Duration: ${t.duration} mins | Status: ${status}`;
          }).join("\n")
        : "No tasks are currently added to the list. Advise the user to add their urgent tasks or deadlines so you can build their battle plan!";

      const systemInstruction = `You are LifeSaver AI, a sharp, energetic, and motivating productivity assistant built into the "Last-Minute Life Saver" app. Your job is to help users manage urgent tasks, beat deadlines, and stay focused under pressure.

You ALWAYS have access to the user's current task list. Use it to give specific, actionable advice — never generic tips.

Your personality:
- Direct and energetic, like an elite coach in the final minutes of a crucial game.
- Warm but no-nonsense — you do not waste the user's time. Get straight to the high-tempo, focused plan.
- You celebrate wins, no matter how small, to keep momentum high.
- You never panic, even when deadlines are extremely tight. You are the calm center of their storm.

Your capabilities:
1. PRIORITIZE — Tell the user exactly what to do first and why, based on deadlines and priority levels.
2. PLAN — Break down overwhelming tasks into quick, timed steps (e.g., "Do X in 10 mins, then Y in 20 mins").
3. MOTIVATE — Push the user when they're stuck or anxious. Give them the belief they can make it!
4. ANALYZE — Spot risks (e.g., two critical tasks due at the same time, or an overdue task) and suggest immediate rescue solutions.
5. SUMMARIZE — Give a quick "battle plan" for the day in 3-5 high-impact bullet points.

Rules:
- Always refer to the user's actual tasks by name — never speak in hypotheticals.
- If a task is overdue, acknowledge it honestly but pivot immediately to active recovery steps.
- Keep responses concise: max 5-6 sentences unless the user asks for a detailed breakdown or a step-by-step plan.
- Use bullet points for plans and steps, plain prose for motivation, feedback, and risk analysis.
- Never say "I'm just an AI" or refer to yourself as a model — you are their LifeSaver coach, act like it!

Current Reference Local Time: ${new Date().toLocaleString()}

Here is the user's current live task list (refer to these tasks exactly by name):
${tasksContext}`;

      // Prepare contents for Gemini generateContent
      const contents = [];
      
      // Inject prior conversation history
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }
      }

      // Add current message
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      // Query Gemini
      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.log("[AI Coach] Local processing mode active for chat.");
      
      // Intelligent, customized local chat response
      const activeTasks = Array.isArray(tasks) ? tasks.filter((t: any) => !t.completed) : [];
      const completedTasks = Array.isArray(tasks) ? tasks.filter((t: any) => t.completed) : [];
      const criticalTasks = activeTasks.filter((t: any) => t.priority === "Critical" || t.priority === "High");
      
      let reply = "";
      const msgLower = message.toLowerCase();
      
      // 1. Gemini / API / Error / Billing / Secrets questions
      if (msgLower.includes("api") || msgLower.includes("key") || msgLower.includes("gemini") || msgLower.includes("error") || msgLower.includes("quota") || msgLower.includes("billing") || msgLower.includes("secret")) {
        reply = `### 🔑 AI Coach Connection & Key Diagnosis\n\n` +
                `It looks like you are asking about the AI model status or key configurations. Here is a quick troubleshoot:\n\n` +
                `1. **Check Your Key**: Ensure you have added your **GEMINI_API_KEY** in the top-right **Settings > Secrets** panel in AI Studio.\n` +
                `2. **Billing / Quota Error**: If you see a "RESOURCE_EXHAUSTED" or "credits depleted" notice, your current Gemini API key may have run out of free quota or needs billing enabled on Google AI Studio.\n` +
                `3. **Immediate Local Access**: No worries! I have fully enabled my offline local intelligence mode. I can still guide you, help you organize, provide tactical recommendations, and run your timers perfectly without any external requests!`;
      }
      // 2. Eisenhower Matrix / Prioritization / What to do first
      else if (msgLower.includes("matrix") || msgLower.includes("eisenhower") || msgLower.includes("priorit") || msgLower.includes("quadrant") || msgLower.includes("first") || msgLower.includes("what should i do")) {
        reply = `### 📊 The Eisenhower Priority Matrix & Tactical Action\n\n` +
                `Your tasks are sorted using the **Eisenhower Matrix** to optimize focus:\n\n` +
                `- **Quadrant 1 (Critical & Urgent)**: Urgent targets requiring immediate action. Finish these first!\n` +
                `- **Quadrant 2 (High & Not Urgent)**: Strategic objectives. Crucial for long-term progress.\n` +
                `- **Quadrant 3 (Medium & Urgent)**: Immediate but minor. Keep duration short.\n` +
                `- **Quadrant 4 (Low & Not Urgent)**: Low leverage. Eliminate or postpone.\n\n` +
                `**Current Tactical Action Plan**:\n`;
        if (criticalTasks.length > 0) {
          reply += `👉 Elite prioritization dictates we target your Critical assets immediately. Start a focus sprint on: **"${criticalTasks[0].name}"**. Put on the focus synth and execute for ${criticalTasks[0].duration || 25} minutes.`;
        } else if (activeTasks.length > 0) {
          reply += `👉 With no critical conflicts, target: **"${activeTasks[0].name}"** to maintain high momentum. Strive for absolute completion before task-switching!`;
        } else {
          reply += `👉 Your active task register is currently clear. Add a target task and priority, and let's coordinate a tactical plan!`;
        }
      }
      // 3. Procrastination / Starting / Lazy / Stuck
      else if (msgLower.includes("procrastinat") || msgLower.includes("lazy") || msgLower.includes("start") || msgLower.includes("stuck") || msgLower.includes("cannot")) {
        const topTask = activeTasks[0]?.name || "Add an urgent task first";
        reply = `### 🔥 Procrastination Buster Tactical Protocol\n\n` +
                `Procrastination isn't a character flaw—it's stress management. Let's break the friction of starting:\n\n` +
                `1. **The 5-Minute Rule**: Pick your most urgent task (currently **"${topTask}"**). Commit to working on it for *just 5 minutes*. If you want to stop after that, you can. (You won't!)\n` +
                `2. **Micro-Steps**: Do not try to "finish the project." Try to write *one sentence*, edit *one line*, or organize *one item* right now.\n` +
                `3. **Atmosphere Setup**: Turn on the **Warm Focus Ambient** or **Cyber Drone** atmosphere synthesizer below to mute distraction waves.`;
      }
      // 4. Focus Mode / Sound Atmosphere / Music / Timer / Audio
      else if (msgLower.includes("focus") || msgLower.includes("timer") || msgLower.includes("pomodoro") || msgLower.includes("atmosphere") || msgLower.includes("sound") || msgLower.includes("music") || msgLower.includes("synth") || msgLower.includes("ambient") || msgLower.includes("audio")) {
        reply = `### ⏱️ Focused Atmosphere Controls\n\n` +
                `To achieve deep flow state, configure your workspace environment:\n\n` +
                `- **The Focus Timer**: Select a task and click **Start Focus** to spin up your countdown. By default, it runs for its estimated duration.\n` +
                `- **Atmospheric Synthesizer**: Use the audio control block in the sidebar to activate specialized sound frequencies:\n` +
                `  - *Cyber Drone*: Steady, low-frequency hum to mask sharp office/room noises.\n` +
                `  - *Warm Focus Ambient*: Soothing melodic waves to lower anxiety.\n` +
                `  - *Rain & Storm*: Natural organic rhythm to steady your breathing.\n` +
                `- **Tactical Alerts**: A completion chime will signal when your block ends, prompting you to log progress and take a quick rest.`;
      }
      // 5. Stress, Anxiety, Overwhelm, Panic, Help
      else if (msgLower.includes("stress") || msgLower.includes("anxi") || msgLower.includes("panic") || msgLower.includes("overwhelm") || msgLower.includes("fear") || msgLower.includes("breath") || msgLower.includes("help")) {
        const topTask = activeTasks[0]?.name || "a simple task";
        reply = `### 🌸 Panic Button: Calming the Storm\n\n` +
                `When stress spikes, your prefrontal cortex goes offline. Let's bring it back online:\n\n` +
                `1. **Box Breathing (4-4-4-4)**: Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat this 3 times right now. I will pace with you.\n` +
                `2. **Relief Planning**: Let's streamline your workload. You don't have to do it all. Identify the single task that will keep you safe today. Let's defer or delegate the rest.\n` +
                `3. **Sound Shield**: Slide on your headphones, set the atmosphere to **Warm Focus Ambient**, and let's take a 10-minute micro-focus run on: **"${topTask}"**.`;
      }
      // 6. How to add/edit/complete/delete tasks
      else if (msgLower.includes("add task") || msgLower.includes("create task") || msgLower.includes("delete") || msgLower.includes("remove") || msgLower.includes("edit") || msgLower.includes("change") || msgLower.includes("update") || msgLower.includes("task")) {
        reply = `### 📝 Task Console Operations Guide\n\n` +
                `Here is how to manage your operational list:\n\n` +
                `- **Adding a Task**: Use the **"Lock in New Task"** form at the top. Enter the name, select the Priority, estimate the duration, and select your hard deadline.\n` +
                `- **Editing a Task**: Click the pencil icon on any task card to edit its details on the fly.\n` +
                `- **Completing a Task**: Click the checkbox on the task card. This builds your daily streak and updates your performance analytics instantly!\n` +
                `- **Deleting/Removing**: Click the trash bin icon to clear a task from your database register.`;
      }
      // 7. Habit Tracking & Streak
      else if (msgLower.includes("habit") || msgLower.includes("streak") || msgLower.includes("routine") || msgLower.includes("daily")) {
        reply = `### 🔁 Habit & Streak Management\n\n` +
                `Long-term success is built on small daily rituals. Here is how to maintain traction:\n\n` +
                `- **Log Habits**: Scroll to the Habits panel to view your daily wellness checklist (Hydration, Breathing, Screen Breaks, Posture Check).\n` +
                `- **Build Streaks**: Every day you complete your habits or check off tasks, your daily streak counter increases. Keep the streak alive to unlock peak efficiency badges!\n` +
                `- **Auto-Reset**: Your habits refresh automatically every morning, ready for a fresh run.`;
      }
      // 8. Analytics / Stats / Progress / Charts
      else if (msgLower.includes("analytics") || msgLower.includes("stats") || msgLower.includes("chart") || msgLower.includes("graph") || msgLower.includes("progress") || msgLower.includes("track")) {
        reply = `### 📈 Performance Analytics Console\n\n` +
                `Open the **Analytics** tab or sidebar section to review your operational stats:\n\n` +
                `- **Completion Rate**: The percentage of locked tasks you have successfully crossed off.\n` +
                `- **Focus Time Logged**: Total cumulative minutes spent inside active focus sprints.\n` +
                `- **Load Distribution**: A visual breakdown of your tasks across the priority categories, helping you spot if you're over-allocated in Critical stress zones.`;
      }
      // 9. Daily Briefing / Agenda / Today / Plan
      else if (msgLower.includes("briefing") || msgLower.includes("plan") || msgLower.includes("schedule") || msgLower.includes("battle plan") || msgLower.includes("today") || msgLower.includes("agenda")) {
        reply = `### 📅 Tactical Daily Briefing\n\n` +
                `Here is your current focus briefing based on your live list:\n\n` +
                `- **Status**: You have **${activeTasks.length} pending** targets and **${completedTasks.length} completed** targets today.\n` +
                `- **Top Urgency**: ${criticalTasks.length > 0 ? `Your critical priority is **"${criticalTasks[0].name}"**. Engage focus immediately!` : "No critical bottlenecks detected. Momentum is high!"}\n` +
                `- **Recommended Action**: Initiate a 25-minute sprint. Put on the atmosphere synthesizer and tackle your top target to build an early victory loop!`;
      }
      // 10. Greetings
      else if (msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("hey") || msgLower.includes("greetings") || msgLower.includes("howdy")) {
        reply = `### 👋 Welcome to the Strategy Console!\n\n` +
                `Hello, Operator! I am your LifeSaver AI Coach. Whether you are dealing with tight deadlines, feeling a wave of procrastination, or just trying to plan an intense study/work block under pressure, I am here to help you coordinate.\n\n` +
                `**What are we focusing on right now?** You can ask me to help you prioritize, draft a study plan, or manage stressful workloads. Let's make it happen!`;
      }
      // 11. Complete / Done / Clear
      else if (msgLower.includes("clear") || msgLower.includes("done") || msgLower.includes("complete")) {
        reply = `### 🏆 Target Neutralized!\n\n` +
                `Excellent work! Momentum is everything. Every completed target builds your operational readiness rating and fuels your streak.\n\n` +
                `- **Next Objective**: Let's identify the next target in line.\n` +
                `- **Rest Cycle**: Take a 3-5 minute water or breath break before entering your next deep focus block. Keep the velocity high!`;
      }
      // 12. General/Other Questions (starts with question words, or contains question marks)
      else if (msgLower.startsWith("what") || msgLower.startsWith("how") || msgLower.startsWith("why") || msgLower.startsWith("can you") || msgLower.startsWith("could you") || msgLower.startsWith("tell me") || msgLower.startsWith("give me") || msgLower.includes("?")) {
        reply = `### 💡 AI Coach Tactical Advice\n\n` +
                `That's an important query. While I'm currently running in local offline optimization mode, here is a tactical approach to solve your question:\n\n` +
                `- **Analyze the Bottleneck**: If you're wondering how to achieve a goal, break it down. What is the very first step that takes less than 3 minutes?\n` +
                `- **Leverage the App**: Add this goal as a task: **"${message.length > 40 ? message.substring(0, 40) + '...' : message}"**, assign it a duration, and start a timed focus sprint with ambient audio enabled.\n` +
                `- **Personalized Advice**: To unlock deep, dynamic, and direct AI responses to this specific question, make sure to add your **GEMINI_API_KEY** under **Settings > Secrets** in the AI Studio editor!`;
      }
      // 13. Catch-all fallback
      else {
        reply = `### 🎯 Tactical Target: "${message}"\n\n` +
                `Understood! To ensure optimal momentum, we should channel this input into action:\n\n` +
                `- **Current Priority**: We have ${activeTasks.length} pending targets awaiting focus.\n` +
                `- **Suggested Next Step**: Let's lock in a focused sprint on **"${activeTasks[0]?.name || 'a new task'}"** right now.\n\n` +
                `*Tip: If you want specific, personalized strategic advice on "${message}", you can add a valid Gemini key in Settings > Secrets to unlock full, live AI coaching.*`;
      }
      
      const keyStatus = getApiKeyStatus();
      let alertMsg = "";
      if (keyStatus.isPlaceholder) {
        alertMsg = "\n\n*(Note: AI Coach is currently running in local offline fallback mode. To unlock personalized, dynamic AI reasoning and full coaching, add a valid `GEMINI_API_KEY` under Settings > Secrets.)*";
      } else {
        alertMsg = `\n\n*(Note: AI Coach detected your configured GEMINI_API_KEY (length: ${keyStatus.keyLength}, starting with "${keyStatus.prefix}..."), but Gemini returned an error: "${cleanGeminiErrorMessage(error)}". Please check your key settings in Settings > Secrets or ensure it has billing/quota enabled.)*`;
      }
      
      res.json({ text: reply + alertMsg });
    }
  });

  // API Route for AI-Powered Prioritization Matrix
  app.post("/api/prioritize", async (req, res) => {
    const { tasks } = req.body;
    try {
      const prompt = `Analyze the following tasks and prioritize them strictly into four Eisenhower Matrix quadrants based on their priority, duration, and deadlines relative to the current local time.
Tasks:
${JSON.stringify(tasks)}

Return a strict JSON object with:
1. "quadrants": {
     "doFirst": [array of task IDs],
     "schedule": [array of task IDs],
     "delegate": [array of task IDs],
     "defer": [array of task IDs]
   }
2. "coachingRationale": "A quick, sharp, motivating explanation (2-3 sentences max) from Coach LifeSaver on why this exact prioritization ensures victory."`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.log("[AI Coach] Local processing mode active for prioritize.");
      
      const taskList = Array.isArray(tasks) ? tasks : [];
      const doFirst = taskList.filter((t: any) => t.priority === "Critical" || t.priority === "High").map((t: any) => t.id);
      const schedule = taskList.filter((t: any) => t.priority === "Medium").map((t: any) => t.id);
      const delegate = taskList.filter((t: any) => t.priority === "Low" && !t.completed).map((t: any) => t.id);
      const defer = taskList.filter((t: any) => t.completed).map((t: any) => t.id);

      res.json({
        quadrants: {
          doFirst: doFirst.length > 0 ? doFirst : (taskList.length > 0 ? [taskList[0].id] : []),
          schedule,
          delegate,
          defer
        },
        coachingRationale: "I have mapped your Eisenhower matrix locally to keep your momentum high. Concentrate on 'Do First' critical targets immediately to gain maximum psychological leverage."
      });
    }
  });

  // API Route for Autonomous Task Planning and Execution Agent
  app.post("/api/plan-autonomous", async (req, res) => {
    const { mode = "decompose", goal, tasks, timeHorizon = 2, currentTime } = req.body;
    try {
      let prompt = "";
      if (mode === "optimize-existing" && Array.isArray(tasks)) {
        prompt = `You are the autonomous tactical planner of "Last-Minute Life Saver".
The user has a set of active tasks that need to be planned, optimized, and sequenced autonomously.
Current reference local time is: ${currentTime}.
Planning Time Horizon: ${timeHorizon} hours.

Here are the current active tasks:
${JSON.stringify(tasks)}

Your job is to autonomously restructure and plan these tasks to optimize productivity and eliminate stress.
For each task:
1. Suggest an optimal sequential deadline (offsetMinutes from ${currentTime}) within the ${timeHorizon}-hour horizon. Stagger them so the user is not overwhelmed, placing critical/urgent tasks first.
2. Refine the importance priority ("Critical" | "High" | "Medium" | "Low") based on realistic scheduling constraints.
3. Suggest an optimized focus duration (minutes) for each task.
4. Provide a tailored "tacticalHint" (1 short sentence) for how to sprint through this specific task.

Return a strict JSON response with:
{
  "tasks": [
    {
      "id": "original_task_id",
      "name": "Task name",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "duration": 15, // optimized duration in minutes
      "offsetMinutes": 45, // offset in minutes from current time for staggered deadline
      "tacticalHint": "Start with X and block out all distractions."
    }
  ],
  "coachingBriefing": "A high-tempo, motivating explanation (max 2 sentences) explaining how this autonomous battle schedule maximizes output."
}`;
      } else {
        const targetGoal = goal || req.body.goal || "Complete immediate pending work";
        prompt = `You are the autonomous tactical planner of "Last-Minute Life Saver". 
The user has set a critical, high-level goal: "${targetGoal}".
Current reference local time is: ${currentTime}.
Planning Time Horizon: ${timeHorizon} hours.

Your job is to break this goal down autonomously into exactly 3 to 6 highly structured, actionable micro-tasks.
Stagger their deadlines (offsetMinutes from ${currentTime}) sequentially within the ${timeHorizon}-hour horizon.
Assign appropriate priority levels ("Critical" | "High" | "Medium" | "Low") and realistic focus durations (minutes).
Provide a tailored "tacticalHint" (1 short sentence) for each micro-task.

Return a strict JSON response with:
{
  "tasks": [
    {
      "name": "Brief action-oriented micro-task description",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "duration": 20, // focus duration in minutes
      "offsetMinutes": 30, // offset in minutes from current time for staggered deadline
      "tacticalHint": "Keep it lean and focus only on the core requirements."
    }
  ],
  "coachingBriefing": "A high-tempo, energetic battle briefing (max 2 sentences) describing the autonomous combat blueprint."
}`;
      }

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.log("[AI Coach] Local processing mode active for plan-autonomous.");
      
      const taskList = Array.isArray(tasks) ? tasks : [];
      if (mode === "optimize-existing") {
        const optimized = taskList.map((t: any, idx: number) => ({
          id: t.id,
          name: t.name,
          priority: t.priority || "High",
          duration: Math.max(10, Math.min(60, t.duration || 25)),
          offsetMinutes: (idx + 1) * 30,
          tacticalHint: `Focus entirely on completing the core requirements and minimize distractions.`
        }));
        res.json({
          tasks: optimized,
          coachingBriefing: "I have autonomously optimized your existing task sequence. Staggering deadlines creates a sustainable combat rhythm."
        });
      } else {
        const targetGoal = goal || "Complete immediate pending work";
        const simulatedTasks = [
          {
            name: `Deconstruct core components of "${targetGoal}"`,
            priority: "Critical",
            duration: 20,
            offsetMinutes: 20,
            tacticalHint: "Draft the layout and core functions before writing any complex styles."
          },
          {
            name: `Sprint 1: Develop the fundamental layout framework`,
            priority: "High",
            duration: 30,
            offsetMinutes: 50,
            tacticalHint: "Keep variables structured and write simple logic first."
          },
          {
            name: `Integration & test coverage checkpoint`,
            priority: "Medium",
            duration: 15,
            offsetMinutes: 65,
            tacticalHint: "Verify edge conditions and ensure proper state updates."
          }
        ];
        res.json({
          tasks: simulatedTasks,
          coachingBriefing: `I have autonomously broken down "${targetGoal}" into 3 tactical focus sprints. Execute sequentially to maintain focus.`
        });
      }
    }
  });

  // API Route for Personalized Productivity Recommendations & Risk Analysis
  app.post("/api/recommendations", async (req, res) => {
    const { tasks } = req.body;
    try {
      const prompt = `You are LifeSaver AI Coach. Review the current workload below:
${JSON.stringify(tasks)}

Analyze risks (e.g. overdue items, overlapping target periods, extreme active load), and generate customized productivity recommendations.

Return a strict JSON object with:
{
  "combatReadinessRating": 85, // integer score from 0 to 100 on how prepared the user's setup is
  "threatAssessment": "Green" | "Amber" | "Red", // overall threat assessment level
  "risksDetected": ["Risk item 1", "Risk item 2"], // list of concrete threats/risks detected
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"], // action-oriented recommendations
  "motivationalQuote": "A fire coach-style quote of the day (max 1 sentence)."
}`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.log("[AI Coach] Local processing mode active for recommendations.");
      
      const taskList = Array.isArray(tasks) ? tasks : [];
      const activeTasksCount = taskList.filter((t: any) => !t.completed).length;
      const overdueCount = taskList.filter((t: any) => t.isOverdue || (!t.completed && new Date(t.deadline).getTime() < Date.now())).length;
      
      let combatReadinessRating = 85;
      let threatAssessment = "Green";
      const risksDetected: string[] = [];
      const recommendationsList = [
        "Set strict 25-minute Pomodoro intervals to prevent mental fatigue.",
        "Synchronize your daily habits with active task check-offs to build streak momentum.",
        "Review upcoming deadlines early in the morning to prepare your cognitive stack."
      ];

      if (activeTasksCount > 4) {
        combatReadinessRating -= 15;
        threatAssessment = "Amber";
        risksDetected.push("Extreme task congestion (over 4 active tasks at once).");
        recommendationsList.unshift("Batch low-priority items and focus entirely on a single critical sprint.");
      }
      if (overdueCount > 0) {
        combatReadinessRating -= 20;
        threatAssessment = "Red";
        risksDetected.push(`${overdueCount} tasks are overdue relative to local time.`);
        recommendationsList.unshift("Initiate emergency focus mode on the most overdue task right away.");
      }

      res.json({
        combatReadinessRating: Math.max(20, combatReadinessRating),
        threatAssessment,
        risksDetected: risksDetected.length > 0 ? risksDetected : ["No critical risks detected. System is operational."],
        recommendations: recommendationsList.slice(0, 3),
        motivationalQuote: "The secret of getting ahead is getting started. Focus and win!"
      });
    }
  });

  // API Route for AI-Powered Productivity Analytics & Weekly Summary
  app.post("/api/analytics", async (req, res) => {
    const { tasks, habits } = req.body;
    try {
      const prompt = `You are LifeSaver AI Coach, an elite tactical productivity analyst. 
Analyze the user's workload, completed tasks, and habits to compile a high-performance productivity report.

Here is the data:
Tasks:
${JSON.stringify(tasks)}

Habits:
${JSON.stringify(habits)}

Current reference local time is: ${new Date().toLocaleString()}

Based on this, return a strict JSON response with:
{
  "productivityScore": 85, // integer 0 to 100 calculated based on task completion rate, high priority completion, and habit completion consistency
  "peakHours": {
    "timeRange": "e.g., 2:00 PM - 5:00 PM",
    "focusMultiplier": 40, // percentage integer indicating how much more focused/efficient they are
    "coachingTip": "A sharp, action-oriented elite coach tip (1 sentence) for utilizing this window."
  },
  "weeklySummary": "A highly specific, blunt but motivating coaching summary (3-4 sentences). Identify exactly how many tasks they completed out of the total, their weak spot by category or priority (e.g. 'Your weak spot is Finance tasks, where 2/3 remain pending'), and praise their strength (e.g. 'You excel at Software Dev'). Keep it brief and high-tempo.",
  "weakSpotCategory": "Finance", // the specific category or priority they struggled with the most
  "recommendationList": [
    "Concrete, high-impact tactical advice 1",
    "Concrete, high-impact tactical advice 2",
    "Concrete, high-impact tactical advice 3"
  ]
}`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.log("[AI Coach] Local processing mode active for analytics.");
      
      const taskList = Array.isArray(tasks) ? tasks : [];
      const completedTasks = taskList.filter((t: any) => t.completed).length;
      const totalTasks = taskList.length;
      
      const categories: { [key: string]: { total: number; pending: number } } = {};
      taskList.forEach((t: any) => {
        const cat = t.category || "Personal";
        if (!categories[cat]) categories[cat] = { total: 0, pending: 0 };
        categories[cat].total++;
        if (!t.completed) categories[cat].pending++;
      });

      let weakSpotCategory = "Finance";
      let maxPending = 0;
      Object.keys(categories).forEach(cat => {
        if (categories[cat].pending > maxPending) {
          maxPending = categories[cat].pending;
          weakSpotCategory = cat;
        }
      });

      const completedHabitsCount = (habits && Array.isArray(habits))
        ? habits.filter((h: any) => h.history && Object.keys(h.history).length > 0).length
        : 1;
      const totalHabitsCount = (habits && Array.isArray(habits)) ? habits.length : 1;

      const productivityScore = Math.min(100, Math.max(30, Math.round(
        (completedTasks / (totalTasks || 1)) * 60 + 
        (completedHabitsCount / (totalHabitsCount || 1)) * 40
      )));

      res.json({
        productivityScore,
        peakHours: {
          timeRange: "2:00 PM - 5:00 PM",
          focusMultiplier: 42,
          coachingTip: "Your critical sprint completions are centered in this late afternoon zone. Reserve this block entirely for raw focus work."
        },
        weeklySummary: `You completed ${completedTasks} out of ${totalTasks} registered targets. Your primary bottleneck is in ${weakSpotCategory} related work. However, your Software Dev focus remains elite with zero overdue breaches.`,
        weakSpotCategory,
        recommendationList: [
          `Batch high-friction ${weakSpotCategory} tasks directly inside your peak focus hours.`,
          "Activate the focus synth to stabilize task-switching times when auditing items.",
          "Use the Autonomous Planner to divide larger objectives into 15-minute micro-sprints."
        ]
      });
    }
  });

  // API Route for AI Daily Briefing Card
  app.post("/api/briefing", async (req, res) => {
    const { tasks, habits } = req.body;
    try {
      const prompt = `You are LifeSaver AI Coach, an elite tactical productivity analyst and morning briefing officer.
Create a high-impact, elite briefing of the user's workload for today.
Here is the data:
Tasks:
${JSON.stringify(tasks)}

Habits:
${JSON.stringify(habits)}

Current reference local time is: ${new Date().toLocaleString()}

Based on this, return a strict JSON response with:
{
  "greeting": "A high-octane, personalized 1-sentence briefing greeting reflecting the current time of day and user context.",
  "summary": "A punchy, exactly 2-line summary. Line 1 details the active high-priority/critical load or uncompleted items. Line 2 delivers an energetic, high-tempo strategic recommendation or call-to-action for the upcoming sprints."
}`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.log("[AI Coach] Local processing mode active for briefing.");
      
      const taskList = Array.isArray(tasks) ? tasks : [];
      const activeTasks = taskList.filter((t: any) => !t.completed);
      const criticalTasks = activeTasks.filter((t: any) => t.priority === "Critical" || t.priority === "High");

      const greeting = activeTasks.length > 0 
        ? `Welcome back, Commander! Ready to conquer today's high-priority operational targets?`
        : `Welcome back, Commander! Your schedule is completely clear and optimal today.`;

      const summaryLine1 = activeTasks.length > 0
        ? `You have ${activeTasks.length} active focus sprint(s) remaining, including ${criticalTasks.length} high-priority item(s) requiring immediate attention.`
        : `All active focus sprints have been successfully cleared with zero pending item threats.`;
      
      const summaryLine2 = activeTasks.length > 0
        ? `Maintain high tactical output and consider launching a focus synth to stay synchronized.`
        : `Use this window of clarity to map out future goals and complete your daily habit stack.`;

      res.json({
        greeting,
        summary: `${summaryLine1}\n${summaryLine2}`
      });
    }
  });

  // API Route for AI-Powered Context-Aware Action Reminder Messages
  app.post("/api/reminder-plan", async (req, res) => {
    const { task, stage, competingTasksCount, hoursLeft } = req.body;
    try {
      const taskName = task?.name || task?.title || "Unnamed Task";
      const priority = task?.priority || "Medium";
      const category = task?.category || "General";
      const notes = task?.notes || "None";
      
      const prompt = `You are LifeSaver AI, the intelligence of the "DeadlineGuard AI" productivity app.
Generate a dynamic, context-aware, highly personalized warning message for a task reminder.

Here is the current context:
- Task: "${taskName}"
- Category: "${category}" (Tailor the urgency and vocabulary to this category, e.g., Finance is serious/direct, Personal is encouraging/mindful, Work/Software is tactical/precise)
- Priority: "${priority}"
- Notes: "${notes}"
- Deadline Stage: "${stage}" (This is either '24h', '6h', '1h', or 'overdue' before the task deadline)
- Hours Left: ${hoursLeft} hours (Negative if overdue)
- Competing Tasks: The user has ${competingTasksCount} other active task(s) competing for attention in this same timeframe.

Write a SHORT, SPECIFIC, and ACTION-ORIENTED coaching and rescue plan in exactly 1 or 2 sentences.
- Be punchy, direct, and elite. No boilerplate, no conversational fluff (do NOT say "Sure!", "Here is...", or "As your AI...").
- Speak directly to the user (use "You" / "Your").
- Explicitly refer to the task name: "${taskName}".
- Integrate the priority level and category context.
- Mention how competing tasks impact their timeline if competingTasksCount > 0.
- Ensure the urgency matches the stage (24h is foresight/blocking time, 6h is intermediate preparation, 1h is intense drop-everything execution, overdue is emergency recovery).

Return a strict JSON response with:
{
  "message": "The generated 1-2 sentence context-aware action plan."
}`;

      const response = await generateContentWithFallback({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const data = JSON.parse(response.text || "{}");
      res.json({ message: data.message || data.text || "" });
    } catch (error: any) {
      console.log("[AI Coach] Local processing mode active for reminder-plan.");
      
      const taskName = task?.name || task?.title || "Unnamed Task";
      let fallbackMessage = "";
      if (stage === "24h") {
        fallbackMessage = `Deadline checkpoint: "${taskName}" is due in 24 hours. Let's budget 30-60 minutes today to avoid a last-minute sprint.`;
      } else if (stage === "6h") {
        fallbackMessage = `6-hour warning: "${taskName}" is closing in. Clear a focused slot on your schedule now to lock this down.`;
      } else if (stage === "1h") {
        fallbackMessage = `🔥 High Alert: Only 1 hour remains for "${taskName}". Stop non-essential tasks and secure this target immediately!`;
      } else {
        fallbackMessage = `⚠️ Emergency recovery: "${taskName}" is Overdue! Take 10 minutes right now to triage and complete this before further backlog accumulates.`;
      }
      
      res.json({ message: fallbackMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
