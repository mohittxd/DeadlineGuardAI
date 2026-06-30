import React, { useState, useEffect, useRef } from "react";
import { 
  LifeBuoy, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Zap, 
  AlertTriangle, 
  Award, 
  Sparkles, 
  BellRing,
  Flame,
  Trophy, 
  Activity, 
  ShieldAlert, 
  RefreshCw,
  Search,
  Hourglass,
  Mic,
  Volume2,
  VolumeX,
  Calendar,
  Grid,
  CheckCircle2,
  TrendingUp,
  Download,
  AlertCircle,
  ShieldCheck,
  Check,
  Bell,
  Sliders,
  Terminal,
  Target,
  FileText,
  LogIn,
  LogOut,
  Archive,
  ArrowUpRight,
  User as UserIcon,
  Columns,
  Eye,
  EyeOff,
  Layout,
  Sun,
  Moon,
  CloudRain,
  Waves,
  Music,
  Radio,
  Pin,
  PinOff,
  GripVertical,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task, ChatMessage, Habit, AIRecommendation, WeeklyGoal, HabitHistoryEntry } from "./types";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User as FirebaseUser 
} from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function getDefaultTasks(): Task[] {
  return [
    {
      id: "t1",
      name: "Deploy emergency production hotfix patch",
      priority: "Critical",
      deadline: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      duration: 15,
      completed: false,
      createdAt: new Date().toISOString(),
      matrixQuadrant: "doFirst",
      category: "Software Dev"
    },
    {
      id: "t2",
      name: "Prepare high-impact marketing slides draft",
      priority: "High",
      deadline: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
      duration: 45,
      completed: false,
      createdAt: new Date().toISOString(),
      matrixQuadrant: "schedule",
      category: "Business"
    },
    {
      id: "t3",
      name: "Respond to customer service escalate tickets",
      priority: "Medium",
      deadline: new Date(Date.now() + 240 * 60 * 1000).toISOString(),
      duration: 20,
      completed: false,
      createdAt: new Date().toISOString(),
      matrixQuadrant: "delegate",
      category: "Business"
    },
    {
      id: "t4",
      name: "Revamp database index structures",
      priority: "High",
      deadline: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      completed: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      matrixQuadrant: "doFirst",
      category: "Software Dev"
    },
    {
      id: "t5",
      name: "Audit quarterly tax obligations",
      priority: "Critical",
      deadline: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
      duration: 45,
      completed: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
      matrixQuadrant: "doFirst",
      category: "Finance"
    },
    {
      id: "t6",
      name: "Review annual financial targets",
      priority: "High",
      deadline: new Date(Date.now() - 68 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      completed: true,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 68 * 60 * 60 * 1000).toISOString(),
      matrixQuadrant: "schedule",
      category: "Finance"
    },
    {
      id: "t7",
      name: "Read academic research paper on LLMs",
      priority: "Low",
      deadline: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      completed: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      matrixQuadrant: "defer",
      category: "Academics"
    },
    {
      id: "t8",
      name: "Plan next week's meal prep",
      priority: "Low",
      deadline: new Date(Date.now() - 95 * 60 * 60 * 1000).toISOString(),
      duration: 15,
      completed: true,
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 95 * 60 * 60 * 1000).toISOString(),
      matrixQuadrant: "defer",
      category: "Personal"
    }
  ];
}

function getDefaultChatHistory(): ChatMessage[] {
  return [
    {
      id: "welcome",
      role: "model",
      text: "Deadline Guard AI active and locked in! 🚨 Tight deadlines? Overwhelming tasks? We don't panic here. We focus and conquer.\n\nAdd your urgent tasks below, click any of the **Quick Tactical Commands** to get immediate battle plans, or ask me for help directly. Let's make this happen!",
      timestamp: new Date().toISOString(),
    }
  ];
}

function getStartOfWeekDate(dateInput?: Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const day = d.getDay();
  // Adjust so Monday is 1, Sunday is 7 or 0 (we can use Monday as start of week)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function getTodayDateString(): string {
  const local = new Date();
  const offset = local.getTimezoneOffset();
  const adjusted = new Date(local.getTime() - (offset * 60 * 1000));
  return adjusted.toISOString().split("T")[0];
}

function getDefaultWeeklyGoals(): WeeklyGoal[] {
  const startOfWeek = getStartOfWeekDate();
  return [
    {
      id: "wg1",
      name: "Complete 3 Critical Focus Sprints",
      type: "numeric",
      completed: false,
      targetValue: 3,
      currentValue: 1,
      unit: "sprints",
      weekStartDate: startOfWeek,
      status: "active",
      archived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "wg2",
      name: "Review next week's threat list on Sunday",
      type: "checkbox",
      completed: false,
      weekStartDate: startOfWeek,
      status: "active",
      archived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "wg3",
      name: "Keep daily habit completion rate above 80%",
      type: "checkbox",
      completed: false,
      weekStartDate: startOfWeek,
      status: "active",
      archived: false,
      createdAt: new Date().toISOString()
    }
  ];
}

function getDefaultHabitHistory(): HabitHistoryEntry[] {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split("T")[0];
  return [
    { id: "hist1", habitId: "h1", date: yesterday, completed: true, isFrozen: false },
    { id: "hist2", habitId: "h1", date: twoDaysAgo, completed: true, isFrozen: false },
    { id: "hist3", habitId: "h2", date: yesterday, completed: true, isFrozen: false },
    { id: "hist4", habitId: "h2", date: twoDaysAgo, completed: true, isFrozen: false },
    { id: "hist5", habitId: "h3", date: yesterday, completed: false, isFrozen: true },
    { id: "hist6", habitId: "h4", date: yesterday, completed: true, isFrozen: false },
  ];
}

function getDefaultHabits(): Habit[] {
  return [
    { id: "h1", name: "Drink 500ml pure water for physical hydration", streak: 3, longestStreak: 12, completedToday: false, frequency: "Daily", streakFreezesRemaining: 2 },
    { id: "h2", name: "Uninterrupted focus mode: No phone block", streak: 6, longestStreak: 15, completedToday: false, frequency: "Every Focus Block", streakFreezesRemaining: 2 },
    { id: "h3", name: "Deep posture check and physical stretches", streak: 2, longestStreak: 5, completedToday: false, frequency: "Daily", streakFreezesRemaining: 2 },
    { id: "h4", name: "Box breathing reset (2 mins core inhale-hold-exhale)", streak: 4, longestStreak: 8, completedToday: false, frequency: "Every Focus Block", streakFreezesRemaining: 2 }
  ];
}

function getDefaultRecommendations(): AIRecommendation {
  return {
    combatReadinessRating: 82,
    threatAssessment: "Amber",
    risksDetected: ["High density workload in next 2 hours", "Production patch deadline is critically close"],
    recommendations: [
      "Initiate a 15-minute focused emergency sprint for task 'Deploy emergency production hotfix patch' immediately.",
      "Postpone non-urgent slide edits to prevent context fatigue.",
      "Commit to 2 minutes of box breathing to stabilize heart-rate before starting code deploy."
    ],
    motivationalQuote: "The difference between pressure and panic is a timed combat plan. Breathe and execute."
  };
}

function getDefaultAnalyticsData() {
  return {
    productivityScore: 78,
    peakHours: {
      timeRange: "2:00 PM - 5:00 PM",
      focusMultiplier: 42,
      coachingTip: "Your critical sprint completions are centered in this late afternoon zone. Reserve this block entirely for raw focus work."
    },
    weeklySummary: "You completed 5 out of 8 registered targets this week. Your primary bottleneck is in Finance related work, where tasks take on average 120% longer than expected. However, your Software Dev focus remains elite with zero overdue breaches.",
    weakSpotCategory: "Finance",
    recommendationList: [
      "Batch high-friction Finance and Admin tasks directly inside your peak focus hours.",
      "Activate the Drone Synth to stabilize task-switching times when auditing invoices.",
      "Use the Autonomous Planner to divide tax files into 15-minute micro-objectives."
    ]
  };
}

function getDefaultDailyBriefing() {
  return {
    greeting: "Welcome back, Commander! Ready to conquer today's high-priority operational targets?",
    summary: "You have 3 active focus sprints remaining, led by 'Refactor legacy auth verification flow' under Software Dev.\nMaintain high tactical output and consider launching a binaural focus synth to stay synchronized."
  };
}

interface BlueprintTask {
  name: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  duration: number;
  offsetMinutes: number;
}

interface Blueprint {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  tasks: BlueprintTask[];
}

const MISSION_BLUEPRINTS: Blueprint[] = [
  {
    id: "bp-dev",
    name: "DevOps Emergency Patch",
    category: "Software Dev",
    icon: "terminal",
    description: "Designed for immediate debugging, patch building, and verifying container clusters under stress.",
    tasks: [
      {
        name: "Trace server panic logs & query deadlocks in production database",
        priority: "Critical",
        duration: 15,
        offsetMinutes: 20
      },
      {
        name: "Build optimized hotfix package & deploy to staging sandbox",
        priority: "High",
        duration: 25,
        offsetMinutes: 50
      },
      {
        name: "Run automated E2E API stress testing checks",
        priority: "Medium",
        duration: 15,
        offsetMinutes: 75
      },
      {
        name: "Sync with stakeholders & compile post-incident feedback summary",
        priority: "Low",
        duration: 20,
        offsetMinutes: 110
      }
    ]
  },
  {
    id: "bp-exam",
    name: "Intense Study Cram Block",
    category: "Academics",
    icon: "target",
    description: "Max-efficiency learning structure optimized for memory retention and formula practice under pressure.",
    tasks: [
      {
        name: "Active Recall: Quiz with 20 high-yield concepts cards",
        priority: "High",
        duration: 35,
        offsetMinutes: 45
      },
      {
        name: "Timed Trial: Execute mock practice test paper section A",
        priority: "High",
        duration: 60,
        offsetMinutes: 120
      },
      {
        name: "Error Auditing: Deep dive into incorrect practice test answers",
        priority: "Medium",
        duration: 25,
        offsetMinutes: 160
      },
      {
        name: "Mental Mapping: Create one-page flowchart of critical equations",
        priority: "Low",
        duration: 15,
        offsetMinutes: 185
      }
    ]
  },
  {
    id: "bp-creative",
    name: "High-Impact Creator Blast",
    category: "Media / Content",
    icon: "sparkles",
    description: "Accelerated creative sequence for content writing, editing raw media, and final assets launch.",
    tasks: [
      {
        name: "Storyboards: Outline conceptual draft & scripting cues",
        priority: "High",
        duration: 30,
        offsetMinutes: 45
      },
      {
        name: "Fidelity Craft: Edit high-retention timeline cuts & audio tracks",
        priority: "High",
        duration: 50,
        offsetMinutes: 110
      },
      {
        name: "Asset Design: Render clickable custom thumbnail variants",
        priority: "Medium",
        duration: 25,
        offsetMinutes: 145
      },
      {
        name: "Pre-Flight Prep: Schedule social copywriting sequences & email updates",
        priority: "Low",
        duration: 20,
        offsetMinutes: 175
      }
    ]
  },
  {
    id: "bp-exec",
    name: "Executive Deck Polish",
    category: "Business",
    icon: "filetext",
    description: "Intense sprint to polish strategic presentation decks, integrate key metrics, and lock slide flows.",
    tasks: [
      {
        name: "Structure Audit: Align slides narrative to major goal outcomes",
        priority: "High",
        duration: 30,
        offsetMinutes: 40
      },
      {
        name: "Telemetry Integration: Fetch & plot visual metrics charts in deck",
        priority: "High",
        duration: 40,
        offsetMinutes: 90
      },
      {
        name: "Validation Pass: Correct typography alignments & brand colors",
        priority: "Medium",
        duration: 20,
        offsetMinutes: 120
      },
      {
        name: "Dress Rehearsal: Perform timing audit with mock audio run",
        priority: "Medium",
        duration: 15,
        offsetMinutes: 145
      }
    ]
  }
];

const getBlueprintIcon = (iconName: string) => {
  switch (iconName) {
    case "terminal": return Terminal;
    case "sparkles": return Sparkles;
    case "filetext": return FileText;
    case "target":
    default:
      return Target;
  }
};

export default function App() {
  // ----------------------------------------------------
  // States & Local Storage Core Loaders
  // ----------------------------------------------------
  
  // Tab layout: Board, Matrix, Smart Schedule, Habits, Autonomous Agent
  const [activeTab, setActiveTab] = useState<"board" | "matrix" | "schedule" | "habits" | "autonomous" | "analytics" | "ai-ops">("board");

  // Theme state: dark or light
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("lifesaver_theme");
    return (saved as "dark" | "light") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("lifesaver_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  // Layout mode: split (Default columns), cinema (Focused immersive sprint)
  const [layoutMode, setLayoutMode] = useState<"split" | "cinema">("split");

  // Context-aware reminder banner states
  const [showReminderBanner, setShowReminderBanner] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_show_reminder_banner");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [reminderPerspective, setReminderPerspective] = useState<"tactical" | "motivational" | "minimal">(() => {
    try {
      const saved = localStorage.getItem("lifesaver_reminder_perspective");
      return (saved as "tactical" | "motivational" | "minimal") || "tactical";
    } catch {
      return "tactical";
    }
  });

  useEffect(() => {
    localStorage.setItem("lifesaver_show_reminder_banner", JSON.stringify(showReminderBanner));
  }, [showReminderBanner]);

  useEffect(() => {
    localStorage.setItem("lifesaver_reminder_perspective", reminderPerspective);
  }, [reminderPerspective]);

  // Right column pinning and open/close drawer states
  const [rightColumnPinned, setRightColumnPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_right_column_pinned");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [isRightColumnOpen, setIsRightColumnOpen] = useState(false);

  // Compact mode toggle state
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_compact_mode");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Hide completed tasks state
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_hide_completed");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem("lifesaver_right_column_pinned", JSON.stringify(rightColumnPinned));
  }, [rightColumnPinned]);

  useEffect(() => {
    localStorage.setItem("lifesaver_compact_mode", JSON.stringify(compactMode));
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem("lifesaver_hide_completed", JSON.stringify(hideCompleted));
  }, [hideCompleted]);

  // Ambient continuous focus synth loops & blending mixer
  const [synthPlaying, setSynthPlaying] = useState(false);
  const [binauralActive, setBinauralActive] = useState(true);
  const [binauralVol, setBinauralVol] = useState(0.4);
  const [binauralBeat, setBinauralBeat] = useState(6); // 6Hz default (Theta waves)
  const [binauralCarrier, setBinauralCarrier] = useState(140); // 140Hz

  const [rainActive, setRainActive] = useState(true);
  const [rainVol, setRainVol] = useState(0.5);
  const [rainFreq, setRainFreq] = useState(800); // 800Hz filter

  const [droneActive, setDroneActive] = useState(false);
  const [droneVol, setDroneVol] = useState(0.3);
  const [dronePitch, setDronePitch] = useState(110); // 110Hz

  const [oceanActive, setOceanActive] = useState(false);
  const [oceanVol, setOceanVol] = useState(0.4);
  const [oceanSpeed, setOceanSpeed] = useState(0.08); // 0.08Hz surf cycle speed

  const [masterVol, setMasterVol] = useState(0.7);

  // Audio refs
  const ambientSynthAudioCtxRef = useRef<AudioContext | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);

  const binauralNodesRef = useRef<{ oscL: OscillatorNode; oscR: OscillatorNode; gain: GainNode } | null>(null);
  const rainNodesRef = useRef<{ source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null>(null);
  const droneNodesRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; filter: BiquadFilterNode; lfo: OscillatorNode; lfoGain: GainNode; gain: GainNode } | null>(null);
  const oceanNodesRef = useRef<{ source: AudioBufferSourceNode; filter: BiquadFilterNode; lfo: OscillatorNode; lfoGain: GainNode; gain: GainNode } | null>(null);

  const pinkNoiseBufferRef = useRef<AudioBuffer | null>(null);
  const brownNoiseBufferRef = useRef<AudioBuffer | null>(null);

  // Helper functions to lazily build noise buffers
  const getPinkNoiseBuffer = (ctx: AudioContext) => {
    if (pinkNoiseBufferRef.current) return pinkNoiseBufferRef.current;
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
    pinkNoiseBufferRef.current = buffer;
    return buffer;
  };

  const getBrownNoiseBuffer = (ctx: AudioContext) => {
    if (brownNoiseBufferRef.current) return brownNoiseBufferRef.current;
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    brownNoiseBufferRef.current = buffer;
    return buffer;
  };

  const updateBinauralChannel = (ctx: AudioContext, active: boolean, volume: number, beat: number, carrier: number) => {
    const now = ctx.currentTime;
    if (!active || !synthPlaying) {
      if (binauralNodesRef.current) {
        const { oscL, oscR, gain } = binauralNodesRef.current;
        try {
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          setTimeout(() => {
            try {
              oscL.stop();
              oscR.stop();
              oscL.disconnect();
              oscR.disconnect();
              gain.disconnect();
            } catch {}
          }, 200);
        } catch {}
        binauralNodesRef.current = null;
      }
      return;
    }

    if (!binauralNodesRef.current) {
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gain = ctx.createGain();
      const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      oscL.type = "sine";
      oscR.type = "sine";

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.2);

      if (pannerL && pannerR) {
        pannerL.pan.setValueAtTime(-1, now);
        pannerR.pan.setValueAtTime(1, now);
        oscL.connect(pannerL);
        pannerL.connect(gain);
        oscR.connect(pannerR);
        pannerR.connect(gain);
      } else {
        oscL.connect(gain);
        oscR.connect(gain);
      }

      if (masterGainNodeRef.current) {
        gain.connect(masterGainNodeRef.current);
      } else {
        gain.connect(ctx.destination);
      }

      oscL.start(now);
      oscR.start(now);

      binauralNodesRef.current = { oscL, oscR, gain };
    }

    const nodes = binauralNodesRef.current;
    if (nodes) {
      nodes.oscL.frequency.setTargetAtTime(carrier, now, 0.1);
      nodes.oscR.frequency.setTargetAtTime(carrier + beat, now, 0.1);
      nodes.gain.gain.setTargetAtTime(volume * 0.15, now, 0.1);
    }
  };

  const updateRainChannel = (ctx: AudioContext, active: boolean, volume: number, freq: number) => {
    const now = ctx.currentTime;
    if (!active || !synthPlaying) {
      if (rainNodesRef.current) {
        const { source, filter, gain } = rainNodesRef.current;
        try {
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          setTimeout(() => {
            try {
              source.stop();
              source.disconnect();
              filter.disconnect();
              gain.disconnect();
            } catch {}
          }, 200);
        } catch {}
        rainNodesRef.current = null;
      }
      return;
    }

    if (!rainNodesRef.current) {
      const buffer = getPinkNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.setValueAtTime(1, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.2);

      source.connect(filter);
      filter.connect(gain);

      if (masterGainNodeRef.current) {
        gain.connect(masterGainNodeRef.current);
      } else {
        gain.connect(ctx.destination);
      }

      source.start(now);

      rainNodesRef.current = { source, filter, gain };
    }

    const nodes = rainNodesRef.current;
    if (nodes) {
      nodes.filter.frequency.setTargetAtTime(freq, now, 0.15);
      nodes.gain.gain.setTargetAtTime(volume * 0.45, now, 0.1);
    }
  };

  const updateDroneChannel = (ctx: AudioContext, active: boolean, volume: number, pitch: number) => {
    const now = ctx.currentTime;
    if (!active || !synthPlaying) {
      if (droneNodesRef.current) {
        const { osc1, osc2, filter, lfo, lfoGain, gain } = droneNodesRef.current;
        try {
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
              lfo.stop();
              osc1.disconnect();
              osc2.disconnect();
              lfo.disconnect();
              lfoGain.disconnect();
              filter.disconnect();
              gain.disconnect();
            } catch {}
          }, 200);
        } catch {}
        droneNodesRef.current = null;
      }
      return;
    }

    if (!droneNodesRef.current) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = "triangle";
      osc2.type = "triangle";
      lfo.type = "sine";
      filter.type = "lowpass";

      osc1.frequency.setValueAtTime(pitch, now);
      osc2.frequency.setValueAtTime(pitch * 1.006, now);
      lfo.frequency.setValueAtTime(0.12, now);
      lfoGain.gain.setValueAtTime(100, now);
      filter.frequency.setValueAtTime(pitch * 2.5, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.22, now + 0.2);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);

      if (masterGainNodeRef.current) {
        gain.connect(masterGainNodeRef.current);
      } else {
        gain.connect(ctx.destination);
      }

      osc1.start(now);
      osc2.start(now);
      lfo.start(now);

      droneNodesRef.current = { osc1, osc2, filter, lfo, lfoGain, gain };
    }

    const nodes = droneNodesRef.current;
    if (nodes) {
      nodes.osc1.frequency.setTargetAtTime(pitch, now, 0.2);
      nodes.osc2.frequency.setTargetAtTime(pitch * 1.006, now, 0.2);
      nodes.gain.gain.setTargetAtTime(volume * 0.22, now, 0.1);
    }
  };

  const updateOceanChannel = (ctx: AudioContext, active: boolean, volume: number, speed: number) => {
    const now = ctx.currentTime;
    if (!active || !synthPlaying) {
      if (oceanNodesRef.current) {
        const { source, filter, lfo, lfoGain, gain } = oceanNodesRef.current;
        try {
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.15);
          setTimeout(() => {
            try {
              source.stop();
              lfo.stop();
              source.disconnect();
              lfo.disconnect();
              lfoGain.disconnect();
              filter.disconnect();
              gain.disconnect();
            } catch {}
          }, 200);
        } catch {}
        oceanNodesRef.current = null;
      }
      return;
    }

    if (!oceanNodesRef.current) {
      const buffer = getBrownNoiseBuffer(ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(speed, now);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(volume * 0.25, now);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      const baseGain = ctx.createGain();
      baseGain.gain.setValueAtTime(volume * 0.15, now);

      source.connect(filter);
      filter.connect(gain);
      filter.connect(baseGain);

      if (masterGainNodeRef.current) {
        gain.connect(masterGainNodeRef.current);
        baseGain.connect(masterGainNodeRef.current);
      } else {
        gain.connect(ctx.destination);
        baseGain.connect(ctx.destination);
      }

      source.start(now);
      lfo.start(now);

      oceanNodesRef.current = { source, filter, lfo, lfoGain, gain };
    }

    const nodes = oceanNodesRef.current;
    if (nodes) {
      nodes.lfo.frequency.setTargetAtTime(speed, now, 0.2);
      nodes.lfoGain.gain.setTargetAtTime(volume * 0.25, now, 0.1);
    }
  };

  useEffect(() => {
    if (synthPlaying) {
      try {
        if (!ambientSynthAudioCtxRef.current) {
          ambientSynthAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = ambientSynthAudioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const now = ctx.currentTime;

        if (!masterGainNodeRef.current) {
          const masterGain = ctx.createGain();
          masterGain.gain.setValueAtTime(masterVol, now);
          masterGain.connect(ctx.destination);
          masterGainNodeRef.current = masterGain;
        } else {
          masterGainNodeRef.current.gain.setTargetAtTime(masterVol, now, 0.1);
        }

        updateBinauralChannel(ctx, binauralActive, binauralVol, binauralBeat, binauralCarrier);
        updateRainChannel(ctx, rainActive, rainVol, rainFreq);
        updateDroneChannel(ctx, droneActive, droneVol, dronePitch);
        updateOceanChannel(ctx, oceanActive, oceanVol, oceanSpeed);

      } catch (err) {
        console.warn("Error running atmosphere mixer audio:", err);
      }
    } else {
      try {
        const ctx = ambientSynthAudioCtxRef.current;
        if (ctx) {
          const now = ctx.currentTime;
          if (masterGainNodeRef.current) {
            masterGainNodeRef.current.gain.setTargetAtTime(0, now, 0.15);
          }
          updateBinauralChannel(ctx, false, 0, 0, 0);
          updateRainChannel(ctx, false, 0, 0);
          updateDroneChannel(ctx, false, 0, 0);
          updateOceanChannel(ctx, false, 0, 0);
        }
      } catch (err) {
        console.warn("Error shutting down atmosphere mixer:", err);
      }
    }
  }, [
    synthPlaying,
    binauralActive, binauralVol, binauralBeat, binauralCarrier,
    rainActive, rainVol, rainFreq,
    droneActive, droneVol, dronePitch,
    oceanActive, oceanVol, oceanSpeed,
    masterVol
  ]);

  useEffect(() => {
    return () => {
      try {
        if (binauralNodesRef.current) {
          binauralNodesRef.current.oscL.stop();
          binauralNodesRef.current.oscR.stop();
        }
        if (rainNodesRef.current) {
          rainNodesRef.current.source.stop();
        }
        if (droneNodesRef.current) {
          droneNodesRef.current.osc1.stop();
          droneNodesRef.current.osc2.stop();
          droneNodesRef.current.lfo.stop();
        }
        if (oceanNodesRef.current) {
          oceanNodesRef.current.source.stop();
          oceanNodesRef.current.lfo.stop();
        }
      } catch {}
    };
  }, []);

  // Breathing stress relief tracker for Cinema focus layout
  const [breathingState, setBreathingState] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingCounter, setBreathingCounter] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathingCounter((prev) => {
        if (prev <= 1) {
          if (breathingState === "inhale") {
            setBreathingState("hold");
            return 4;
          } else if (breathingState === "hold") {
            setBreathingState("exhale");
            return 4;
          } else {
            setBreathingState("inhale");
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [breathingState]);

  // Firebase Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncCompletedRef = useRef(false);

  // Session / Website usage tracking (seconds)
  const [sessionTime, setSessionTime] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_total_time_spent");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const totalTimeSpentRef = useRef(totalTimeSpent);
  useEffect(() => {
    totalTimeSpentRef.current = totalTimeSpent;
  }, [totalTimeSpent]);

  // Listen for Firebase Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    playTacticalSound("click");
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      playTacticalSound("success");
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      // Suppress standard popup close or block errors, show friendly text
      if (err.code !== "auth/popup-closed-by-user") {
        const msg = err.message || String(err);
        if (msg.includes("api-key-not-valid") || msg.includes("API key not valid") || msg.toLowerCase().includes("api key")) {
          setAuthError("Firebase API Key is currently initializing in Google Cloud (usually takes 2-5 minutes). Offline/Guest Mode is fully enabled in the meantime — your tasks, habits, and progress are saved locally!");
        } else {
          setAuthError(msg || "Sign-In failed.");
        }
      }
    }
  };

  const resetToDefaultStates = () => {
    setTasks(getDefaultTasks());
    setChatHistory(getDefaultChatHistory());
    setHabits(getDefaultHabits());
    setWeeklyGoals(getDefaultWeeklyGoals());
    setHabitHistory(getDefaultHabitHistory());
    setRecommendations(getDefaultRecommendations());
    setAnalyticsData(getDefaultAnalyticsData());
    setDailyBriefing(getDefaultDailyBriefing());
    setTotalTimeSpent(0);

    localStorage.removeItem("lifesaver_tasks");
    localStorage.removeItem("lifesaver_chat");
    localStorage.removeItem("lifesaver_habits");
    localStorage.removeItem("lifesaver_weekly_goals");
    localStorage.removeItem("lifesaver_habit_history");
    localStorage.removeItem("lifesaver_recommendations");
    localStorage.removeItem("lifesaver_analytics");
    localStorage.removeItem("lifesaver_daily_briefing");
    localStorage.removeItem("lifesaver_total_time_spent");
  };

  const handleSignOut = async () => {
    playTacticalSound("click");
    try {
      await signOut(auth);
      setUser(null);
      resetToDefaultStates();
      playTacticalSound("success");
    } catch (err: any) {
      console.error("Sign-Out Error:", err);
    }
  };

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_tasks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
      return getDefaultTasks();
    } catch {
      return getDefaultTasks();
    }
  });

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_chat");
      return saved ? JSON.parse(saved) : getDefaultChatHistory();
    } catch {
      return getDefaultChatHistory();
    }
  });

  // Habits state
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_habits");
      return saved ? JSON.parse(saved) : getDefaultHabits();
    } catch {
      return getDefaultHabits();
    }
  });

  // Weekly goals state
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_weekly_goals");
      return saved ? JSON.parse(saved) : getDefaultWeeklyGoals();
    } catch {
      return getDefaultWeeklyGoals();
    }
  });

  // Habit history state (to build heatmap/charts)
  const [habitHistory, setHabitHistory] = useState<HabitHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_habit_history");
      return saved ? JSON.parse(saved) : getDefaultHabitHistory();
    } catch {
      return getDefaultHabitHistory();
    }
  });

  // AI Diagnostic State
  const [recommendations, setRecommendations] = useState<AIRecommendation | null>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_recommendations");
      return saved ? JSON.parse(saved) : getDefaultRecommendations();
    } catch {
      return getDefaultRecommendations();
    }
  });

  // AI Analytics State
  const [analyticsData, setAnalyticsData] = useState<{
    productivityScore: number;
    peakHours: {
      timeRange: string;
      focusMultiplier: number;
      coachingTip: string;
    };
    weeklySummary: string;
    weakSpotCategory: string;
    recommendationList: string[];
  } | null>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_analytics");
      return saved ? JSON.parse(saved) : getDefaultAnalyticsData();
    } catch {
      return getDefaultAnalyticsData();
    }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // AI Daily Briefing State
  const [dailyBriefing, setDailyBriefing] = useState<{
    greeting: string;
    summary: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("lifesaver_daily_briefing");
      return saved ? JSON.parse(saved) : getDefaultDailyBriefing();
    } catch {
      return getDefaultDailyBriefing();
    }
  });
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Dynamic Auxiliary States
  // ----------------------------------------------------
  const [now, setNow] = useState<number>(Date.now());
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("High");
  const [newTaskDuration, setNewTaskDuration] = useState<number>(25);
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<string>("Software Dev");
  const [activeFilter, setActiveFilter] = useState<"All" | "Active" | "Critical" | "Completed">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Manual adding states for Matrix, Schedule, Habits
  const [matrixDoFirstInput, setMatrixDoFirstInput] = useState("");
  const [matrixScheduleInput, setMatrixScheduleInput] = useState("");
  const [matrixDelegateInput, setMatrixDelegateInput] = useState("");
  const [matrixDeferInput, setMatrixDeferInput] = useState("");

  const [schedMorningInput, setSchedMorningInput] = useState("");
  const [schedAfternoonInput, setSchedAfternoonInput] = useState("");
  const [schedEveningInput, setSchedEveningInput] = useState("");
  const [schedNightInput, setSchedNightInput] = useState("");

  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitFreq, setNewHabitFreq] = useState<"Daily" | "Every Focus Block">("Daily");

  // Weekly Goal form states
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalType, setNewGoalType] = useState<"checkbox" | "numeric">("checkbox");
  const [newGoalTarget, setNewGoalTarget] = useState<number>(3);
  const [newGoalUnit, setNewGoalUnit] = useState<string>("times");

  // Quick deadline form states inside Habits tab
  const [newQuickDeadlineName, setNewQuickDeadlineName] = useState("");
  const [newQuickDeadlineHrs, setNewQuickDeadlineHrs] = useState<number>(4);
  const [newQuickDeadlinePriority, setNewQuickDeadlinePriority] = useState<Task["priority"]>("High");

  // Show absolute clock times on quick offset shortcuts
  const [showAbsoluteTimes, setShowAbsoluteTimes] = useState(false);
  const [selectedOffset, setSelectedOffset] = useState<string | null>(null);

  // Focus Timer States
  const [timerTaskId, setTimerTaskId] = useState<string | null>("t1");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerOriginalDuration, setTimerOriginalDuration] = useState(25 * 60);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editTimerMinutes, setEditTimerMinutes] = useState("25");
  const [editTimerSeconds, setEditTimerSeconds] = useState("00");

  // Mobile Ticker Expandable state
  const [mobileMetricsExpanded, setMobileMetricsExpanded] = useState(false);

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Voice Speech & TTS states
  const [voiceListening, setVoiceListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Autonomous Agent Form states
  const [autonomousGoal, setAutonomousGoal] = useState("");
  const [agentPlanning, setAgentPlanning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [staggerHorizon, setStaggerHorizon] = useState<number>(4); // default 4 hours
  const [plannerTab, setPlannerTab] = useState<"decompose" | "optimize">("decompose");
  const [aiOpsSubTab, setAiOpsSubTab] = useState<"briefing" | "planner" | "diagnostics" | "analytics">("briefing");

  // AI loading and coaching feedback rationales
  const [matrixCoachingRationale, setMatrixCoachingRationale] = useState<string | null>("AI Prioritizer active. Run diagnostic prioritization below to map optimal threat combat vectors.");
  const [prioritizingLoader, setPrioritizingLoader] = useState(false);
  const [optimizingSchedule, setOptimizingSchedule] = useState(false);
  const [diagnosticsLoader, setDiagnosticsLoader] = useState(false);

  // Toast notices state
  const [activeReminders, setActiveReminders] = useState<{ id: string; text: string; taskName: string; type: "imminent" | "overdue" }[]>([]);

  // Context-Aware Reminder System States
  interface ContextToast {
    id: string;
    taskId: string;
    taskName: string;
    task: Task;
    stage: "24h" | "6h" | "1h" | "overdue";
    stageLabel: string;
    emoji: string;
    aiMessage: string | null; // null represents loading/Getting AI plan...
    fallbackMessage: string;
    createdAt: number;
    autoDismiss: boolean;
  }

  const [reminders, setReminders] = useState<ContextToast[]>([]);
  const [firedStages, setFiredStages] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const saved = localStorage.getItem("deadlineguard_fired_stages");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  // Scroll reference for chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------------------
  // Synchronization / Storage Watchers
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.setItem("lifesaver_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("lifesaver_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem("lifesaver_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("lifesaver_weekly_goals", JSON.stringify(weeklyGoals));
  }, [weeklyGoals]);

  useEffect(() => {
    localStorage.setItem("lifesaver_habit_history", JSON.stringify(habitHistory));
  }, [habitHistory]);

  useEffect(() => {
    fetchDailyBriefing();
  }, []);

  useEffect(() => {
    if (recommendations) {
      localStorage.setItem("lifesaver_recommendations", JSON.stringify(recommendations));
    }
  }, [recommendations]);

  useEffect(() => {
    if (analyticsData) {
      localStorage.setItem("lifesaver_analytics", JSON.stringify(analyticsData));
    }
  }, [analyticsData]);

  useEffect(() => {
    if (dailyBriefing) {
      localStorage.setItem("lifesaver_daily_briefing", JSON.stringify(dailyBriefing));
    }
  }, [dailyBriefing]);

  const syncWithPostgres = async (
    action: "load" | "save",
    clientData?: { tasks?: any[]; habits?: any[]; chatHistory?: any[] }
  ) => {
    if (!user) return null;
    try {
      const idToken = await user.getIdToken();
      if (action === "load") {
        const res = await fetch("/api/sync", {
          headers: {
            "Authorization": `Bearer ${idToken}`
          }
        });
        if (res.ok) {
          return await res.json();
        }
      } else {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            tasks: clientData?.tasks,
            habits: clientData?.habits,
            chatMessages: clientData?.chatHistory
          })
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch (err) {
      console.error("PostgreSQL sync error:", err);
    }
    return null;
  };

  // Load/sync data from Firestore and PostgreSQL on login
  useEffect(() => {
    if (!user) {
      syncCompletedRef.current = false;
      setIsSyncing(false);
      return;
    }

    const syncUserData = async () => {
      setIsSyncing(true);
      syncCompletedRef.current = false;
      try {
        const docRef = doc(db, "users", user.uid);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          return;
        }

        // Try syncing with Postgres (Cloud SQL) first
        const pgData = await syncWithPostgres("load");

        if (pgData && (pgData.tasks?.length > 0 || pgData.habits?.length > 0 || pgData.chatMessages?.length > 0)) {
          // PostgreSQL has active records! Populate client state and back up to Firestore
          if (pgData.tasks) {
            setTasks(pgData.tasks);
            localStorage.setItem("lifesaver_tasks", JSON.stringify(pgData.tasks));
          }
          if (pgData.habits) {
            setHabits(pgData.habits);
            localStorage.setItem("lifesaver_habits", JSON.stringify(pgData.habits));
          }
          if (pgData.chatMessages) {
            setChatHistory(pgData.chatMessages);
            localStorage.setItem("lifesaver_chat", JSON.stringify(pgData.chatMessages));
          }

          try {
            await setDoc(docRef, {
              tasks: pgData.tasks || tasks,
              habits: pgData.habits || habits,
              chatHistory: pgData.chatMessages || chatHistory,
              recommendations,
              analyticsData,
              dailyBriefing,
              totalTimeSpent,
              updatedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn("Could not backup PG data to Firestore:", e);
          }
          playTacticalSound("sync");
        } else if (docSnap && docSnap.exists()) {
          // PostgreSQL is empty but Firestore has data! Sync Firestore data to Postgres
          const data = docSnap.data();
          if (data.tasks) {
            setTasks(data.tasks);
            localStorage.setItem("lifesaver_tasks", JSON.stringify(data.tasks));
          }
          if (data.habits) {
            setHabits(data.habits);
            localStorage.setItem("lifesaver_habits", JSON.stringify(data.habits));
          }
          if (data.chatHistory) {
            setChatHistory(data.chatHistory);
            localStorage.setItem("lifesaver_chat", JSON.stringify(data.chatHistory));
          }
          if (data.recommendations) {
            setRecommendations(data.recommendations);
            localStorage.setItem("lifesaver_recommendations", JSON.stringify(data.recommendations));
          }
          if (data.analyticsData) {
            setAnalyticsData(data.analyticsData);
            localStorage.setItem("lifesaver_analytics", JSON.stringify(data.analyticsData));
          }
          if (data.dailyBriefing) {
            setDailyBriefing(data.dailyBriefing);
            localStorage.setItem("lifesaver_daily_briefing", JSON.stringify(data.dailyBriefing));
          }
          if (typeof data.totalTimeSpent === "number") {
            setTotalTimeSpent(data.totalTimeSpent);
            localStorage.setItem("lifesaver_total_time_spent", data.totalTimeSpent.toString());
          }

          // Push to Postgres
          await syncWithPostgres("save", {
            tasks: data.tasks || tasks,
            habits: data.habits || habits,
            chatHistory: data.chatHistory || chatHistory
          });
          playTacticalSound("sync");
        } else {
          // Completely new user: back up current local state to BOTH Firestore and Postgres
          try {
            await setDoc(docRef, {
              tasks,
              habits,
              chatHistory,
              recommendations,
              analyticsData,
              dailyBriefing,
              totalTimeSpent,
              updatedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn("Could not write initial Firestore document:", e);
          }

          await syncWithPostgres("save", { tasks, habits, chatHistory });
          playTacticalSound("sync");
        }
      } catch (err) {
        console.error("Error syncing during user login sequence:", err);
      } finally {
        setTimeout(() => {
          syncCompletedRef.current = true;
          setIsSyncing(false);
        }, 1500);
      }
    };

    syncUserData();
  }, [user]);

  // Auto-save changes to Firestore and PostgreSQL when user is logged in
  useEffect(() => {
    if (!user || !syncCompletedRef.current) return;
    
    const saveTimeout = setTimeout(async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, {
          tasks,
          habits,
          chatHistory,
          recommendations,
          analyticsData,
          dailyBriefing,
          totalTimeSpent,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Auto-save to PostgreSQL as well
        await syncWithPostgres("save", { tasks, habits, chatHistory });
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        } catch (wrappedErr) {
          console.error("Error auto-saving to Cloud databases:", wrappedErr);
        }
      }
    }, 1200); // Debounce to avoid excessive writes
    
    return () => clearTimeout(saveTimeout);
  }, [tasks, habits, chatHistory, recommendations, analyticsData, dailyBriefing, user]);

  // Periodically save totalTimeSpent to Firestore (every 60 seconds)
  useEffect(() => {
    if (!user || !syncCompletedRef.current) return;
    const interval = setInterval(async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, {
          totalTimeSpent: totalTimeSpentRef.current,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        } catch (wrappedErr) {
          console.error("Error syncing totalTimeSpent periodically:", wrappedErr);
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Live ticking clock driving overdue logic and warnings, and website usage timers
  useEffect(() => {
    const clock = setInterval(() => {
      setNow(Date.now());
      setSessionTime((prev) => prev + 1);
      setTotalTimeSpent((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem("lifesaver_total_time_spent", next.toString());
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Sync Focus Timer countdown & alarm checks
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            playTacticalSound("alert");
            alert("Sprinting Block Finished! Time to review and reload.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // request browser notification permission gracefully
  const requestNotificationPermission = () => {
    playTacticalSound("click");
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        setNotificationPermission(perm);
        if (perm === "granted") {
          playTacticalSound("success");
          try {
            new Notification("DeadlineGuard AI", {
              body: "Browser-level alerts activated! You will be notified of context-aware action plans.",
              icon: "/favicon.ico",
            });
          } catch (e) {
            console.error("Error showing welcome notification:", e);
          }
        } else if (perm === "denied") {
          playTacticalSound("alert");
        }
      });
    }
  };

  // View Task: load into focus timer, reset search filters, scroll & flash the element
  const handleViewTask = (task: Task) => {
    loadTaskIntoTimer(task);
    setSearchQuery("");
    setActiveFilter("All");
    
    setTimeout(() => {
      const el = document.getElementById(`task-${task.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-emerald-400", "ring-offset-2", "ring-offset-slate-950", "scale-[1.01]");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-emerald-400", "ring-offset-2", "ring-offset-slate-950", "scale-[1.01]");
        }, 4000);
      }
    }, 150);
  };

  // Context-aware reminders scheduler & checker (runs every 30 seconds)
  useEffect(() => {
    const checkDeadlines = () => {
      const nowMs = Date.now();
      const updatedFired = { ...firedStages };
      let changed = false;
      const newReminders: ContextToast[] = [];

      tasks.forEach((task) => {
        if (task.completed) return;

        const deadlineTime = new Date(task.deadline).getTime();
        const diffMs = deadlineTime - nowMs;
        const diffHours = diffMs / (1000 * 60 * 60);

        // Determine current urgency threshold stage
        let stage: "24h" | "6h" | "1h" | "overdue" | null = null;
        if (diffHours < 0) {
          stage = "overdue";
        } else if (diffHours <= 1) {
          stage = "1h";
        } else if (diffHours <= 6) {
          stage = "6h";
        } else if (diffHours <= 24) {
          stage = "24h";
        }

        if (stage) {
          if (!updatedFired[task.id]) {
            updatedFired[task.id] = {};
            changed = true;
          }

          // Trigger stage warning if it has not been fired yet for this task
          if (!updatedFired[task.id][stage]) {
            // Avoid double firing previous stages if a task is loaded/updated directly into a deeper stage
            if (stage === "overdue") {
              updatedFired[task.id]["24h"] = true;
              updatedFired[task.id]["6h"] = true;
              updatedFired[task.id]["1h"] = true;
            } else if (stage === "1h") {
              updatedFired[task.id]["24h"] = true;
              updatedFired[task.id]["6h"] = true;
            } else if (stage === "6h") {
              updatedFired[task.id]["24h"] = true;
            }

            updatedFired[task.id][stage] = true;
            changed = true;

            // Generate initial high-quality fallback message and styling attributes
            let fallbackMessage = "";
            let emoji = "🔔";
            let stageLabel = "";
            if (stage === "24h") {
              emoji = "📅";
              stageLabel = "24H Checkpoint";
              fallbackMessage = `Foresight Checkpoint: "${task.name}" is due tomorrow (24 hours left). Consider blocking out an hour today to avoid a last-minute sprint.`;
            } else if (stage === "6h") {
              emoji = "⏰";
              stageLabel = "6H Warning";
              fallbackMessage = `6-Hour Warning: "${task.name}" deadline is closing in. Clear a focused slot on your calendar and minimize distractions.`;
            } else if (stage === "1h") {
              emoji = "🔥";
              stageLabel = "1H High Alert";
              fallbackMessage = `🔥 High Alert: Only 1 hour left for "${task.name}". Stop non-essential work and lock onto this target now!`;
            } else {
              emoji = "🚨";
              stageLabel = "Overdue Breach";
              fallbackMessage = `⚠️ Emergency Triage: "${task.name}" has breached its deadline! Please resolve this immediately to avoid further backlog congestion.`;
            }

            const reminderId = `${task.id}-${stage}-${nowMs}`;
            newReminders.push({
              id: reminderId,
              taskId: task.id,
              taskName: task.name,
              task,
              stage,
              stageLabel,
              emoji,
              aiMessage: null, // start in loading/Getting AI plan... state
              fallbackMessage,
              createdAt: nowMs,
              autoDismiss: task.priority !== "Critical" && task.priority !== "High",
            });
          }
        }
      });

      if (changed) {
        setFiredStages(updatedFired);
        try {
          localStorage.setItem("deadlineguard_fired_stages", JSON.stringify(updatedFired));
        } catch (e) {
          console.error(e);
        }
      }

      if (newReminders.length > 0) {
        setReminders((prev) => [...prev, ...newReminders]);
        playTacticalSound("alert");

        // Fetch custom AI action messages asynchronously and update the notifications state
        newReminders.forEach((rem) => {
          const taskDeadline = new Date(rem.task.deadline).getTime();
          const twelveHours = 12 * 60 * 60 * 1000;
          // Contextual calculation of competing tasks due around the same timeframe
          const competingTasksCount = tasks.filter(t => 
            t.id !== rem.taskId && 
            !t.completed && 
            Math.abs(new Date(t.deadline).getTime() - taskDeadline) <= twelveHours
          ).length;

          const diffMs = new Date(rem.task.deadline).getTime() - Date.now();
          const hoursLeft = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

          fetch("/api/reminder-plan", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              task: rem.task,
              stage: rem.stage,
              competingTasksCount,
              hoursLeft,
            }),
          })
            .then((res) => {
              if (!res.ok) throw new Error("Server error fetching reminder plan");
              return res.json();
            })
            .then((data) => {
              const aiMsg = data.message || rem.fallbackMessage;
              
              // Update local state with the newly loaded AI action plan
              setReminders((prev) => 
                prev.map((r) => r.id === rem.id ? { ...r, aiMessage: aiMsg } : r)
              );

              // Simultaneously fire standard browser-level alert if permission is allowed
              if (Notification.permission === "granted") {
                try {
                  new Notification(`[${rem.stageLabel}] ${rem.taskName}`, {
                    body: aiMsg,
                    icon: "/favicon.ico",
                  });
                } catch (e) {
                  console.error("Browser Notification error:", e);
                }
              }
            })
            .catch((err) => {
              console.warn("Could not retrieve AI message for reminder, using high-quality local backup.", err);
              // Fail gracefully by reverting back to the localized action message
              setReminders((prev) => 
                prev.map((r) => r.id === rem.id ? { ...r, aiMessage: rem.fallbackMessage } : r)
              );

              if (Notification.permission === "granted") {
                try {
                  new Notification(`[${rem.stageLabel}] ${rem.taskName}`, {
                    body: rem.fallbackMessage,
                    icon: "/favicon.ico",
                  });
                } catch (e) {
                  console.error("Browser Notification error:", e);
                }
              }
            });
        });
      }
    };

    // Run verification on mount, and schedule periodic checks every 30 seconds
    checkDeadlines();
    const intervalId = setInterval(checkDeadlines, 30000);
    return () => clearInterval(intervalId);
  }, [tasks, firedStages]);

  // Auto-dismiss reminders after 15 seconds if autoDismiss is true
  useEffect(() => {
    const timer = setInterval(() => {
      const nowMs = Date.now();
      setReminders((prev) => 
        prev.filter((rem) => {
          if (!rem.autoDismiss) return true; // keep critical/high items indefinitely
          const ageSecs = (nowMs - rem.createdAt) / 1000;
          return ageSecs < 15; // keep if less than 15s old
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Default DateTime local field
  useEffect(() => {
    const defaultDate = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
    setNewTaskDeadline(formatForDateTimeLocal(defaultDate));
  }, []);

  // ----------------------------------------------------
  // Dynamic Web Sound Synthesizer
  // ----------------------------------------------------
  const playTacticalSound = (type: "alert" | "success" | "click" | "ambient" | "sync") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === "alert") {
        // High-pitch alert tone
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === "success") {
        // Double electronic success pitch
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === "ambient") {
        // Soft focus chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
        osc.frequency.setValueAtTime(440.00, audioCtx.currentTime + 0.15); // A4
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else if (type === "sync") {
        // Futuristic double-sweep or upload/download digital sound
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(450, audioCtx.currentTime + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.45);
        gain2.gain.setValueAtTime(0.06, audioCtx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
        osc2.start(audioCtx.currentTime + 0.15);
        osc2.stop(audioCtx.currentTime + 0.45);
      } else {
        // Quick subtle click
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      }
    } catch (e) {
      console.warn("Audio system muted or unsupported.", e);
    }
  };



  // ----------------------------------------------------
  // Date formatting helpers
  // ----------------------------------------------------
  function formatForDateTimeLocal(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }

  const getShortcutClockTime = (minutes: number) => {
    const d = new Date(now + minutes * 60 * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTonightClockTime = () => {
    const d = new Date(now);
    d.setHours(21, 0, 0, 0);
    if (d.getTime() < now) {
      d.setDate(d.getDate() + 1);
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTomorrowClockTime = () => {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const applyDeadlineShortcut = (minutesToAdd: number) => {
    playTacticalSound("click");
    const date = new Date(Date.now() + minutesToAdd * 60 * 1000);
    setNewTaskDeadline(formatForDateTimeLocal(date));
    setSelectedOffset(String(minutesToAdd));
  };

  const applyShortcutTonight = () => {
    playTacticalSound("click");
    const date = new Date();
    date.setHours(21, 0, 0, 0); // 9:00 PM tonight
    if (date.getTime() < Date.now()) {
      date.setDate(date.getDate() + 1);
    }
    setNewTaskDeadline(formatForDateTimeLocal(date));
    setSelectedOffset("tonight");
  };

  const applyShortcutTomorrow = () => {
    playTacticalSound("click");
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0); // 9:00 AM tomorrow
    setNewTaskDeadline(formatForDateTimeLocal(date));
    setSelectedOffset("tomorrow");
  };

  // ----------------------------------------------------
  // Task Actions
  // ----------------------------------------------------
  const focusTaskForm = () => {
    const inputEl = document.getElementById("task-name-input");
    if (inputEl) {
      inputEl.focus();
      inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
      playTacticalSound("click");
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    let taskDeadlineISO = "";
    try {
      if (newTaskDeadline) {
        const parsedDate = new Date(newTaskDeadline);
        if (!isNaN(parsedDate.getTime())) {
          taskDeadlineISO = parsedDate.toISOString();
        }
      }
    } catch (err) {
      console.warn("Invalid task deadline entered:", err);
    }

    if (!taskDeadlineISO) {
      // Fallback default: 2 hours from now
      taskDeadlineISO = new Date(Date.now() + 120 * 60 * 1000).toISOString();
    }

    const createdTask: Task = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      name: newTaskName.trim(),
      priority: newTaskPriority,
      deadline: taskDeadlineISO,
      duration: Number(newTaskDuration) || 20,
      completed: false,
      createdAt: new Date().toISOString(),
      matrixQuadrant: newTaskPriority === "Critical" ? "doFirst" : "schedule",
      category: newTaskCategory
    };

    setTasks((prev) => [createdTask, ...prev]);
    setNewTaskName("");
    setSelectedOffset(null);
    playTacticalSound("success");
    
    if (!timerActive) {
      setTimerTaskId(createdTask.id);
      setTimerSeconds(createdTask.duration * 60);
      setTimerOriginalDuration(createdTask.duration * 60);
    }
  };

  const toggleTaskComplete = (id: string) => {
    playTacticalSound("success");
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedStatus = !t.completed;
          return { 
            ...t, 
            completed: updatedStatus, 
            completedAt: updatedStatus ? new Date().toISOString() : undefined 
          };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    playTacticalSound("click");
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (timerTaskId === id) {
      setTimerTaskId(null);
      setTimerActive(false);
    }
  };

  // ----------------------------------------------------
  // Manual Task Hub helpers (Matrix, Day-Part, Habits)
  // ----------------------------------------------------
  const addTaskToMatrixQuadrant = (name: string, quadrant: "doFirst" | "schedule" | "delegate" | "defer") => {
    if (!name.trim()) return;

    let deadlineTime = Date.now();
    let priority: Task["priority"] = "Medium";

    if (quadrant === "doFirst") {
      deadlineTime = Date.now() + 120 * 60 * 1000;
      priority = "Critical";
    } else if (quadrant === "schedule") {
      deadlineTime = Date.now() + 24 * 60 * 60 * 1000;
      priority = "High";
    } else if (quadrant === "delegate") {
      deadlineTime = Date.now() + 8 * 60 * 60 * 1000;
      priority = "Medium";
    } else {
      deadlineTime = Date.now() + 72 * 60 * 60 * 1000;
      priority = "Low";
    }

    const createdTask: Task = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      priority,
      deadline: new Date(deadlineTime).toISOString(),
      duration: 30,
      completed: false,
      createdAt: new Date().toISOString(),
      matrixQuadrant: quadrant,
      category: "Personal"
    };

    setTasks((prev) => [createdTask, ...prev]);
    playTacticalSound("success");
    
    if (!timerActive) {
      setTimerTaskId(createdTask.id);
      setTimerSeconds(createdTask.duration * 60);
      setTimerOriginalDuration(createdTask.duration * 60);
    }
  };

  const handleMatrixSubmit = (e: React.FormEvent, quadrant: "doFirst" | "schedule" | "delegate" | "defer") => {
    e.preventDefault();
    let val = "";
    if (quadrant === "doFirst") { val = matrixDoFirstInput; setMatrixDoFirstInput(""); }
    else if (quadrant === "schedule") { val = matrixScheduleInput; setMatrixScheduleInput(""); }
    else if (quadrant === "delegate") { val = matrixDelegateInput; setMatrixDelegateInput(""); }
    else if (quadrant === "defer") { val = matrixDeferInput; setMatrixDeferInput(""); }

    addTaskToMatrixQuadrant(val, quadrant);
  };

  const addTaskToDayPartSlot = (name: string, slot: "morning" | "afternoon" | "evening" | "night") => {
    if (!name.trim()) return;

    const today = new Date();
    let targetHour = 14;

    if (slot === "morning") targetHour = 9;
    else if (slot === "afternoon") targetHour = 14;
    else if (slot === "evening") targetHour = 18;
    else if (slot === "night") targetHour = 22;

    today.setHours(targetHour, 0, 0, 0);

    if (today.getTime() <= Date.now()) {
      today.setDate(today.getDate() + 1);
    }

    const createdTask: Task = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      priority: "High",
      deadline: today.toISOString(),
      duration: 30,
      completed: false,
      createdAt: new Date().toISOString(),
      matrixQuadrant: slot === "morning" ? "doFirst" : "schedule",
      category: "Personal"
    };

    setTasks((prev) => [createdTask, ...prev]);
    playTacticalSound("success");

    if (!timerActive) {
      setTimerTaskId(createdTask.id);
      setTimerSeconds(createdTask.duration * 60);
      setTimerOriginalDuration(createdTask.duration * 60);
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent, slot: "morning" | "afternoon" | "evening" | "night") => {
    e.preventDefault();
    let val = "";
    if (slot === "morning") { val = schedMorningInput; setSchedMorningInput(""); }
    else if (slot === "afternoon") { val = schedAfternoonInput; setSchedAfternoonInput(""); }
    else if (slot === "evening") { val = schedEveningInput; setSchedEveningInput(""); }
    else if (slot === "night") { val = schedNightInput; setSchedNightInput(""); }

    addTaskToDayPartSlot(val, slot);
  };

  const handleAddCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const createdHabit: Habit = {
      id: "habit_" + Math.random().toString(36).substring(2, 9),
      name: newHabitName.trim(),
      streak: 0,
      longestStreak: 0,
      completedToday: false,
      frequency: newHabitFreq,
      streakFreezesRemaining: 2
    };

    setHabits((prev) => [...prev, createdHabit]);
    setNewHabitName("");
    playTacticalSound("success");
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    playTacticalSound("click");
  };

  const loadTaskIntoTimer = (task: Task) => {
    playTacticalSound("ambient");
    setTimerTaskId(task.id);
    setTimerSeconds(task.duration * 60);
    setTimerOriginalDuration(task.duration * 60);
    setTimerActive(true);
  };

  const handleSprintClick = (task: Task) => {
    if (timerTaskId === task.id) {
      setTimerActive(!timerActive);
      playTacticalSound("click");
    } else {
      loadTaskIntoTimer(task);
    }
  };



  const handleLoadBlueprint = (blueprint: typeof MISSION_BLUEPRINTS[0], mode: "append" | "overwrite") => {
    const newTasks: Task[] = blueprint.tasks.map((bt, idx) => ({
      id: `task_bp_${blueprint.id}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      name: bt.name,
      priority: bt.priority,
      deadline: new Date(Date.now() + bt.offsetMinutes * 60 * 1000).toISOString(),
      duration: bt.duration,
      completed: false,
      createdAt: new Date().toISOString(),
      matrixQuadrant: bt.priority === "Critical" ? "doFirst" : "schedule",
      category: blueprint.category
    }));

    if (mode === "overwrite") {
      setTasks(newTasks);
      setTimerTaskId(newTasks[0].id);
      setTimerSeconds(newTasks[0].duration * 60);
      setTimerOriginalDuration(newTasks[0].duration * 60);
      setTimerActive(false);
    } else {
      setTasks((prev) => [...newTasks, ...prev]);
    }

    playTacticalSound("success");

    // Add a welcome coaching message to chat history
    const bpWelcomeMessage: ChatMessage = {
      id: "chat_bp_" + Math.random().toString(36).substring(2, 9),
      role: "model",
      text: `🚨 **Blueprint Initiated: ${blueprint.name}**\n\nI have loaded ${blueprint.tasks.length} optimized tasks for your **${blueprint.category}** focus sprint. ${
        mode === "overwrite" 
          ? "The command table has been refreshed with this sequence." 
          : "These tasks have been added to your active combat timeline."
      }\n\n**Action plan recommendation:** Start with **"${blueprint.tasks[0].name}"** immediately! Let's get to work.`,
      timestamp: new Date().toISOString(),
    };

    setChatHistory((prev) => [...prev, bpWelcomeMessage]);
  };

  const loadGenericMinutes = (mins: number) => {
    playTacticalSound("click");
    setTimerTaskId(null);
    setTimerSeconds(mins * 60);
    setTimerOriginalDuration(mins * 60);
    setTimerActive(false);
  };

  const handleSaveManualTimer = () => {
    playTacticalSound("click");
    const m = parseInt(editTimerMinutes, 10) || 0;
    const s = parseInt(editTimerSeconds, 10) || 0;
    const totalSecs = (m * 60) + s;
    if (totalSecs >= 0) {
      setTimerTaskId(null);
      setTimerSeconds(totalSecs);
      setTimerOriginalDuration(totalSecs);
      setTimerActive(false);
    }
    setIsEditingTimer(false);
  };

  const formatTimerString = (secTotal: number) => {
    const mins = Math.floor(secTotal / 60);
    const secs = secTotal % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getWeeklyTrendData = () => {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
      const count = tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        const compTime = new Date(t.completedAt).getTime();
        return compTime >= startOfDay && compTime <= endOfDay;
      }).length;
      days.push({
        dayName: dayNames[d.getDay()],
        dateStr: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count
      });
    }
    return days;
  };

  // ----------------------------------------------------
  // Habits & Weekly Goals State Action Handlers
  // ----------------------------------------------------
  const toggleHabitComplete = (id: string) => {
    const today = getTodayDateString();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const completed = !h.completedToday;
          let streak = h.streak;
          let longest = h.longestStreak ?? 0;

          if (completed) {
            streak = streak + 1;
            if (streak > longest) {
              longest = streak;
            }
            playTacticalSound("success");
            // Add entry in history
            setHabitHistory((hist) => {
              const cleaned = hist.filter((e) => !(e.habitId === id && e.date === today));
              return [
                ...cleaned,
                {
                  id: "hist_" + Math.random().toString(36).substring(2, 9),
                  habitId: id,
                  date: today,
                  completed: true,
                  isFrozen: false,
                },
              ];
            });
          } else {
            streak = Math.max(0, streak - 1);
            playTacticalSound("click");
            // Remove entry in history
            setHabitHistory((hist) => hist.filter((e) => !(e.habitId === id && e.date === today)));
          }

          return {
            ...h,
            completedToday: completed,
            streak,
            longestStreak: longest,
            lastCompletedDate: completed ? today : undefined,
            streakFreezeUsedToday: false, // Completing a habit cancels today's freeze usage
          };
        }
        return h;
      })
    );
  };

  const toggleStreakFreeze = (habitId: string) => {
    playTacticalSound("click");
    const today = getTodayDateString();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const wasFrozen = !!h.streakFreezeUsedToday;
          if (!wasFrozen) {
            if ((h.streakFreezesRemaining || 0) <= 0) {
              return h; // No freezes left
            }
            // Add frozen entry to history
            setHabitHistory((hist) => {
              const cleaned = hist.filter((e) => !(e.habitId === habitId && e.date === today));
              return [
                ...cleaned,
                {
                  id: "hist_" + Math.random().toString(36).substring(2, 9),
                  habitId,
                  date: today,
                  completed: false,
                  isFrozen: true,
                },
              ];
            });
            return {
              ...h,
              streakFreezeUsedToday: true,
              streakFreezesRemaining: (h.streakFreezesRemaining || 1) - 1,
              completedToday: false, // frozen cannot be completed
            };
          } else {
            // Unfreeze (refund a freeze)
            setHabitHistory((hist) => hist.filter((e) => !(e.habitId === habitId && e.date === today)));
            return {
              ...h,
              streakFreezeUsedToday: false,
              streakFreezesRemaining: (h.streakFreezesRemaining || 0) + 1,
            };
          }
        }
        return h;
      })
    );
  };

  const handleAddWeeklyGoal = (
    name: string,
    type: "checkbox" | "numeric",
    targetValue?: number,
    unit?: string
  ) => {
    if (!name.trim()) return;
    playTacticalSound("success");
    const currentWeekStart = getStartOfWeekDate();
    const newGoal: WeeklyGoal = {
      id: "goal_" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      type,
      completed: false,
      targetValue: type === "numeric" ? targetValue || 1 : undefined,
      currentValue: type === "numeric" ? 0 : undefined,
      unit: type === "numeric" ? unit || "times" : undefined,
      weekStartDate: currentWeekStart,
      status: "active",
      archived: false,
      createdAt: new Date().toISOString(),
    };
    setWeeklyGoals((prev) => [newGoal, ...prev]);
  };

  const handleToggleWeeklyGoal = (id: string) => {
    playTacticalSound("click");
    setWeeklyGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const newCompleted = !g.completed;
          if (newCompleted) playTacticalSound("success");
          return {
            ...g,
            completed: newCompleted,
            currentValue: g.type === "numeric" ? (newCompleted ? g.targetValue : 0) : undefined,
          };
        }
        return g;
      })
    );
  };

  const handleUpdateGoalProgress = (id: string, amount: number) => {
    playTacticalSound("click");
    setWeeklyGoals((prev) =>
      prev.map((g) => {
        if (g.id === id && g.type === "numeric" && g.targetValue) {
          const newVal = Math.max(0, (g.currentValue || 0) + amount);
          const completed = newVal >= g.targetValue;
          if (completed && !g.completed) playTacticalSound("success");
          return {
            ...g,
            currentValue: newVal,
            completed,
          };
        }
        return g;
      })
    );
  };

  const handleRolloverGoal = (id: string) => {
    playTacticalSound("success");
    const currentWeekStart = getStartOfWeekDate();
    setWeeklyGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          return {
            ...g,
            weekStartDate: currentWeekStart,
            status: "active", // reactivate the goal for the new week
            completed: false,
            currentValue: g.type === "numeric" ? 0 : undefined,
          };
        }
        return g;
      })
    );
  };

  const handleArchiveGoal = (id: string) => {
    playTacticalSound("click");
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, archived: true } : g))
    );
  };

  const resetAllHabitsToday = () => {
    playTacticalSound("click");
    const today = getTodayDateString();
    setHabits((prev) =>
      prev.map((h) => ({
        ...h,
        completedToday: false,
        streakFreezeUsedToday: false,
      }))
    );
    setHabitHistory((hist) => hist.filter((e) => e.date !== today));
  };

  // Automated on-mount streak verification and weekly goals rollover resolver
  useEffect(() => {
    const resolveStreaksAndGoalsOnMount = () => {
      const today = getTodayDateString();
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const lastSessionDate = localStorage.getItem("lifesaver_last_session_date");

      if (lastSessionDate && lastSessionDate !== today) {
        // A new day is recognized!
        setHabits((prevHabits) =>
          prevHabits.map((h) => {
            let completedYesterday = h.lastCompletedDate === yesterday;
            let frozenYesterday = false;

            try {
              const savedHist = localStorage.getItem("lifesaver_habit_history");
              if (savedHist) {
                const hist: HabitHistoryEntry[] = JSON.parse(savedHist);
                const yesterdayEntry = hist.find((e) => e.habitId === h.id && e.date === yesterday);
                if (yesterdayEntry) {
                  if (yesterdayEntry.completed) completedYesterday = true;
                  if (yesterdayEntry.isFrozen) frozenYesterday = true;
                }
              }
            } catch (e) {
              console.error("Error reading yesterday's history for streak resolution:", e);
            }

            let newStreak = h.streak;
            // Streak breaks if not completed yesterday AND not frozen yesterday AND not already completed today
            if (!completedYesterday && !frozenYesterday && h.lastCompletedDate !== today) {
              newStreak = 0;
            }

            // Refund/award a freeze on Monday
            let freezes = h.streakFreezesRemaining ?? 2;
            const currentWeekStart = getStartOfWeekDate(new Date());
            const lastSessionWeekStart = getStartOfWeekDate(new Date(lastSessionDate));
            if (currentWeekStart !== lastSessionWeekStart) {
              freezes = Math.min(3, freezes + 1);
            }

            return {
              ...h,
              completedToday: false,
              streakFreezeUsedToday: false,
              streak: newStreak,
              streakFreezesRemaining: freezes,
            };
          })
        );

        // Transition old week goals to ended statuses
        const currentWeekStart = getStartOfWeekDate();
        setWeeklyGoals((prevGoals) =>
          prevGoals.map((g) => {
            if (g.weekStartDate !== currentWeekStart && g.status === "active") {
              return {
                ...g,
                status: g.completed ? "completed" : "missed",
              };
            }
            return g;
          })
        );
      }

      localStorage.setItem("lifesaver_last_session_date", today);
    };

    resolveStreaksAndGoalsOnMount();
  }, []);

  // ----------------------------------------------------
  // Calendar iCal (.ics) file exporter
  // ----------------------------------------------------
  const exportICSFile = () => {
    if (tasks.length === 0) {
      alert("Enlist some tasks on the combat board to export first!");
      return;
    }
    
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Deadline Guard AI//Combat Schedule Planner//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    
    tasks.forEach((task) => {
      const deadlineDate = new Date(task.deadline);
      const startDate = new Date(deadlineDate.getTime() - task.duration * 60 * 1000); // Start offset by duration
      
      const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      };
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${task.id}@lifesaver.ai\n`;
      icsContent += `DTSTAMP:${formatDate(new Date())}\n`;
      icsContent += `DTSTART:${formatDate(startDate)}\n`;
      icsContent += `DTEND:${formatDate(deadlineDate)}\n`;
      icsContent += `SUMMARY:[Deadline Guard AI] ${task.name}\n`;
      icsContent += `DESCRIPTION:Priority Threat Level: ${task.priority}\\nFocus Duration: ${task.duration} mins\\nStatus: ${task.completed ? "COMPLETED" : "ACTIVE LIVE DEADLINE"}\\nGenerated by Deadline Guard AI.\\n\n`;
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `deadline_guard_combat_schedule_${new Date().toISOString().split("T")[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playTacticalSound("success");
  };

  // ----------------------------------------------------
  // Speech & Voice Synthesizer
  // ----------------------------------------------------
  const startSpeechDictation = () => {
    setApiError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setApiError("Speech recognition is not supported in this browser. Please try Chrome, Safari, or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setVoiceListening(true);
      playTacticalSound("click");
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => (prev ? prev + " " + transcript : transcript));
      setVoiceListening(false);
      playTacticalSound("success");
    };
    
    recognition.onerror = (e: any) => {
      console.error("Voice input error:", e);
      setVoiceListening(false);
      if (e.error === "not-allowed") {
        setApiError("Microphone access was denied. Please check your browser's site settings or permissions for this iframe.");
      } else {
        setApiError(`Voice input error: ${e.error || "unknown"}. Try speaking clearly or checking microphone connection.`);
      }
    };
    
    recognition.onend = () => {
      setVoiceListening(false);
    };
    
    try {
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setApiError("Could not start speech recognition. Ensure no other apps are using your mic and try again.");
    }
  };

  const speakAIFeedback = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("Speech synthesis not supported in this environment.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\*\_`#\-]/g, ""); // strip markdown
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const priorityVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("David") || v.lang.startsWith("en"));
    if (priorityVoice) {
      utterance.voice = priorityVoice;
    }
    
    utterance.rate = 1.05; // sharp, speedy pacing
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
      setSpeakingMsgId(msgId);
    };
    
    utterance.onend = () => {
      setSpeakingMsgId(null);
    };
    
    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // ----------------------------------------------------
  // AI Operations (Integrations)
  // ----------------------------------------------------
  
  // 1. Intelligent task prioritization
  const runAIPrioritization = async () => {
    if (tasks.length === 0) {
      alert("Enlist some tasks to prioritize first!");
      return;
    }
    setPrioritizingLoader(true);
    playTacticalSound("click");
    try {
      const res = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      if (!res.ok) throw new Error("Backend failed to prioritze matrix.");
      const data = await res.json();
      
      if (data.quadrants) {
        setTasks((prev) =>
          prev.map((t) => {
            let quadrant: Task["matrixQuadrant"] = "schedule";
            if (data.quadrants.doFirst?.includes(t.id)) quadrant = "doFirst";
            else if (data.quadrants.schedule?.includes(t.id)) quadrant = "schedule";
            else if (data.quadrants.delegate?.includes(t.id)) quadrant = "delegate";
            else if (data.quadrants.defer?.includes(t.id)) quadrant = "defer";
            return { ...t, matrixQuadrant: quadrant };
          })
        );
      }
      if (data.coachingRationale) {
        setMatrixCoachingRationale(data.coachingRationale);
      }
      playTacticalSound("success");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to sort tasks.");
    } finally {
      setPrioritizingLoader(false);
    }
  };

  // 2. AI-powered scheduling assistance
  const runAISchedulingOptimization = async () => {
    if (tasks.length === 0) {
      alert("Enlist some tasks on the combat board first!");
      return;
    }
    setOptimizingSchedule(true);
    playTacticalSound("click");
    try {
      // Simulate/calculate non-overlapping slot allocation based on priority & duration
      // To keep UX responsive and secure, let's optimize locally based on smart timing sequence,
      // staggering from current time. Let's make it fully robust.
      let runningOffset = 20; // start 20 mins from now
      const sorted = [...tasks].sort((a, b) => {
        const priorityScore = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
        return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
      });

      const updated = sorted.map((t) => {
        const targetDeadline = new Date(Date.now() + (runningOffset + t.duration) * 60 * 1000).toISOString();
        runningOffset += t.duration + 10; // add 10 mins transition buffer!
        return { ...t, deadline: targetDeadline };
      });

      setTasks(updated);
      
      // Inject alert notice
      const logMsg: ChatMessage = {
        id: "schedule-log-" + Math.random().toString(36).substring(2, 5),
        role: "model",
        text: "🚨 SCHEDULE OPTIMIZED! I have staggered your deadlines based on threat level with built-in 10-minute mental transition buffers. Look at your 'Smart Schedule' timeline now!",
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, logMsg]);
      playTacticalSound("success");
    } catch (e: any) {
      console.error(e);
    } finally {
      setOptimizingSchedule(false);
    }
  };

  // 3. Personalized productivity recommendations (Diagnostics)
  const runAIDiagnostics = async () => {
    setDiagnosticsLoader(true);
    playTacticalSound("click");
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks })
      });
      if (!res.ok) throw new Error("Diagnostics API failed.");
      const data = await res.json();
      setRecommendations(data);
      playTacticalSound("success");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to load dynamic AI diagnostics.");
    } finally {
      setDiagnosticsLoader(false);
    }
  };

  // 3b. AI-Powered Productivity Analytics & Weekly Summary
  const fetchProductivityAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    playTacticalSound("click");
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits })
      });
      if (!res.ok) throw new Error("Analytics API failed.");
      const data = await res.json();
      setAnalyticsData(data);
      localStorage.setItem("lifesaver_analytics", JSON.stringify(data));
      playTacticalSound("success");
    } catch (e: any) {
      console.error(e);
      setAnalyticsError(e.message || "Failed to load AI productivity report.");
      playTacticalSound("alert");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // 3c. AI-Powered Daily Briefing & Greeting
  const fetchDailyBriefing = async () => {
    setBriefingLoading(true);
    setBriefingError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits })
      });
      if (!res.ok) throw new Error("Briefing API failed.");
      const data = await res.json();
      setDailyBriefing(data);
      localStorage.setItem("lifesaver_daily_briefing", JSON.stringify(data));
    } catch (e: any) {
      console.error(e);
      setBriefingError(e.message || "Failed to load AI daily briefing.");
    } finally {
      setBriefingLoading(false);
    }
  };

  // 4. Autonomous task planning and execution
  const runAutonomousPlanning = async (mode: "decompose" | "optimize-existing" = "decompose") => {
    if (mode === "decompose" && !autonomousGoal.trim()) return;
    if (mode === "optimize-existing" && tasks.filter(t => !t.completed).length === 0) {
      alert("No active tasks found to optimize! Add some tasks first.");
      return;
    }

    setAgentPlanning(true);
    setAgentLogs([]);
    playTacticalSound("click");
    
    const logs = mode === "decompose" 
      ? [
          "Initializing Autonomous Strategy Planner...",
          "Analyzing objective: '" + autonomousGoal + "'",
          "Setting stagger time horizon to " + staggerHorizon + " hours...",
          "Querying Google Gemini Model for sequence optimization...",
        ]
      : [
          "Initializing Workload Optimization Agent...",
          "Ingesting " + tasks.filter(t => !t.completed).length + " active tasks from the board...",
          "Analyzing current deadline dispersion over a " + staggerHorizon + "-hour horizon...",
          "Querying Google Gemini Model for load-balancing and sequencing...",
        ];

    // progressive log printer
    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        setAgentLogs(prev => [...prev, logs[logIdx]]);
        logIdx++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    try {
      const res = await fetch("/api/plan-autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          goal: mode === "decompose" ? autonomousGoal : undefined,
          tasks: mode === "optimize-existing" ? tasks.filter(t => !t.completed).map(t => ({ id: t.id, name: t.name, priority: t.priority, duration: t.duration })) : undefined,
          timeHorizon: staggerHorizon,
          currentTime: new Date().toLocaleString()
        })
      });

      if (!res.ok) throw new Error("Autonomous planning request failed.");
      const data = await res.json();

      // Complete progressive logs
      setTimeout(() => {
        setAgentLogs(prev => [
          ...prev,
          "Optimal tactical sequence retrieved from Gemini!",
          mode === "decompose" ? "Generating staggered deadlines..." : "Rescheduling existing workload into staggered deadlines...",
          "Deploying blueprint to board... Done!"
        ]);
      }, 1600);

      if (data.tasks && Array.isArray(data.tasks)) {
        if (mode === "decompose") {
          const newTasks: Task[] = data.tasks.map((t: any, index: number) => {
            const deadline = new Date(Date.now() + t.offsetMinutes * 60 * 1000).toISOString();
            return {
              id: "auto_" + Math.random().toString(36).substring(2, 9),
              name: t.name,
              priority: t.priority || "High",
              deadline,
              duration: t.duration || 15,
              completed: false,
              createdAt: new Date().toISOString(),
              matrixQuadrant: index === 0 ? "doFirst" : (index === 1 ? "schedule" : "delegate"),
              tacticalHint: t.tacticalHint
            };
          });

          setTimeout(() => {
            setTasks((prev) => [...newTasks, ...prev]);
            playTacticalSound("success");
            
            if (data.coachingBriefing) {
              const aiMsg: ChatMessage = {
                id: "auto-msg-" + Math.random().toString(36).substring(2, 9),
                role: "model",
                text: `🤖 **Autonomous Decomposition Successful!** I broke down your goal into ${newTasks.length} optimized micro-steps across a ${staggerHorizon}-hour horizon.\n\n**Strategy Briefing:** ${data.coachingBriefing}`,
                timestamp: new Date().toISOString()
              };
              setChatHistory(prev => [...prev, aiMsg]);
            }
            setAutonomousGoal("");
            setActiveTab("board");
          }, 3000);
        } else {
          // Optimize existing workload: update tasks with optimized deadlines, priorities, durations, and hints!
          setTimeout(() => {
            setTasks((prev) => {
              return prev.map(t => {
                const optimized = data.tasks.find((ot: any) => ot.id === t.id);
                if (optimized) {
                  const deadline = new Date(Date.now() + optimized.offsetMinutes * 60 * 1000).toISOString();
                  return {
                    ...t,
                    priority: optimized.priority || t.priority,
                    duration: optimized.duration || t.duration,
                    deadline,
                    tacticalHint: optimized.tacticalHint
                  };
                }
                return t;
              });
            });
            playTacticalSound("success");
            
            if (data.coachingBriefing) {
              const aiMsg: ChatMessage = {
                id: "auto-msg-" + Math.random().toString(36).substring(2, 9),
                role: "model",
                text: `⚡ **Workload Optimized!** I reorganized your active tasks, spaced out their deadlines, and added combat guidance for each.\n\n**Strategy Briefing:** ${data.coachingBriefing}`,
                timestamp: new Date().toISOString()
              };
              setChatHistory(prev => [...prev, aiMsg]);
            }
            setActiveTab("board");
          }, 3000);
        }
      }
    } catch (e: any) {
      console.error(e);
      setAgentLogs(prev => [...prev, "🚨 Plan generation interrupted: " + e.message]);
    } finally {
      setTimeout(() => {
        setAgentPlanning(false);
      }, 3500);
    }
  };

  // Standard coach chat
  const sendChatMessage = async (textToSend: string) => {
    if (!textToSend.trim() || chatLoading) return;

    setApiError(null);
    const userMsg: ChatMessage = {
      id: "chat_" + Math.random().toString(36).substring(2, 9),
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          tasks: tasks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Communication with Deadline Guard AI failed.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: "chat_" + Math.random().toString(36).substring(2, 9),
        role: "model",
        text: data.text || "I'm on it! Let me recalculate our options.",
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => [...prev, aiMsg]);
      playTacticalSound("success");
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Something jammed in the network lines. Try again!");
    } finally {
      setChatLoading(false);
    }
  };

  const triggerPresetAction = (commandType: "prioritize" | "plan" | "motivate" | "risk") => {
    let prompt = "";
    if (commandType === "prioritize") {
      prompt = "🚀 Prioritize my tasks immediately! Let me know what to tackle first and the exact logic behind it.";
    } else if (commandType === "plan") {
      prompt = "⏱️ Break my list down into an exact, timed combat battle plan. Give me minutes-based steps.";
    } else if (commandType === "motivate") {
      prompt = "🔥 I am feeling stuck, tired, or extremely stressed. Give me an intense, motivating coach's pep talk to get me focused right now!";
    } else if (commandType === "risk") {
      prompt = "⚠️ Scan my current schedule, detect potential risks or overlapping deadlines, and offer immediate relief plans.";
    }
    sendChatMessage(prompt);
  };

  const clearChatHistory = () => {
    if (confirm("Reset the strategy console chat log?")) {
      const initialWelcome: ChatMessage = {
        id: "welcome",
        role: "model",
        text: "Strategy console wiped. Deadline Guard AI is ready for new instructions! 🚨 Give me a quick preset command above or type your stress factor below. We've got this!",
        timestamp: new Date().toISOString(),
      };
      setChatHistory([initialWelcome]);
    }
  };

  // ----------------------------------------------------
  // Live deadline enriched analytics & categories mapping
  // ----------------------------------------------------
  const enrichedTasks = tasks.map((t) => {
    const diffMs = new Date(t.deadline).getTime() - now;
    const isOverdue = diffMs < 0 && !t.completed;
    const isUrgent = diffMs > 0 && diffMs < 60 * 60 * 1000 && !t.completed; // < 1 hour
    
    let timeLabel = "";
    if (t.completed) {
      timeLabel = "Completed Successfully";
    } else if (diffMs < 0) {
      const absDiff = Math.abs(diffMs);
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      timeLabel = `Overdue by ${hours > 0 ? `${hours}h ` : ""}${mins}m`;
    } else {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        timeLabel = `Due in ${days}d ${hours % 24}h`;
      } else {
        timeLabel = `Due in ${hours > 0 ? `${hours}h ` : ""}${mins}m`;
      }
    }

    // Determine Day Part slot for Scheduling assistant
    const taskHour = new Date(t.deadline).getHours();
    let dayPartSlot: "morning" | "afternoon" | "evening" | "night" = "afternoon";
    if (taskHour >= 6 && taskHour < 12) dayPartSlot = "morning";
    else if (taskHour >= 12 && taskHour < 17) dayPartSlot = "afternoon";
    else if (taskHour >= 17 && taskHour < 21) dayPartSlot = "evening";
    else dayPartSlot = "night";

    return {
      ...t,
      isOverdue,
      isUrgent,
      timeLabel,
      diffMs,
      dayPartSlot
    };
  });

  const filteredTasks = enrichedTasks.filter((t) => {
    if (searchQuery.trim() && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (hideCompleted && t.completed && activeFilter !== "Completed") {
      return false;
    }
    if (activeFilter === "Active") {
      return !t.completed;
    }
    if (activeFilter === "Critical") {
      return t.priority === "Critical" || t.isOverdue;
    }
    if (activeFilter === "Completed") {
      return t.completed;
    }
    return true; // All
  }).sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });

  // High-level aggregates
  const activeCount = enrichedTasks.filter((t) => !t.completed).length;
  const criticalCount = enrichedTasks.filter((t) => (t.priority === "Critical" || t.isOverdue) && !t.completed).length;
  const completedCount = enrichedTasks.filter((t) => t.completed).length;
  const completionPercentage = enrichedTasks.length > 0 ? Math.round((completedCount / enrichedTasks.length) * 100) : 0;
  const totalTimeRemaining = enrichedTasks.filter((t) => !t.completed).reduce((acc, t) => acc + t.duration, 0);

  // Overdue categorizations (High, Medium, Low)
  const overdueTasks = enrichedTasks.filter((t) => t.isOverdue && !t.completed);
  const overdueHighCount = overdueTasks.filter((t) => t.priority === "Critical" || t.priority === "High").length;
  const overdueMediumCount = overdueTasks.filter((t) => t.priority === "Medium").length;
  const overdueLowCount = overdueTasks.filter((t) => t.priority === "Low").length;

  const focusedTask = enrichedTasks.find((t) => t.id === timerTaskId);

  // Habits rate
  const completedHabitsCount = habits.filter(h => h.completedToday).length;
  const habitsRatePercent = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  const formatTimeSpent = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Dynamic context calculations for the Top Reminder Banner
  const nextUrgentTask = enrichedTasks
    .filter((t) => !t.completed && t.diffMs > 0)
    .sort((a, b) => a.diffMs - b.diffMs)[0];

  const mostOverdueTask = [...overdueTasks].sort((a, b) => a.diffMs - b.diffMs)[0];

  const nextTask = enrichedTasks
    .filter((t) => !t.completed && t.diffMs > 0)
    .sort((a, b) => a.diffMs - b.diffMs)[0] || enrichedTasks.filter((t) => !t.completed)[0];

  const reminderState: "timer" | "overdue" | "urgent" | "normal" | "all_clear" = (() => {
    if (timerActive && focusedTask) return "timer";
    if (overdueTasks.length > 0) return "overdue";
    if (enrichedTasks.some((t) => t.isUrgent && !t.completed)) return "urgent";
    if (activeCount > 0) return "normal";
    return "all_clear";
  })();

  const formatMsToDuration = (ms: number) => {
    if (ms <= 0) return "0m";
    const totalMinutes = Math.floor(ms / 60000);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const getReminderConfig = () => {
    switch (reminderState) {
      case "timer":
        return {
          icon: <Hourglass className="w-4 h-4 text-emerald-400 animate-spin" />,
          bgColor: "bg-emerald-950/90 border-emerald-500/20 text-emerald-100",
          accentColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 border-emerald-500/30",
          badge: "ACTIVE SPRINT",
          messages: {
            tactical: `TACTICAL IN-PROGRESS: Focus session active on "${focusedTask?.name}". ${formatTimerString(timerSeconds)} remaining. Maintain standard operational efficiency.`,
            motivational: `🔥 You're doing amazing! Keep your focus locked on "${focusedTask?.name}". You've got ${formatTimerString(timerSeconds)} left in this sprint—make it count!`,
            minimal: `Focus Sprint Active: "${focusedTask?.name}" (${formatTimerString(timerSeconds)})`
          },
          actionPlan: `Mute notification channels, focus on the immediate sub-step of "${focusedTask?.name}", and maintain deep focus until the countdown completes.`,
          action: {
            label: "Pause Sprint",
            onClick: () => { setTimerActive(false); playTacticalSound("click"); }
          }
        };
      case "overdue":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />,
          bgColor: "bg-rose-950/90 border-rose-500/20 text-rose-100",
          accentColor: "bg-rose-500/10 border-rose-500/20 text-rose-400 border-rose-500/30",
          badge: "OVERDUE BREACH",
          messages: {
            tactical: `CRITICAL ALERT: ${overdueTasks.length} task(s) breached deadline threshold! "${mostOverdueTask?.name}" requires immediate intervention. Re-route energy vectors now.`,
            motivational: `⚠️ Deep breath! Don't let the backlog overwhelm you. You have ${overdueTasks.length} overdue item(s). Let's resolve "${mostOverdueTask?.name}" right now!`,
            minimal: `CRITICAL BREACH: "${mostOverdueTask?.name}" is Overdue!`
          },
          actionPlan: `Launch an immediate 5-minute ultra-focused triage sprint on "${mostOverdueTask?.name}" to break the procrastination inertia.`,
          action: {
            label: "Sprint Now",
            onClick: () => {
              if (mostOverdueTask) {
                setTimerTaskId(mostOverdueTask.id);
                setTimerSeconds(mostOverdueTask.duration * 60);
                setTimerOriginalDuration(mostOverdueTask.duration * 60);
                setTimerActive(true);
                playTacticalSound("click");
              }
            }
          }
        };
      case "urgent":
        return {
          icon: <Zap className="w-4 h-4 text-amber-400 animate-pulse" />,
          bgColor: "bg-amber-950/90 border-amber-500/20 text-amber-100",
          accentColor: "bg-amber-500/10 border-amber-500/20 text-amber-400 border-amber-500/30",
          badge: "URGENT WARPING",
          messages: {
            tactical: `WARNING: High priority task approaching deadline boundary. "${nextUrgentTask?.name}" is imminent in ${formatMsToDuration(nextUrgentTask?.diffMs || 0)}. Check coordinates.`,
            motivational: `⚡ Heads up! "${nextUrgentTask?.name}" has a deadline coming up in ${formatMsToDuration(nextUrgentTask?.diffMs || 0)}. Let's get ahead of it together.`,
            minimal: `DEADLINE WARNING: "${nextUrgentTask?.name}" is closing in!`
          },
          actionPlan: `Isolate your workspace, lock onto "${nextUrgentTask?.name}", and initiate a tactical ${nextUrgentTask?.duration}-minute focus loop right now.`,
          action: {
            label: "Lock Target",
            onClick: () => {
              if (nextUrgentTask) {
                setTimerTaskId(nextUrgentTask.id);
                setTimerSeconds(nextUrgentTask.duration * 60);
                setTimerOriginalDuration(nextUrgentTask.duration * 60);
                setTimerActive(true);
                playTacticalSound("click");
              }
            }
          }
        };
      case "normal":
        return {
          icon: <Activity className="w-4 h-4 text-cyan-400" />,
          bgColor: "bg-slate-900/95 border-slate-800 text-slate-100",
          accentColor: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 border-cyan-500/30",
          badge: "TACTICAL SEQUENCE",
          messages: {
            tactical: `STANDBY: Routine workflow. ${activeCount} active task(s) on queue. Suggested path: "${nextTask?.name}" (estimated duration: ${nextTask?.duration} mins).`,
            motivational: `✨ You have ${activeCount} task(s) to crush today. Why not tackle "${nextTask?.name}" next? A quick ${nextTask?.duration}-minute sprint will keep your streak strong!`,
            minimal: `SCHEDULED: "${nextTask?.name}" (${nextTask?.duration}m) is queued.`
          },
          actionPlan: `Pre-load your assets, clear distracting browser tabs, and activate the focus sprint for "${nextTask?.name}".`,
          action: {
            label: "Initiate Focus",
            onClick: () => {
              if (nextTask) {
                setTimerTaskId(nextTask.id);
                setTimerSeconds(nextTask.duration * 60);
                setTimerOriginalDuration(nextTask.duration * 60);
                setTimerActive(true);
                playTacticalSound("click");
              }
            }
          }
        };
      case "all_clear":
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />,
          bgColor: "bg-emerald-950/60 border-emerald-500/20 text-emerald-100/90",
          accentColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 border-emerald-500/30",
          badge: "OPERATIONAL PEACE",
          messages: {
            tactical: "STATUS ALL-CLEAR: No pending tasks. Operational security achieved. Prepare new project vectors or run calibration routine.",
            motivational: "🎉 Amazing job! You've cleared your schedule and beaten every deadline. Grab a coffee, take a rest—you earned it!",
            minimal: "ALL DEADLINES SECURED: Focus arena is fully clear."
          },
          actionPlan: `Step away from the screen for 5 minutes, hydrate, stretch, and then map out your next milestone list.`,
          action: {
            label: "Add New Task",
            onClick: focusTaskForm
          }
        };
    }
  };

  // Helper to render the Strategy Hub right column content
  const renderRightColumnContent = () => {
    return (
      <>
        {/* AMBIENT FOCUS ATMOSPHERE SYNTHESIZER MIXER */}
        {false && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${synthPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
                <div>
                  <h2 className="font-display font-semibold text-xs md:text-sm text-white tracking-wide uppercase flex items-center gap-1">
                    Ambient Focus Synth <Sparkles className="w-3 h-3 text-amber-400" />
                  </h2>
                  <span className="text-[9px] text-slate-500 block font-mono">Continuous Multi-Channel Sound Blender</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Pin/Unpin Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    playTacticalSound("click");
                    setRightColumnPinned(!rightColumnPinned);
                    if (rightColumnPinned) {
                      setIsRightColumnOpen(false);
                    }
                  }}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title={rightColumnPinned ? "Unpin Right Column (enables full-width task board, collapses this side)" : "Pin Right Column"}
                >
                  {rightColumnPinned ? (
                    <PinOff className="w-3.5 h-3.5 text-slate-400 hover:text-red-400 transition-colors" />
                  ) : (
                    <Pin className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>

                {/* MASTER POWER BUTTON */}
                <button
                type="button"
                onClick={() => {
                  playTacticalSound("click");
                  setSynthPlaying(!synthPlaying);
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5 transition-all border ${
                  synthPlaying 
                    ? "bg-emerald-950/80 border-emerald-800/80 text-emerald-400 shadow-lg shadow-emerald-950/30" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                } cursor-pointer`}
              >
                {synthPlaying ? (
                  <>
                    <Pause className="w-2.5 h-2.5 fill-current" /> Stop Ambient
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 fill-current" /> Launch Atmosphere
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ATMOSPHERE PRESETS */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-[8px] md:text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                  Atmosphere Presets:
                </span>
                {synthPlaying && (
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-1.5 py-0.2 rounded-full animate-pulse">
                    Synthesizing Live Audio
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1 text-[9px]">
                <button
                  type="button"
                  onClick={() => {
                    playTacticalSound("success");
                    setSynthPlaying(true);
                    setBinauralActive(true); setBinauralVol(0.5); setBinauralBeat(6); setBinauralCarrier(140);
                    setRainActive(true); setRainVol(0.5); setRainFreq(850);
                    setDroneActive(false); setDroneVol(0);
                    setOceanActive(false); setOceanVol(0);
                  }}
                  className="px-1.5 py-1 text-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-lg text-slate-300 font-mono transition-all text-[8px] truncate cursor-pointer"
                  title="Theta binaural beats blended with filtered rain shower"
                >
                  ⚡ Stormy Focus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTacticalSound("success");
                    setSynthPlaying(true);
                    setBinauralActive(false); setBinauralVol(0);
                    setRainActive(false); setRainVol(0);
                    setDroneActive(true); setDroneVol(0.6); setDronePitch(110);
                    setOceanActive(true); setOceanVol(0.5); setOceanSpeed(0.08);
                  }}
                  className="px-1.5 py-1 text-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-lg text-slate-300 font-mono transition-all text-[8px] truncate cursor-pointer"
                  title="Low-frequency cosmic drone blended with a heavy ocean swell"
                >
                  🌌 Cosmic Deep
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTacticalSound("success");
                    setSynthPlaying(true);
                    setBinauralActive(false); setBinauralVol(0);
                    setRainActive(true); setRainVol(0.4); setRainFreq(700);
                    setDroneActive(false); setDroneVol(0);
                    setOceanActive(true); setOceanVol(0.6); setOceanSpeed(0.12);
                  }}
                  className="px-1.5 py-1 text-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-lg text-slate-300 font-mono transition-all text-[8px] truncate cursor-pointer"
                  title="Rainfall blended with warm ocean surf waves"
                >
                  🌊 Coastal Rain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTacticalSound("success");
                    setSynthPlaying(true);
                    setBinauralActive(true); setBinauralVol(0.6); setBinauralBeat(10); setBinauralCarrier(160);
                    setRainActive(false); setRainVol(0);
                    setDroneActive(true); setDroneVol(0.4); setDronePitch(130);
                    setOceanActive(false); setOceanVol(0);
                  }}
                  className="px-1.5 py-1 text-center bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded-lg text-slate-300 font-mono transition-all text-[8px] truncate cursor-pointer"
                  title="Alpha binaural beats with deep synthesizer background drone"
                >
                  🧠 Brain Charger
                </button>
              </div>
            </div>

            {/* MASTER VOLUME SLIDER */}
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 mb-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] shrink-0">
                <VolumeX className="w-3.5 h-3.5" />
                <span>Master Vol</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(masterVol * 100)}
                onChange={(e) => setMasterVol(parseFloat(e.target.value) / 100)}
                className="flex-1 accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] shrink-0">
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="w-8 text-right">{Math.round(masterVol * 100)}%</span>
              </div>
            </div>

            {/* 4-CHANNEL CHANNELS BLENDER MIXER BOARD */}
            <div className="space-y-2">
              <span className="block text-[8px] md:text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Channel Mixing Console:
              </span>

              {/* CHANNEL 1: BINAURAL BEATS */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                binauralActive && synthPlaying 
                  ? "bg-slate-950/90 border-violet-900/40 text-violet-100" 
                  : "bg-slate-950/30 border-slate-800/40 text-slate-500"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        playTacticalSound("click");
                        setBinauralActive(!binauralActive);
                      }}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        binauralActive && synthPlaying 
                          ? "bg-violet-950/50 text-violet-400 border border-violet-800/50" 
                          : "bg-slate-900 text-slate-600 border border-slate-800"
                      }`}
                      title={binauralActive ? "Mute Binaural beats" : "Unmute Binaural beats"}
                    >
                      <Radio className="w-3 h-3" />
                    </button>
                    <div>
                      <span className="text-[10px] font-semibold block leading-tight">Binaural Beats</span>
                      <span className="text-[8px] text-slate-500 block font-mono">Carrier: {binauralCarrier}Hz • Beat: {binauralBeat}Hz (Theta)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500">
                    <span>Vol: {Math.round(binauralVol * 100)}%</span>
                  </div>
                </div>

                {binauralActive && synthPlaying && (
                  <div className="space-y-1.5 mt-2 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Volume</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(binauralVol * 100)}
                        onChange={(e) => setBinauralVol(parseFloat(e.target.value) / 100)}
                        className="flex-1 accent-violet-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Beat rate</span>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={binauralBeat}
                        onChange={(e) => setBinauralBeat(parseInt(e.target.value))}
                        className="flex-1 accent-violet-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Carrier</span>
                      <input
                        type="range"
                        min="100"
                        max="300"
                        value={binauralCarrier}
                        onChange={(e) => setBinauralCarrier(parseInt(e.target.value))}
                        className="flex-1 accent-violet-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CHANNEL 2: COZY RAIN SHOWER */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                rainActive && synthPlaying 
                  ? "bg-slate-950/90 border-emerald-900/40 text-emerald-100" 
                  : "bg-slate-950/30 border-slate-800/40 text-slate-500"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        playTacticalSound("click");
                        setRainActive(!rainActive);
                      }}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        rainActive && synthPlaying 
                          ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50" 
                          : "bg-slate-900 text-slate-600 border border-slate-800"
                      }`}
                      title={rainActive ? "Mute Rain shower" : "Unmute Rain shower"}
                    >
                      <CloudRain className="w-3 h-3" />
                    </button>
                    <div>
                      <span className="text-[10px] font-semibold block leading-tight">Rain Shower</span>
                      <span className="text-[8px] text-slate-500 block font-mono">Filtered Pink Noise • Filter: {rainFreq}Hz</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500">
                    <span>Vol: {Math.round(rainVol * 100)}%</span>
                  </div>
                </div>

                {rainActive && synthPlaying && (
                  <div className="space-y-1.5 mt-2 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Volume</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(rainVol * 100)}
                        onChange={(e) => setRainVol(parseFloat(e.target.value) / 100)}
                        className="flex-1 accent-emerald-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Filter freq</span>
                      <input
                        type="range"
                        min="300"
                        max="1500"
                        value={rainFreq}
                        onChange={(e) => setRainFreq(parseInt(e.target.value))}
                        className="flex-1 accent-emerald-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CHANNEL 3: COSMIC SPACE DRONE */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                droneActive && synthPlaying 
                  ? "bg-slate-950/90 border-amber-900/40 text-amber-100" 
                  : "bg-slate-950/30 border-slate-800/40 text-slate-500"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        playTacticalSound("click");
                        setDroneActive(!droneActive);
                      }}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        droneActive && synthPlaying 
                          ? "bg-amber-950/50 text-amber-400 border border-amber-800/50" 
                          : "bg-slate-900 text-slate-600 border border-slate-800"
                      }`}
                      title={droneActive ? "Mute Cosmic Drone" : "Unmute Cosmic Drone"}
                    >
                      <Music className="w-3 h-3" />
                    </button>
                    <div>
                      <span className="text-[10px] font-semibold block leading-tight">Cosmic Space Drone</span>
                      <span className="text-[8px] text-slate-500 block font-mono">Dual Triangle Waves • Pitch: {dronePitch}Hz</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500">
                    <span>Vol: {Math.round(droneVol * 100)}%</span>
                  </div>
                </div>

                {droneActive && synthPlaying && (
                  <div className="space-y-1.5 mt-2 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Volume</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(droneVol * 100)}
                        onChange={(e) => setDroneVol(parseFloat(e.target.value) / 100)}
                        className="flex-1 accent-amber-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Drone pitch</span>
                      <input
                        type="range"
                        min="55"
                        max="220"
                        value={dronePitch}
                        onChange={(e) => setDronePitch(parseInt(e.target.value))}
                        className="flex-1 accent-amber-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CHANNEL 4: OCEAN SURF WAVES */}
              <div className={`p-2.5 rounded-xl border transition-all ${
                oceanActive && synthPlaying 
                  ? "bg-slate-950/90 border-emerald-900/40 text-emerald-100" 
                  : "bg-slate-950/30 border-slate-800/40 text-slate-500"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        playTacticalSound("click");
                        setOceanActive(!oceanActive);
                      }}
                      className={`p-1 rounded-md transition-all cursor-pointer ${
                        oceanActive && synthPlaying 
                          ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50" 
                          : "bg-slate-900 text-slate-600 border border-slate-800"
                      }`}
                      title={oceanActive ? "Mute Ocean Surf" : "Unmute Ocean Surf"}
                    >
                      <Waves className="w-3 h-3" />
                    </button>
                    <div>
                      <span className="text-[10px] font-semibold block leading-tight">Ocean Surf Waves</span>
                      <span className="text-[8px] text-slate-500 block font-mono">Brownian Noise LFO • Cycle Speed: {oceanSpeed}Hz</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500">
                    <span>Vol: {Math.round(oceanVol * 100)}%</span>
                  </div>
                </div>

                {oceanActive && synthPlaying && (
                  <div className="space-y-1.5 mt-2 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Volume</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(oceanVol * 100)}
                        onChange={(e) => setOceanVol(parseFloat(e.target.value) / 100)}
                        className="flex-1 accent-emerald-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[8px]">
                      <span className="text-slate-500 w-12 font-mono">Cycle speed</span>
                      <input
                        type="range"
                        min="4"
                        max="20"
                        value={Math.round(oceanSpeed * 100)}
                        onChange={(e) => setOceanSpeed(parseFloat(e.target.value) / 100)}
                        className="flex-1 accent-emerald-500 h-0.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* DEADLINE GUARD AI CHAT CONSOLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex-1 flex flex-col min-h-[450px] relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-display font-semibold text-xs md:text-sm text-white tracking-wide uppercase">
                  Deadline Guard AI
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Pin/Unpin Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    playTacticalSound("click");
                    setRightColumnPinned(!rightColumnPinned);
                    if (rightColumnPinned) {
                      setIsRightColumnOpen(false);
                    }
                  }}
                  className="p-1 hover:bg-slate-950 text-slate-500 hover:text-emerald-400 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title={rightColumnPinned ? "Unpin Deadline Guard (dock to right corner of page)" : "Pin Deadline Guard to Right Column"}
                >
                  {rightColumnPinned ? (
                    <PinOff className="w-3.5 h-3.5 text-slate-400 hover:text-red-400 transition-colors" />
                  ) : (
                    <Pin className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>

                <button
                  onClick={clearChatHistory}
                  className="text-slate-500 hover:text-emerald-400 hover:bg-slate-950 p-1 rounded-lg transition-all cursor-pointer"
                  title="Reset strategy log"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* QUICK PRE-SET TACTICAL ACTION PILLS */}
            <div className="mb-2.5">
              <span className="block text-[8px] md:text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Quick Commands:
              </span>
              <div className="grid grid-cols-4 gap-1 text-[9px] md:text-[10px]">
                <button
                  onClick={() => triggerPresetAction("prioritize")}
                  disabled={chatLoading}
                  className="bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 py-1 px-1 rounded-md text-center font-medium transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer truncate"
                  title="Prioritize List"
                >
                  🚀 Prioritize
                </button>
                <button
                  onClick={() => triggerPresetAction("plan")}
                  disabled={chatLoading}
                  className="bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 py-1 px-1 rounded-md text-center font-medium transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer truncate"
                  title="Timed Plan"
                >
                  ⏱️ Plan
                </button>
                <button
                  onClick={() => triggerPresetAction("motivate")}
                  disabled={chatLoading}
                  className="bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 py-1 px-1 rounded-md text-center font-medium transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer truncate"
                  title="Motivate Me"
                >
                  🔥 Motivate
                </button>
                <button
                  onClick={() => triggerPresetAction("risk")}
                  disabled={chatLoading}
                  className="bg-slate-950 border border-slate-800/80 hover:border-orange-500/40 text-slate-300 hover:text-orange-400 py-1 px-1 rounded-md text-center font-medium transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer truncate"
                  title="Analyze Risk"
                >
                  ⚠️ Risk
                </button>
              </div>
            </div>

            {/* CHAT LOGS WITH TEXT-TO-SPEECH (TTS) */}
            <div className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 overflow-y-auto max-h-[320px] space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 mb-2.5 text-xs">
              <AnimatePresence initial={false}>
                {chatHistory.map((msg) => {
                  const isModel = msg.role === "model";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isModel ? "items-start" : "items-end"}`}
                    >
                      <div className={`max-w-[90%] rounded-xl px-3 py-2 leading-relaxed relative group ${
                        isModel 
                          ? "bg-slate-900 border border-slate-800 text-slate-100 font-sans" 
                          : "bg-slate-800 text-slate-100 font-sans"
                      }`}>
                        
                        <p className="whitespace-pre-line text-[11px] leading-relaxed select-text pr-4">
                          {msg.text}
                        </p>

                        {/* Energetic Text-To-Speech (TTS) click button for AI replies */}
                        {isModel && (
                          <button
                            onClick={() => speakAIFeedback(msg.text, msg.id)}
                            title="Hear energetic agent speak aloud (TTS)"
                            className="absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 bg-slate-950 border border-slate-800 rounded hover:text-emerald-400 transition-all cursor-pointer"
                          >
                            {speakingMsgId === msg.id ? (
                              <VolumeX className="w-3 h-3 text-emerald-500 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>

                      <span className="text-[9px] text-slate-600 mt-1 px-1 font-mono">
                        {isModel ? "Deadline Guard AI" : "You"}
                      </span>
                    </motion.div>
                  );
                })}

                {/* API Alert */}
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span className="font-semibold text-[11px]">System Intercept Alert</span>
                    </div>
                    <p className="text-[10px] leading-snug">{apiError}</p>
                    <div className="bg-slate-950 p-2 rounded-lg text-[9px] text-slate-400 space-y-1">
                      <span className="block font-bold uppercase text-[8px] text-emerald-400">Step to fix:</span>
                      <span>{"1. Click Settings > Secrets in AI Studio UI."}</span>
                      <span>{"2. Add a secret named `GEMINI_API_KEY`."}</span>
                      <span>{"3. Paste your key and test again!"}</span>
                    </div>
                  </motion.div>
                )}

                {chatLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-slate-500 text-[10px]"
                  >
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="font-mono">Deadline Guard is devising combat layout...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>

            {/* SEND BAR WITH VOICE SPEECH RECOGNITION DICTATION */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                sendChatMessage(chatInput);
              }}
              className="flex items-center gap-1.5 mt-auto"
            >
              {/* Voice dictation mic button */}
              <button
                type="button"
                onClick={startSpeechDictation}
                title="Speak to dictate focus instructions (Voice-enabled assistance)"
                className={`p-2 rounded-lg border transition-all active:scale-95 cursor-pointer relative flex items-center justify-center shrink-0 ${
                  voiceListening
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse"
                    : "bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white"
                }`}
              >
                {voiceListening && (
                  <span className="absolute inset-0 rounded-lg bg-emerald-500/10 animate-ping" />
                )}
                <Mic className={`w-3.5 h-3.5 ${voiceListening ? "scale-110" : ""}`} />
              </button>

              <input
                type="text"
                disabled={chatLoading}
                placeholder={voiceListening ? "Listening..." : "Type stress, updates..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 fill-current" />
              </button>
            </form>

          </div>
      </>
    );
  };

  return (
    <div id="app-root" className={`min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-white ${theme}`}>
      
      {/* 1. DYNAMIC CONTEXT-AWARE REMINDER BANNER */}
      <AnimatePresence>
        {showReminderBanner && (
          <motion.div
            id="context-reminder-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`border-b text-xs font-medium z-50 overflow-hidden shadow-sm transition-all duration-300 ${getReminderConfig().bgColor}`}
          >
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
              {/* Left Section: Icon, Badge, Alert Title and Immediate Action Plan */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="shrink-0 flex items-center p-1.5 rounded bg-slate-950/40 border border-slate-800/35">
                    {getReminderConfig().icon}
                  </span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${getReminderConfig().accentColor}`}>
                    {getReminderConfig().badge}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-slate-100 font-sans font-medium tracking-wide text-[11px] sm:text-xs">
                    {getReminderConfig().messages.minimal}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center flex-wrap gap-x-1.5 leading-relaxed">
                    <span className="text-emerald-400 font-bold uppercase select-none">Action Plan:</span>
                    <span>{getReminderConfig().actionPlan}</span>
                  </span>
                </div>
              </div>

              {/* Right Section: Action and Dismiss */}
              <div className="flex items-center justify-end gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                {/* Context Action Button */}
                <button
                  onClick={getReminderConfig().action.onClick}
                  className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] shadow-sm cursor-pointer flex items-center gap-1 font-mono uppercase tracking-wider"
                >
                  <Zap className="w-3 h-3 text-slate-950 fill-current" />
                  <span>{getReminderConfig().action.label}</span>
                </button>

                {/* Dismiss Button */}
                <button
                  onClick={() => {
                    setShowReminderBanner(false);
                    playTacticalSound("click");
                  }}
                  className="p-1 rounded hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  title="Dismiss"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <header id="app-header" className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-40 animate-pulse" />
              <div className="relative bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300">
                <LifeBuoy className="w-6 h-6 text-white rotate-12 hover:rotate-90 transition-all duration-500 animate-[spin_10s_linear_infinite]" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg md:text-xl tracking-tight text-white uppercase">
                Deadline Guard AI
              </h1>
              <p className="text-xs text-slate-400">High-intensity task optimization & autonomous combat planners</p>
            </div>
          </div>

          {/* Real-time Ticker Metrics */}
          <div className="flex items-center justify-center md:justify-end flex-wrap gap-2 text-xs bg-slate-950/40 p-1 md:p-1.5 rounded-xl border border-slate-800/40 shadow-inner w-full md:w-auto">
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                setTheme(prev => prev === "dark" ? "light" : "dark");
                playTacticalSound("click");
              }}
              className="bg-slate-950/80 border border-slate-800/60 hover:border-slate-600 p-2.5 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-teal-400" />
              )}
            </button>

            {/* Context-aware Reminder Toggle Button */}
            <button
              onClick={() => {
                setShowReminderBanner(!showReminderBanner);
                playTacticalSound("click");
              }}
              className={`bg-slate-950/80 border p-2.5 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm shrink-0 ${
                showReminderBanner 
                  ? "border-emerald-500/40 text-emerald-400 hover:border-emerald-300 bg-emerald-500/5" 
                  : "border-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-white"
              }`}
              title={showReminderBanner ? "Hide top context reminder banner" : "Show top context reminder banner"}
              aria-label={showReminderBanner ? "Hide top context reminder banner" : "Show top context reminder banner"}
            >
              <BellRing className={`w-4 h-4 ${showReminderBanner ? "animate-pulse" : ""}`} />
            </button>

            {/* Native Browser Notification Permission Button */}
            <button
              onClick={requestNotificationPermission}
              className={`bg-slate-950/80 border p-2.5 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm shrink-0 ${
                notificationPermission === "granted"
                  ? "border-emerald-500/40 text-emerald-400 hover:border-emerald-300 bg-emerald-500/5"
                  : notificationPermission === "denied"
                  ? "border-red-500/30 text-red-400 hover:border-red-400/50 bg-red-500/5"
                  : "border-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-white"
              }`}
              title={
                notificationPermission === "granted"
                  ? "Browser Alerts Activated"
                  : notificationPermission === "denied"
                  ? "Browser Alerts Blocked by Settings (Click to request again)"
                  : "Activate Browser Alerts"
              }
              aria-label={
                notificationPermission === "granted"
                  ? "Browser Alerts Activated"
                  : "Activate Browser Alerts"
              }
            >
              <Bell className={`w-4 h-4 ${notificationPermission === "default" ? "animate-[bounce_2s_infinite]" : ""}`} />
            </button>

            {/* Mobile-only status pill toggle button */}
            <button
              onClick={() => {
                setMobileMetricsExpanded(!mobileMetricsExpanded);
                playTacticalSound("click");
              }}
              className="sm:hidden bg-slate-950/80 border border-slate-800/60 hover:border-slate-600 px-3 py-2 rounded-lg flex items-center justify-between gap-3 text-[10px] font-mono text-slate-300 transition-all active:scale-95 cursor-pointer shadow-sm flex-1"
            >
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-white font-bold uppercase tracking-wider shrink-0">Metrics</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-emerald-400 truncate">
                  {new Date(now).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true })}
                </span>
                <span className="text-slate-700 shrink-0">•</span>
                <span className="text-red-400 font-bold shrink-0">H:{overdueHighCount}</span>
                {mobileMetricsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                )}
              </div>
            </button>

            {/* Collapsible Ticker Details Container */}
            <div className={`w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2 ${mobileMetricsExpanded ? "flex" : "hidden"} sm:flex`}>


              {/* Time Spent Tracker */}
              <div className="bg-slate-950/80 border border-slate-800/60 px-2.5 py-1.5 rounded-lg flex items-center justify-between sm:justify-start gap-2 font-mono text-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <Hourglass className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Time Spent:</span>
                </div>
                <span className="text-white font-bold" title={`This session: ${formatTimeSpent(sessionTime)} | Cumulative: ${formatTimeSpent(totalTimeSpent)}`}>
                  {formatTimeSpent(totalTimeSpent)}
                </span>
              </div>


            </div>

            {/* Google Authentication Section */}
            {authLoading ? (
              <div className="bg-slate-950/80 border border-slate-800/60 px-2.5 py-1.5 rounded-lg flex items-center gap-2 font-mono text-slate-400 shadow-sm shrink-0">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                <span>Syncing Cloud...</span>
              </div>
            ) : user ? (
              <div className="bg-slate-950/80 border border-slate-800/60 pl-2 pr-1.5 py-1 rounded-lg flex items-center gap-2.5 shadow-sm shrink-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-5.5 h-5.5 rounded-full border border-slate-700" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-slate-800">
                    <UserIcon className="w-3 h-3 text-emerald-400" />
                  </div>
                )}
                <div className="flex flex-col text-left">
                  {isSyncing ? (
                    <span className="text-[9px] text-amber-400 font-mono font-bold uppercase tracking-wider leading-none flex items-center gap-1">
                      <RefreshCw className="w-2 h-2 animate-spin" />
                      Syncing...
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider leading-none">Cloud Synced</span>
                  )}
                  <span className="text-white font-bold text-xs leading-tight truncate max-w-[100px]" title={user.displayName || "Google Account"}>
                    {user.displayName?.split(" ")[0] || "User"}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out of Google"
                  className="bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-400 p-1 rounded transition-all cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all font-semibold font-mono shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Login</span>
              </button>
            )}

            {/* Auth Error Toast Indicator */}
            {authError && (
              <div 
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-help shrink-0" 
                title={authError}
                onClick={() => setAuthError(null)}
              >
                <AlertCircle className="w-3.5 h-3.5 animate-bounce" />
                <span className="font-mono text-[10px]">Auth Error</span>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* CORE NAVIGATION TABS */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4">
        <div className="max-w-7xl mx-auto flex overflow-x-auto gap-2 py-2 text-sm font-medium scrollbar-none">
          <button
            onClick={() => { setActiveTab("board"); playTacticalSound("click"); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "board"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" /> Live Deadline Board
          </button>
          <button
            onClick={() => { setActiveTab("matrix"); playTacticalSound("click"); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "matrix"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid className="w-4 h-4" /> AI Prioritizer Matrix
          </button>
          <button
            onClick={() => { setActiveTab("schedule"); playTacticalSound("click"); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "schedule"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" /> AI Scheduling Helper
          </button>
          <button
            onClick={() => { setActiveTab("habits"); playTacticalSound("click"); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "habits"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-4 h-4" /> Goals & Daily Habits
          </button>

        </div>
      </div>

      {/* WORKSPACE LAYOUT SWITCHER BAR */}
      <div className="bg-slate-900/40 border-b border-slate-800/40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sliders className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[10px]">Active workspace layout configuration:</span>
            <span className="text-emerald-400 font-bold capitalize font-mono text-[10px] bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              {layoutMode === "split" ? "Classic Balanced Columns" : "Immersive Cinema Sprint"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800/60">
            <button
              onClick={() => { setLayoutMode("split"); playTacticalSound("click"); }}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:scale-[1.05] active:scale-[0.95] ${
                layoutMode === "split"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shadow-sm"
                  : "bg-transparent border border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
              title="Split Columns Layout (Classic Balanced columns layout)"
              aria-label="Split Columns Layout"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setLayoutMode("cinema"); playTacticalSound("click"); }}
              className={`p-2 rounded-lg transition-all cursor-pointer hover:scale-[1.05] active:scale-[0.95] ${
                layoutMode === "cinema"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shadow-sm"
                  : "bg-transparent border border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
              title="Cinema Focus Layout (Immersive distraction-free screen)"
              aria-label="Cinema Focus Layout"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      {layoutMode === "split" && (
        <main id="app-workspace" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE INTERACTIVE MODULE (7 Cols) */}
        <section id="task-hub" className={`${rightColumnPinned ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col gap-6 transition-all duration-300`}>
          
          {/* TAB 1: DEADLINE COMBAT BOARD */}
          {activeTab === "board" && (
            <div className="flex flex-col gap-6">




              {/* Quick Enlist Task Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  <h2 className="font-display font-semibold text-base text-white tracking-wide">
                    Enlist Immediate Deadline
                  </h2>
                </div>

                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                      What is the emergency?
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Finish slide 14, Fix critical API memory leak..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        Importance
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as Task["priority"])}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      >
                        <option value="High" className="bg-slate-950 text-orange-400 font-bold">🟠 High Priority</option>
                        <option value="Medium" className="bg-slate-950 text-yellow-400">🟡 Medium Load</option>
                        <option value="Low" className="bg-slate-950 text-sky-400">🔵 Low Stress</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        Category
                      </label>
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      >
                        <option value="Software Dev" className="bg-slate-950 text-slate-300">💻 Software Dev</option>
                        <option value="Academics" className="bg-slate-950 text-slate-300">🎓 Academics</option>
                        <option value="Business" className="bg-slate-950 text-slate-300">💼 Business</option>
                        <option value="Finance" className="bg-slate-950 text-slate-300">💵 Finance</option>
                        <option value="Health" className="bg-slate-950 text-slate-300">❤️ Health</option>
                        <option value="Personal" className="bg-slate-950 text-slate-300">👤 Personal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        Est. Focus Minutes
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="480"
                        required
                        value={newTaskDuration}
                        onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                        Dead-Line Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={newTaskDeadline}
                        onChange={(e) => {
                          setNewTaskDeadline(e.target.value);
                          setSelectedOffset(null);
                        }}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Shortcuts */}
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <span 
                      onClick={() => {
                        setShowAbsoluteTimes(!showAbsoluteTimes);
                        playTacticalSound("click");
                      }}
                      className="text-emerald-500 hover:text-emerald-400 font-medium uppercase tracking-wider text-[10px] cursor-pointer select-none flex items-center gap-1 transition-colors border-b border-emerald-500/20 pb-0.5"
                      title="Click to toggle absolute/relative times"
                    >
                      Quick offsets {showAbsoluteTimes ? "⏱️" : "🕒"}:
                    </span>
                    <button
                      type="button"
                      onClick={() => applyDeadlineShortcut(15)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                        selectedOffset === "15"
                          ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-1 ring-emerald-500/35 font-bold scale-105"
                          : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 font-mono"
                      }`}
                    >
                      <span>+15 mins</span>
                      <span className={selectedOffset === "15" ? "text-emerald-400/70" : "text-slate-500 font-normal"}>({getShortcutClockTime(15)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDeadlineShortcut(45)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                        selectedOffset === "45"
                          ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-1 ring-emerald-500/35 font-bold scale-105"
                          : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 font-mono"
                      }`}
                    >
                      <span>+45 mins</span>
                      <span className={selectedOffset === "45" ? "text-emerald-400/70" : "text-slate-500 font-normal"}>({getShortcutClockTime(45)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDeadlineShortcut(120)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                        selectedOffset === "120"
                          ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-1 ring-emerald-500/35 font-bold scale-105"
                          : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 font-mono"
                      }`}
                    >
                      <span>+2 hrs</span>
                      <span className={selectedOffset === "120" ? "text-emerald-400/70" : "text-slate-500 font-normal"}>({getShortcutClockTime(120)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={applyShortcutTonight}
                      className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                        selectedOffset === "tonight"
                          ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-1 ring-emerald-500/35 font-bold scale-105"
                          : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600"
                      }`}
                    >
                      <span>9PM Tonight</span>
                      <span className={selectedOffset === "tonight" ? "text-emerald-400/70 font-mono" : "text-slate-500 font-mono font-normal"}>({getTonightClockTime()})</span>
                    </button>
                    <button
                      type="button"
                      onClick={applyShortcutTomorrow}
                      className={`px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                        selectedOffset === "tomorrow"
                          ? "bg-emerald-500/20 border border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] ring-1 ring-emerald-500/35 font-bold scale-105"
                          : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600"
                      }`}
                    >
                      <span>9AM Tomorrow</span>
                      <span className={selectedOffset === "tomorrow" ? "text-emerald-400/70 font-mono" : "text-slate-500 font-mono font-normal"}>({getTomorrowClockTime()})</span>
                    </button>

                    {newTaskDeadline && (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1 flex items-center gap-1 shadow-inner animate-pulse ml-auto">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        Selected Target: {new Date(newTaskDeadline).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(newTaskDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Enlist Urgent Target
                  </button>
                </form>
              </div>

              {/* Task list core panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col min-h-[400px]">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h2 className="font-display font-semibold text-base text-white tracking-wide">
                      Live Deadline Combat Board
                    </h2>
                  </div>

                  {/* Filters */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80 text-xs font-medium w-full sm:w-auto overflow-x-auto">
                    {(["All", "Active", "Critical", "Completed"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => { setActiveFilter(filter); playTacticalSound("click"); }}
                        className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
                          activeFilter === filter
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {filter === "Critical" ? "🚨 Critical / Overdue" : filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-4 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search emergency task lists..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Compact Mode Toggle (Visible only when there are 10+ tasks) */}
                  {tasks.length >= 10 && (
                    <button
                      onClick={() => {
                        setCompactMode(!compactMode);
                        playTacticalSound("click");
                      }}
                      title="Toggle compact row layout for high-density lists"
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border ${
                        compactMode
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{compactMode ? "Expand" : "Compact Mode"}</span>
                    </button>
                  )}

                  {/* Calendar integration download */}
                  <button
                    onClick={exportICSFile}
                    title="Export Combat Schedule to Google/Apple Calendar (.ics file)"
                    className="bg-slate-950 border border-slate-800/80 hover:border-slate-600 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Export Calendar</span>
                  </button>

                  {/* Hide/Show Completed toggle */}
                  <button
                    onClick={() => {
                      setHideCompleted(!hideCompleted);
                      playTacticalSound("click");
                    }}
                    title={hideCompleted ? "Show completed tasks in the active list" : "Hide completed tasks from the active list"}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border shrink-0 ${
                      hideCompleted
                        ? "bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {hideCompleted ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Show Done</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Hide Done</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tasks loop */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500"
                      >
                        <Hourglass className="w-10 h-10 text-slate-700 stroke-1 mb-3 animate-pulse" />
                        <p className="text-sm font-medium">No deadlines matching the current filter.</p>
                        <p className="text-xs text-slate-600 mt-1">Add your targets or deploy the Autonomous Agent Planner above!</p>
                      </motion.div>
                    ) : (
                      filteredTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          id={`task-${task.id}`}
                          layoutId={task.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`border rounded-xl transition-all relative overflow-hidden ${
                            compactMode ? "p-1.5 px-3" : "p-4"
                          } ${
                            task.completed
                              ? "bg-slate-950/30 border-slate-900 opacity-60"
                              : task.isOverdue
                              ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50 shadow-lg shadow-red-500/5"
                              : task.isUrgent
                              ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/5"
                              : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {!task.completed && (task.isOverdue || task.isUrgent) && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                              task.isOverdue ? "bg-red-500 animate-pulse" : "bg-amber-500 animate-pulse"
                            }`} />
                          )}

                          {compactMode ? (
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <button
                                  onClick={() => toggleTaskComplete(task.id)}
                                  className="text-slate-500 hover:text-emerald-400 transition-all focus:outline-none cursor-pointer flex items-center justify-center shrink-0"
                                >
                                  <AnimatePresence mode="wait">
                                    {task.completed ? (
                                      <motion.div
                                        key="completed"
                                        initial={{ scale: 0.5, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0.5, rotate: 20 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                      >
                                        <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="uncompleted"
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0.8 }}
                                        className={`w-4 h-4 rounded-full border transition-all ${
                                          task.isOverdue 
                                            ? "border-red-500/50 hover:border-red-500" 
                                            : task.isUrgent 
                                            ? "border-amber-500/50 hover:border-amber-500" 
                                            : "border-slate-700 hover:border-slate-400"
                                        }`}
                                      />
                                    )}
                                  </AnimatePresence>
                                </button>

                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <h3 className={`font-medium text-xs leading-snug tracking-wide relative truncate max-w-[120px] sm:max-w-xs ${
                                    task.completed ? "text-slate-500 font-normal transition-colors duration-300" : "text-white"
                                  }`} title={task.name}>
                                    <span className="relative z-10">{task.name}</span>
                                    <motion.span
                                      initial={{ width: 0 }}
                                      animate={{ width: task.completed ? "100%" : 0 }}
                                      transition={{ duration: 0.35, ease: "easeInOut" }}
                                      className="absolute left-0 top-[52%] h-[1.5px] bg-slate-500 z-20 origin-left"
                                    />
                                  </h3>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.2 rounded-md ${
                                      task.priority === "Critical"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : task.priority === "High"
                                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                        : task.priority === "Medium"
                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                        : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                    }`}>
                                      {task.priority[0]}
                                    </span>

                                    {timerTaskId === task.id ? (
                                      <span className={`text-[8px] px-1 py-0.2 rounded-md font-mono font-bold flex items-center gap-1 ${
                                        timerActive 
                                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse" 
                                          : "bg-slate-800 text-slate-300 border border-slate-700"
                                      }`}>
                                        {formatTimerString(timerSeconds)}
                                      </span>
                                    ) : (
                                      <span className="bg-slate-900 border border-slate-800 text-slate-500 text-[8px] px-1 py-0.2 rounded-md font-mono">
                                        {task.duration}m
                                      </span>
                                    )}

                                    <span className={`text-[9px] font-mono truncate hidden sm:inline ${
                                      task.completed
                                        ? "text-emerald-500"
                                        : task.isOverdue
                                        ? "text-red-400 animate-pulse font-bold"
                                        : task.isUrgent
                                        ? "text-amber-400 animate-pulse font-semibold"
                                        : "text-slate-500"
                                    }`}>
                                      {task.timeLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {!task.completed && (
                                  <button
                                    onClick={() => handleSprintClick(task)}
                                    className={`p-1 rounded transition-all flex items-center justify-center cursor-pointer ${
                                      timerTaskId === task.id
                                        ? timerActive
                                          ? "bg-emerald-600 text-white"
                                          : "bg-amber-600 text-white"
                                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                                    }`}
                                    title={timerTaskId === task.id ? (timerActive ? "Pause Sprint" : "Resume Sprint") : "Start Focus Sprint"}
                                  >
                                    {timerTaskId === task.id && timerActive ? (
                                      <Pause className="w-2.5 h-2.5 fill-current" />
                                    ) : (
                                      <Play className="w-2.5 h-2.5 fill-current" />
                                    )}
                                  </button>
                                )}

                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1 rounded bg-slate-950/80 border border-slate-800/80 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                                  title="Delete target"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => toggleTaskComplete(task.id)}
                                  className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-all focus:outline-none cursor-pointer flex items-center justify-center shrink-0"
                                >
                                  <AnimatePresence mode="wait">
                                    {task.completed ? (
                                      <motion.div
                                        key="completed"
                                        initial={{ scale: 0.5, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0.5, rotate: 20 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                      >
                                        <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="uncompleted"
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0.8 }}
                                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                                          task.isOverdue 
                                            ? "border-red-500/50 hover:border-red-500" 
                                            : task.isUrgent 
                                            ? "border-amber-500/50 hover:border-amber-500" 
                                            : "border-slate-700 hover:border-slate-400"
                                        }`}
                                      />
                                    )}
                                  </AnimatePresence>
                                </button>

                                <div>
                                  <h3 className={`font-medium text-sm leading-snug tracking-wide relative inline-block ${
                                    task.completed ? "text-slate-500 font-normal transition-colors duration-300" : "text-white"
                                  }`}>
                                    <span className="relative z-10">{task.name}</span>
                                    <motion.span
                                      initial={{ width: 0 }}
                                      animate={{ width: task.completed ? "100%" : 0 }}
                                      transition={{ duration: 0.35, ease: "easeInOut" }}
                                      className="absolute left-0 top-[52%] h-[1.5px] bg-slate-500 z-20 origin-left"
                                    />
                                  </h3>

                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                      task.priority === "Critical"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : task.priority === "High"
                                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                        : task.priority === "Medium"
                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                        : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                    }`}>
                                      {task.priority}
                                    </span>

                                    {timerTaskId === task.id ? (
                                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1.5 ${
                                        timerActive 
                                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse" 
                                          : "bg-slate-800 text-slate-300 border border-slate-700"
                                      }`} title={`Sprint Active: ${formatTimerString(timerSeconds)} remaining`}>
                                        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${timerActive ? "animate-ping" : ""}`} />
                                        {formatTimerString(timerSeconds)}
                                      </span>
                                    ) : (
                                      <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md font-mono">
                                        {task.duration} mins
                                      </span>
                                    )}

                                    <span className={`text-[11px] flex items-center gap-1 font-mono font-medium ${
                                      task.completed
                                        ? "text-emerald-500"
                                        : task.isOverdue
                                        ? "text-red-400 animate-pulse font-bold"
                                        : task.isUrgent
                                        ? "text-amber-400 animate-pulse font-semibold"
                                        : "text-slate-400"
                                    }`}>
                                      {task.isOverdue && <AlertTriangle className="w-3 h-3 text-red-400" />}
                                      {task.isUrgent && <Zap className="w-3 h-3 text-amber-400" />}
                                      {task.timeLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {!task.completed && (
                                  <button
                                    onClick={() => handleSprintClick(task)}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                                      timerTaskId === task.id
                                        ? timerActive
                                          ? "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20"
                                          : "bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                                        : "bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600"
                                    }`}
                                    title={timerTaskId === task.id ? (timerActive ? "Pause Sprint" : "Resume Sprint") : "Start Focus Sprint"}
                                  >
                                    {timerTaskId === task.id && timerActive ? (
                                      <>
                                        <Pause className="w-3 h-3 fill-current" />
                                        <span className="hidden sm:inline">Pause</span>
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3 h-3 fill-current" />
                                        <span className="hidden sm:inline">
                                          {timerTaskId === task.id ? "Resume" : "Sprint"}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                )}

                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}

                          {task.tacticalHint && !task.completed && (
                            <div className="mt-3.5 pt-2.5 border-t border-slate-900/60 flex items-start gap-2 text-slate-400 bg-slate-900/30 px-3 py-2 rounded-lg border border-slate-850/50">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                              <p className="text-[11px] leading-relaxed italic">
                                <strong className="text-amber-400 not-italic font-mono font-bold uppercase tracking-wider text-[9px] mr-1">AI Strategy:</strong> 
                                {task.tacticalHint}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-5 border-t border-slate-800 pt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Targets</span>
                    <span className="text-white font-mono font-bold text-sm">{tasks.length}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Completion</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">{completionPercentage}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Active Targets</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">{activeCount} active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI PRIORITIZATION MATRIX */}
          {activeTab === "matrix" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 min-h-[600px] relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display font-semibold text-base text-white tracking-wide flex items-center gap-2">
                    <Grid className="w-5 h-5 text-emerald-500" />
                    Intelligent Eisenhower Priority Matrix
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Tasks plotted dynamically into emergency combat zones</p>
                </div>

                {/* Prioritize trigger button row with hide Completed toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Hide/Show Completed toggle */}
                  <button
                    onClick={() => {
                      setHideCompleted(!hideCompleted);
                      playTacticalSound("click");
                    }}
                    title={hideCompleted ? "Show completed tasks in the active list" : "Hide completed tasks from the active list"}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border shrink-0 ${
                      hideCompleted
                        ? "bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {hideCompleted ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Show Done</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Hide Done</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={runAIPrioritization}
                    disabled={prioritizingLoader || tasks.length === 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {prioritizingLoader ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {prioritizingLoader ? "AI Analysis in Progress..." : "AI Re-Prioritize Matrix"}
                  </button>
                </div>
              </div>


              {/* MATRIX GRID LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                
                {/* Quadrant 1: Urgent & Important (Do First) */}
                <div className="bg-slate-950 border border-red-500/20 rounded-xl p-4 flex flex-col min-h-[260px]">
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-2 mb-3">
                    <span className="font-display font-semibold text-xs text-red-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      🔴 DO FIRST: Urgent & Vital
                    </span>
                    <span className="bg-red-500/10 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">Q1</span>
                  </div>

                  {/* Manual inline quick add */}
                  <form onSubmit={(e) => handleMatrixSubmit(e, "doFirst")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast enlist Q1 threat..."
                      value={matrixDoFirstInput}
                      onChange={(e) => setMatrixDoFirstInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-red-550/40 focus:ring-1 focus:ring-red-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Enlist to Q1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
                    {enrichedTasks.filter(t => t.matrixQuadrant === "doFirst" && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 block text-center py-8">No high-threat items locked here.</span>
                    ) : (
                      enrichedTasks.filter(t => t.matrixQuadrant === "doFirst" && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/40 opacity-65" 
                            : "bg-slate-900 border-slate-800/60"
                        }`}>
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.5 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/10" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-medium truncate ${t.completed ? "line-through text-slate-500" : "text-slate-200"}`}>{t.name}</span>
                          </div>
                          <span className={`text-[9px] shrink-0 font-mono ${t.completed ? "text-slate-600" : "text-red-400"}`}>{t.timeLabel}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quadrant 2: Important, Not Urgent (Schedule) */}
                <div className="bg-slate-950 border border-orange-500/20 rounded-xl p-4 flex flex-col min-h-[260px]">
                  <div className="flex items-center justify-between border-b border-orange-500/20 pb-2 mb-3">
                    <span className="font-display font-semibold text-xs text-orange-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      🟠 SCHEDULE: Strategize & Execute
                    </span>
                    <span className="bg-orange-500/10 text-orange-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">Q2</span>
                  </div>

                  {/* Manual inline quick add */}
                  <form onSubmit={(e) => handleMatrixSubmit(e, "schedule")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast schedule Q2 task..."
                      value={matrixScheduleInput}
                      onChange={(e) => setMatrixScheduleInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-orange-550/40 focus:ring-1 focus:ring-orange-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Schedule to Q2"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
                    {enrichedTasks.filter(t => (t.matrixQuadrant === "schedule" || !t.matrixQuadrant) && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 block text-center py-8">All structured schedules clear.</span>
                    ) : (
                      enrichedTasks.filter(t => (t.matrixQuadrant === "schedule" || !t.matrixQuadrant) && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/40 opacity-65" 
                            : "bg-slate-900 border-slate-800/60"
                        }`}>
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.5 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/10" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-medium truncate ${t.completed ? "line-through text-slate-500" : "text-slate-200"}`}>{t.name}</span>
                          </div>
                          <span className={`text-[9px] shrink-0 font-mono ${t.completed ? "text-slate-600" : "text-orange-400"}`}>{t.timeLabel}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quadrant 3: Urgent, Not Important (Delegate/Streamline) */}
                <div className="bg-slate-950 border border-yellow-500/25 rounded-xl p-4 flex flex-col min-h-[260px]">
                  <div className="flex items-center justify-between border-b border-yellow-500/25 pb-2 mb-3">
                    <span className="font-display font-semibold text-xs text-yellow-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      🟡 MINIMIZE: Fast/Delegate
                    </span>
                    <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">Q3</span>
                  </div>

                  {/* Manual inline quick add */}
                  <form onSubmit={(e) => handleMatrixSubmit(e, "delegate")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast add Q3 delegation..."
                      value={matrixDelegateInput}
                      onChange={(e) => setMatrixDelegateInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-yellow-550/40 focus:ring-1 focus:ring-yellow-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Delegate to Q3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
                    {enrichedTasks.filter(t => t.matrixQuadrant === "delegate" && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 block text-center py-8">Clear delegation path.</span>
                    ) : (
                      enrichedTasks.filter(t => t.matrixQuadrant === "delegate" && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/40 opacity-65" 
                            : "bg-slate-900 border-slate-800/60"
                        }`}>
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.5 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/10" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-medium truncate ${t.completed ? "line-through text-slate-500" : "text-slate-200"}`}>{t.name}</span>
                          </div>
                          <span className={`text-[9px] shrink-0 font-mono ${t.completed ? "text-slate-600" : "text-yellow-400"}`}>{t.timeLabel}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quadrant 4: Neither (Defer/Trim) */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[260px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="font-display font-semibold text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                      🔵 DEFER: Backlog or De-prioritize
                    </span>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">Q4</span>
                  </div>

                  {/* Manual inline quick add */}
                  <form onSubmit={(e) => handleMatrixSubmit(e, "defer")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast defer Q4 item..."
                      value={matrixDeferInput}
                      onChange={(e) => setMatrixDeferInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-655 focus:outline-none focus:border-slate-550/40 focus:ring-1 focus:ring-slate-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-slate-800/20 hover:bg-slate-800/30 border border-slate-700/50 text-slate-300 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Defer to Q4"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[250px] pr-1">
                    {enrichedTasks.filter(t => t.matrixQuadrant === "defer" && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 block text-center py-8">Zero low-priority distraction.</span>
                    ) : (
                      enrichedTasks.filter(t => t.matrixQuadrant === "defer" && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/40 opacity-65" 
                            : "bg-slate-900 border-slate-800/60"
                        }`}>
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.5 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/10" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-medium truncate ${t.completed ? "line-through text-slate-500" : "text-slate-200"}`}>{t.name}</span>
                          </div>
                          <span className={`text-[9px] shrink-0 font-mono ${t.completed ? "text-slate-600" : "text-slate-400"}`}>{t.timeLabel}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SMART SCHEDULE / TIMELINE HELPER */}
          {activeTab === "schedule" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-6 min-h-[600px]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="font-display font-semibold text-base text-white tracking-wide flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    AI-Powered Day-Part Scheduling Assistance
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Auto-allocates active task deadlines into optimized slots to avoid cognitive overload</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Hide/Show Completed toggle */}
                  <button
                    onClick={() => {
                      setHideCompleted(!hideCompleted);
                      playTacticalSound("click");
                    }}
                    title={hideCompleted ? "Show completed tasks in the active list" : "Hide completed tasks from the active list"}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border shrink-0 ${
                      hideCompleted
                        ? "bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {hideCompleted ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Show Done</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Hide Done</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={runAISchedulingOptimization}
                    disabled={optimizingSchedule || tasks.length === 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {optimizingSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
                    {optimizingSchedule ? "Optimizing Slots..." : "AI Optimize Stagger"}
                  </button>
                </div>
              </div>

              {/* TIMELINE SLOTS LOOP */}
              <div className="space-y-4 flex-1">
                
                {/* 1. Morning Block */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
                      ☀️ Morning Slot (06:00 - 12:00)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Peak cognitive window</span>
                  </div>

                  {/* Quick manual slot addition */}
                  <form onSubmit={(e) => handleScheduleSubmit(e, "morning")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast enlist Morning task..."
                      value={schedMorningInput}
                      onChange={(e) => setSchedMorningInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Enlist to Morning Slot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2">
                    {enrichedTasks.filter(t => t.dayPartSlot === "morning" && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic block py-2">No tasks assigned to this block.</span>
                    ) : (
                      enrichedTasks.filter(t => t.dayPartSlot === "morning" && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-3 rounded-lg flex items-center justify-between text-xs border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/60 opacity-60" 
                            : "bg-slate-900 border-slate-800/80 hover:border-slate-700/80"
                        }`}>
                          <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-3">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 focus:outline-none cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0.5, rotate: 20 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-semibold relative truncate ${t.completed ? "text-slate-500 line-through" : "text-white"}`}>
                              {t.name}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 font-mono text-[10px] shrink-0 ${t.completed ? "text-slate-600" : "text-emerald-400"}`}>
                            <span>{t.duration}m duration</span>
                            <span>|</span>
                            <span>{t.timeLabel}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Afternoon Block */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
                      ⛅ Afternoon Slot (12:00 - 17:00)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Post-lunch focus momentum</span>
                  </div>

                  {/* Quick manual slot addition */}
                  <form onSubmit={(e) => handleScheduleSubmit(e, "afternoon")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast enlist Afternoon task..."
                      value={schedAfternoonInput}
                      onChange={(e) => setSchedAfternoonInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Enlist to Afternoon Slot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2">
                    {enrichedTasks.filter(t => t.dayPartSlot === "afternoon" && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic block py-2">No tasks assigned to this block.</span>
                    ) : (
                      enrichedTasks.filter(t => t.dayPartSlot === "afternoon" && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-3 rounded-lg flex items-center justify-between text-xs border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/60 opacity-60" 
                            : "bg-slate-900 border-slate-800/80 hover:border-slate-700/80"
                        }`}>
                          <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-3">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 focus:outline-none cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0.5, rotate: 20 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-semibold relative truncate ${t.completed ? "text-slate-500 line-through" : "text-white"}`}>
                              {t.name}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 font-mono text-[10px] shrink-0 ${t.completed ? "text-slate-600" : "text-orange-400"}`}>
                            <span>{t.duration}m duration</span>
                            <span>|</span>
                            <span>{t.timeLabel}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Evening Block */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
                      🌆 Evening Slot (17:00 - 21:00)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Late sprint push</span>
                  </div>

                  {/* Quick manual slot addition */}
                  <form onSubmit={(e) => handleScheduleSubmit(e, "evening")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast enlist Evening task..."
                      value={schedEveningInput}
                      onChange={(e) => setSchedEveningInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-yellow-500/40 focus:ring-1 focus:ring-yellow-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Enlist to Evening Slot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2">
                    {enrichedTasks.filter(t => t.dayPartSlot === "evening" && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic block py-2">No tasks assigned to this block.</span>
                    ) : (
                      enrichedTasks.filter(t => t.dayPartSlot === "evening" && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-3 rounded-lg flex items-center justify-between text-xs border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/60 opacity-60" 
                            : "bg-slate-900 border-slate-800/80 hover:border-slate-700/80"
                        }`}>
                          <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-3">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 focus:outline-none cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0.5, rotate: 20 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-semibold relative truncate ${t.completed ? "text-slate-500 line-through" : "text-white"}`}>
                              {t.name}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 font-mono text-[10px] shrink-0 ${t.completed ? "text-slate-600" : "text-yellow-400"}`}>
                            <span>{t.duration}m duration</span>
                            <span>|</span>
                            <span>{t.timeLabel}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. Night Block */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
                      🌙 Night Slot (21:00 - 06:00)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Quiet deep work flow</span>
                  </div>

                  {/* Quick manual slot addition */}
                  <form onSubmit={(e) => handleScheduleSubmit(e, "night")} className="mb-3 flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Fast enlist Night task..."
                      value={schedNightInput}
                      onChange={(e) => setSchedNightInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-slate-500/40 focus:ring-1 focus:ring-slate-500/20 transition-all font-sans"
                    />
                    <button
                      type="submit"
                      className="bg-slate-800/20 hover:bg-slate-800/30 border border-slate-700/50 text-slate-300 rounded-lg p-1.5 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title="Enlist to Night Slot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2">
                    {enrichedTasks.filter(t => t.dayPartSlot === "night" && (!hideCompleted || !t.completed)).length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic block py-2">No tasks assigned to this block.</span>
                    ) : (
                      enrichedTasks.filter(t => t.dayPartSlot === "night" && (!hideCompleted || !t.completed)).map(t => (
                        <div key={t.id} className={`p-3 rounded-lg flex items-center justify-between text-xs border transition-all ${
                          t.completed 
                            ? "bg-slate-950/30 border-slate-900/60 opacity-60" 
                            : "bg-slate-900 border-slate-800/80 hover:border-slate-700/80"
                        }`}>
                          <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-3">
                            <button
                              type="button"
                              onClick={() => { toggleTaskComplete(t.id); playTacticalSound("click"); }}
                              className="text-slate-500 hover:text-emerald-400 focus:outline-none cursor-pointer flex items-center justify-center shrink-0 transition-all"
                            >
                              <AnimatePresence mode="wait">
                                {t.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0.5, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0.5, rotate: 20 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="uncompleted"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.8 }}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:border-emerald-500"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                            <span className={`font-semibold relative truncate ${t.completed ? "text-slate-500 line-through" : "text-white"}`}>
                              {t.name}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 font-mono text-[10px] shrink-0 ${t.completed ? "text-slate-600" : "text-slate-400"}`}>
                            <span>{t.duration}m duration</span>
                            <span>|</span>
                            <span>{t.timeLabel}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: GOAL & HABIT TRACKING */}
          {activeTab === "habits" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 min-h-[600px] text-white">
              {/* Header block with visual identity */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h2 className="font-display font-bold text-lg text-white tracking-wide flex items-center gap-2">
                    <Award className="w-5.5 h-5.5 text-emerald-400" />
                    Goals, Habits & Streak Battlecenter
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Form bulletproof habits, conquer weekly milestones, and secure critical deadlines in one unified operations center.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={resetAllHabitsToday}
                    className="bg-slate-950 border border-slate-800/80 hover:border-slate-600 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    title="Resets today's habit completions and freeze overrides"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Day's Routine
                  </button>
                </div>
              </div>

              {/* 1. DYNAMIC UNIFIED STATISTICS DECK */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card A: Habits Completion & Streaks */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.015] rounded-full blur-2xl pointer-events-none" />
                  <div className="flex-1 mr-2">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Today's Habits Routine</span>
                    <span className="text-2xl font-mono font-black text-rose-450 mt-1 block">
                      {habits.filter(h => h.completedToday).length} of {habits.length}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Streaks are protected by active freezes
                    </p>
                  </div>
                  {/* Radial progress bar */}
                  <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="transparent" stroke="#0f172a" strokeWidth="4" />
                      <circle cx="32" cy="32" r="26" fill="transparent" stroke="#f43f5e" strokeWidth="4.5" 
                        strokeDasharray={163.36}
                        strokeDashoffset={163.36 - (163.36 * habitsRatePercent) / 100}
                        className="transition-all duration-700 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono text-xs font-bold text-white">{habitsRatePercent}%</span>
                  </div>
                </div>

                {/* Card B: Weekly Goals Progress */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.015] rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Weekly Goal achievements</span>
                    {(() => {
                      const currentWeekStart = getStartOfWeekDate();
                      const thisWeeksGoals = weeklyGoals.filter(g => g.weekStartDate === currentWeekStart && !g.archived);
                      const completedCount = thisWeeksGoals.filter(g => g.completed).length;
                      const pct = thisWeeksGoals.length > 0 ? Math.round((completedCount / thisWeeksGoals.length) * 100) : 0;
                      return (
                        <>
                          <span className="text-2xl font-mono font-black text-emerald-400 mt-1 block">
                            {completedCount} of {thisWeeksGoals.length}
                          </span>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-800">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-700 ease-out" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            {pct}% week completion • {weeklyGoals.filter(g => g.status === "rolled_over").length} rolled over
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Card C: Short-term Deadlines Urgency */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.015] rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Deadline Urgency Deck</span>
                    {(() => {
                      const urgentTasks = tasks.filter(t => !t.completed && t.deadline);
                      const sorted = [...urgentTasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
                      const nearest = sorted[0];
                      return (
                        <>
                          <span className="text-2xl font-mono font-black text-amber-450 mt-1 block">
                            {urgentTasks.length} Active
                          </span>
                          {nearest ? (
                            <p className="text-[10px] text-slate-350 mt-2 truncate flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                              Next: <span className="text-rose-400 font-bold font-mono">{nearest.name}</span> in {(() => {
                                const diffMs = new Date(nearest.deadline).getTime() - Date.now();
                                const diffHrs = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
                                return diffHrs === 0 ? "under 1 hr" : `${diffHrs} hrs`;
                              })()}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 mt-2 italic">No immediate deadlines active.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* 2. PRIMARY UNIFIED DASHBOARD LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1: RECURRING DAILY HABITS */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4.5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-rose-450 font-display uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-rose-500" />
                      Daily Habits Routine
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                      Streaks System
                    </span>
                  </div>

                  {/* Habit Creator Form */}
                  <form 
                    onSubmit={handleAddCustomHabit} 
                    className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2.5"
                  >
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                        Habit objective
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15 Min Planks, Hydrate 3L Water..."
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/10 transition-all font-sans"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                          Frequency
                        </label>
                        <select
                          value={newHabitFreq}
                          onChange={(e) => setNewHabitFreq(e.target.value as Habit["frequency"])}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500/50"
                        >
                          <option value="Daily">Daily Routine</option>
                          <option value="Every Focus Block">Every Focus Block</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs px-3 rounded flex items-center justify-center gap-1 transition-all cursor-pointer mt-4 self-stretch"
                      >
                        <Plus className="w-3.5 h-3.5" /> Enlist
                      </button>
                    </div>
                  </form>

                  {/* Habits list */}
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {habits.length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic text-center py-6">No habits enlisted. Create one above!</p>
                    ) : (
                      habits.map((habit) => {
                        const isFrozen = !!habit.streakFreezeUsedToday;
                        return (
                          <div
                            key={habit.id}
                            className={`border rounded-lg p-3 transition-all flex items-center justify-between ${
                              habit.completedToday
                                ? "bg-emerald-500/[0.03] border-emerald-500/25 opacity-90"
                                : isFrozen
                                ? "bg-cyan-500/[0.03] border-cyan-500/20"
                                : "bg-slate-950 border-slate-850 hover:border-slate-800"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 overflow-hidden mr-2">
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleHabitComplete(habit.id)}
                                className="mt-0.5 text-slate-500 hover:text-emerald-450 focus:outline-none cursor-pointer flex items-center justify-center shrink-0 transition-all"
                                title="Toggle habit completion"
                              >
                                {habit.completedToday ? (
                                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 border border-emerald-450 text-white flex items-center justify-center">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-4.5 h-4.5 rounded-full border border-slate-700 hover:border-slate-400" />
                                )}
                              </button>

                              <div className="overflow-hidden">
                                <h4 className={`text-xs font-semibold truncate ${
                                  habit.completedToday ? "text-slate-500 line-through" : isFrozen ? "text-cyan-450" : "text-white"
                                }`}>
                                  {habit.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono">
                                  <span className="text-slate-500 uppercase tracking-wider">
                                    {habit.frequency}
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-rose-450 font-bold flex items-center gap-0.5">
                                    🔥 {habit.streak}d streak
                                  </span>
                                  {habit.longestStreak > 0 && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-400 flex items-center gap-0.5" title="All-time personal record streak">
                                        🏆 {habit.longestStreak} max
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Freeze button & Delete */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => toggleStreakFreeze(habit.id)}
                                disabled={habit.completedToday || (!isFrozen && (habit.streakFreezesRemaining || 0) <= 0)}
                                className={`p-1.5 rounded text-[10px] font-mono flex items-center justify-center border transition-all cursor-pointer ${
                                  isFrozen
                                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                                    : (habit.streakFreezesRemaining || 0) <= 0
                                    ? "bg-slate-900 border-slate-850/40 text-slate-600 opacity-30 cursor-not-allowed"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-450 hover:border-cyan-500/30"
                                }`}
                                title={
                                  isFrozen
                                    ? "Streak Frozen Today (Click to unfreeze)"
                                    : `Freeze streak for today (Uses 1 freeze. ${habit.streakFreezesRemaining ?? 2} left)`
                                }
                              >
                                <ShieldAlert className={`w-3.5 h-3.5 ${isFrozen ? "animate-pulse text-cyan-450" : ""}`} />
                                {isFrozen && <span className="ml-1 text-[9px] font-bold uppercase tracking-widest hidden sm:inline">Frozen</span>}
                              </button>

                              <button
                                onClick={() => deleteHabit(habit.id)}
                                className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer text-slate-550"
                                title="Delete habit objective"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUMN 2: WEEKLY GOAL SETTING */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4.5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-emerald-450 font-display uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-500" />
                      Weekly Goals Tracker
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-bold">
                      Week: {getStartOfWeekDate()}
                    </span>
                  </div>

                  {/* Goal Creator Form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddWeeklyGoal(newGoalName, newGoalType, newGoalTarget, newGoalUnit);
                      setNewGoalName("");
                    }} 
                    className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2.5"
                  >
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                        Goal objective
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Exercise 3x, Finish paper..."
                        value={newGoalName}
                        onChange={(e) => setNewGoalName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 transition-all font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                          Goal type
                        </label>
                        <select
                          value={newGoalType}
                          onChange={(e) => setNewGoalType(e.target.value as "checkbox" | "numeric")}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="checkbox">Checkbox Check</option>
                          <option value="numeric">Target Counter</option>
                        </select>
                      </div>

                      {newGoalType === "numeric" ? (
                        <div className="flex gap-1">
                          <div className="w-16">
                            <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                              Target
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={newGoalTarget}
                              onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              placeholder="pages, workouts"
                              value={newGoalUnit}
                              onChange={(e) => setNewGoalUnit(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none placeholder:text-slate-700"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end">
                          <span className="text-[10px] text-slate-600 block pb-2 italic">Simple yes/no tracking</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Enlist Goal
                    </button>
                  </form>

                  {/* Goal Listing */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const currentWeekStart = getStartOfWeekDate();
                      const activeWeekGoals = weeklyGoals.filter(g => g.weekStartDate === currentWeekStart && !g.archived);
                      const inactiveWeekGoals = weeklyGoals.filter(g => g.weekStartDate !== currentWeekStart && !g.archived);
                      
                      return (
                        <>
                          {/* Active Current Goals */}
                          {activeWeekGoals.length === 0 ? (
                            <p className="text-[11px] text-slate-600 italic text-center py-6">No goals active for this week.</p>
                          ) : (
                            activeWeekGoals.map((goal) => (
                              <div 
                                key={goal.id} 
                                className={`border rounded-lg p-3 transition-all flex flex-col gap-2 ${
                                  goal.completed 
                                    ? "bg-emerald-500/[0.03] border-emerald-500/20" 
                                    : "bg-slate-950 border-slate-850 hover:border-slate-800"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex items-start gap-2 overflow-hidden">
                                    <button
                                      onClick={() => handleToggleWeeklyGoal(goal.id)}
                                      className="mt-0.5 text-slate-500 hover:text-emerald-450 shrink-0"
                                    >
                                      {goal.completed ? (
                                        <div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-450 text-white flex items-center justify-center">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                      ) : (
                                        <div className="w-4 h-4 rounded border border-slate-700 hover:border-slate-400" />
                                      )}
                                    </button>
                                    <span className={`text-xs font-semibold truncate ${goal.completed ? "text-slate-500 line-through" : "text-white"}`}>
                                      {goal.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleArchiveGoal(goal.id)}
                                      className="p-1 rounded hover:bg-slate-900 text-slate-550 hover:text-slate-350"
                                      title="Archive Goal"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Numeric Target Indicators */}
                                {goal.type === "numeric" && (
                                  <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-1.5 rounded border border-slate-850/60">
                                    <span className="text-[10px] font-mono text-slate-400">
                                      Progress: <span className="text-emerald-450 font-bold">{goal.currentValue}</span> / {goal.targetValue} {goal.unit || "times"}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleUpdateGoalProgress(goal.id, -1)}
                                        className="w-5 h-5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                                        title="Decrease progress"
                                      >
                                        -
                                      </button>
                                      <button
                                        onClick={() => handleUpdateGoalProgress(goal.id, 1)}
                                        className="w-5 h-5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center text-xs text-slate-400 hover:text-white"
                                        title="Increase progress"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}

                          {/* Historical Inactive Goals (Recap summaries) */}
                          {inactiveWeekGoals.length > 0 && (
                            <div className="mt-4 border-t border-slate-800/80 pt-3">
                              <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                                Rollover Backlog from Previous Weeks
                              </span>
                              <div className="space-y-2">
                                {inactiveWeekGoals.map((g) => (
                                  <div key={g.id} className="bg-slate-950/80 border border-slate-900 rounded p-2.5 flex items-center justify-between gap-3 text-xs opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="overflow-hidden">
                                      <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                                        Week of {g.weekStartDate} • {g.completed ? "Achieved" : "Missed"}
                                      </span>
                                      <span className="font-medium text-slate-300 truncate block mt-0.5">{g.name}</span>
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                      {!g.completed && (
                                        <button
                                          onClick={() => handleRolloverGoal(g.id)}
                                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-mono border border-slate-800 text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                                          title="Rollover this unfinished goal to the current week"
                                        >
                                          <ArrowUpRight className="w-3 h-3" /> Roll
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleArchiveGoal(g.id)}
                                        className="p-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-white cursor-pointer"
                                        title="Archive and hide"
                                      >
                                        <Archive className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* COLUMN 3: SHORT-TERM DEADLINE MANAGEMENT */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4.5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-amber-450 font-display uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Short-term Deadlines Control
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                      Linked Tasks
                    </span>
                  </div>

                  {/* Add Quick Deadline Task Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newQuickDeadlineName.trim()) return;
                      const createdTask: Task = {
                        id: "task_q_" + Math.random().toString(36).substring(2, 9),
                        name: newQuickDeadlineName.trim(),
                        priority: newQuickDeadlinePriority,
                        deadline: new Date(Date.now() + newQuickDeadlineHrs * 60 * 60 * 1000).toISOString(),
                        duration: 25, // default
                        completed: false,
                        createdAt: new Date().toISOString(),
                        matrixQuadrant: newQuickDeadlinePriority === "Critical" ? "doFirst" : "schedule",
                        category: "Deadline Control"
                      };
                      setTasks(prev => [createdTask, ...prev]);
                      setNewQuickDeadlineName("");
                      playTacticalSound("success");
                    }}
                    className="bg-slate-950 border border-slate-850 rounded-lg p-3 flex flex-col gap-2.5"
                  >
                    <div>
                      <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                        New Deadline task
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Turn in code draft, Final report..."
                        value={newQuickDeadlineName}
                        onChange={(e) => setNewQuickDeadlineName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-slate-650 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 transition-all font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                          Priority
                        </label>
                        <select
                          value={newQuickDeadlinePriority}
                          onChange={(e) => setNewQuickDeadlinePriority(e.target.value as Task["priority"])}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="Critical">🚨 Critical</option>
                          <option value="High">🔴 High</option>
                          <option value="Medium">🟡 Medium</option>
                          <option value="Low">🟢 Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold font-mono mb-1">
                          Due in
                        </label>
                        <select
                          value={newQuickDeadlineHrs}
                          onChange={(e) => setNewQuickDeadlineHrs(parseInt(e.target.value) || 4)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="2">2 Hours</option>
                          <option value="4">4 Hours</option>
                          <option value="12">12 Hours</option>
                          <option value="24">24 Hours (1d)</option>
                          <option value="48">48 Hours (2d)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-amber-600 to-amber-750 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Enlist Deadline
                    </button>
                  </form>

                  {/* List of upcoming deadlines */}
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {tasks.filter(t => !t.completed).length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic text-center py-6">No pending deadlines scheduled.</p>
                    ) : (
                      [...tasks]
                        .filter(t => !t.completed)
                        .sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime())
                        .slice(0, 6)
                        .map((task) => {
                          const isOverdue = new Date(task.deadline).getTime() < Date.now();
                          const priorityColor = 
                            task.priority === "Critical" ? "text-rose-450 border-rose-500/20 bg-rose-500/5" :
                            task.priority === "High" ? "text-orange-450 border-orange-500/20 bg-orange-500/5" :
                            task.priority === "Medium" ? "text-yellow-450 border-yellow-500/20 bg-yellow-500/5" :
                            "text-green-450 border-green-500/20 bg-green-500/5";

                          return (
                            <div 
                              key={task.id}
                              className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 hover:border-slate-800 transition-all flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="overflow-hidden flex items-start gap-2">
                                <button
                                  onClick={() => { toggleTaskComplete(task.id); playTacticalSound("click"); }}
                                  className="mt-0.5 text-slate-500 hover:text-emerald-450"
                                >
                                  <div className="w-4 h-4 rounded-full border border-slate-700 hover:border-slate-400" />
                                </button>
                                <div className="overflow-hidden">
                                  <span className="font-semibold block text-slate-200 truncate">{task.name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[8px] font-mono border px-1 rounded uppercase font-bold tracking-wider ${priorityColor}`}>
                                      {task.priority}
                                    </span>
                                    <span className={`text-[9px] font-mono ${isOverdue ? "text-rose-450 font-bold" : "text-slate-400"}`}>
                                      {isOverdue ? "Overdue: " : "Due: "}
                                      {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })} at {new Date(task.deadline).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick timer Sprint loader button */}
                              <button
                                onClick={() => handleSprintClick(task)}
                                className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 border ${
                                  timerTaskId === task.id
                                    ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                                    : "bg-slate-900 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white"
                                }`}
                                title={timerTaskId === task.id ? "Pause Sprint timer" : "Start Focus Sprint"}
                              >
                                <Zap className={`w-3.5 h-3.5 ${timerTaskId === task.id ? "animate-pulse text-rose-400" : "text-amber-450"}`} />
                              </button>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

              </div>

              {/* 3. ADVANCED VISUALIZATIONS & HISTORIC PERFORMANCE DECK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800/80 pt-6">
                
                {/* CALENDAR HEATMAP */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 flex flex-col gap-3 relative overflow-hidden">
                  <div>
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1 text-slate-200">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      14-Day Habit Completion Heatmap
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Visual logs showing completion density. Overlaid blue border marks protected frozen grace days.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 py-3 border border-slate-900 bg-slate-950 rounded-lg p-2.5">
                    {(() => {
                      const dayStrings = [];
                      for (let i = 13; i >= 0; i--) {
                        const d = new Date(Date.now() - i * 86400000);
                        dayStrings.push(d.toISOString().split("T")[0]);
                      }

                      return dayStrings.map((dayStr) => {
                        const localDate = new Date(dayStr + "T12:00:00");
                        const label = localDate.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
                        
                        // Calculate completions
                        const totalActiveHabitsCount = habits.length || 1;
                        const completionsOnDay = habitHistory.filter(e => e.date === dayStr && e.completed).length;
                        const freezesOnDay = habitHistory.filter(e => e.date === dayStr && e.isFrozen).length;
                        
                        const completionRatio = completionsOnDay / totalActiveHabitsCount;
                        
                        // Intensity classes
                        let intensityClass = "bg-slate-900 border-slate-800 text-slate-600";
                        if (completionsOnDay > 0) {
                          if (completionRatio <= 0.35) intensityClass = "bg-emerald-950 border-emerald-900 text-emerald-450";
                          else if (completionRatio <= 0.7) intensityClass = "bg-emerald-800 border-emerald-750 text-emerald-300";
                          else intensityClass = "bg-emerald-500 border-emerald-400 text-emerald-950";
                        }
                        
                        // Freeze override border outline
                        const freezeOutline = freezesOnDay > 0 ? "ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-950" : "";

                        return (
                          <div 
                            key={dayStr}
                            className={`w-11 h-11 rounded flex flex-col items-center justify-center text-[9px] font-mono border transition-all ${intensityClass} ${freezeOutline}`}
                            title={`${label}: ${completionsOnDay} completed ${freezesOnDay > 0 ? " (Protected by Freeze)" : ""}`}
                          >
                            <span className="font-bold opacity-80">{localDate.getDate()}</span>
                            <span className="text-[7px] scale-90 uppercase tracking-widest block opacity-70">
                              {localDate.toLocaleDateString(undefined, { weekday: "narrow" })}
                            </span>
                            {freezesOnDay > 0 && <span className="text-[7px] text-cyan-450 font-bold block scale-75 mt-[-1px]">❄️</span>}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-slate-500 justify-end">
                    <span>Legend:</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded" /> None</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-950 border border-emerald-900 rounded" /> Low</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-800 border border-emerald-750 rounded" /> Medium</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 border border-emerald-450 rounded" /> Maxed</span>
                    <span className="flex items-center gap-1 text-cyan-400"><span className="w-2.5 h-2.5 bg-slate-900 border-cyan-500 border-2 rounded" /> Frozen</span>
                  </div>
                </div>

                {/* PERFORMANCE TRENDS CHART */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4.5 flex flex-col gap-3 relative overflow-hidden">
                  <div>
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1 text-slate-200">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      7-Day Completion Rate Trends
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Rolling metrics showcasing completed goals and habits percentages over the last week.
                    </p>
                  </div>

                  {/* SVG Custom Responsive Bar Chart */}
                  <div className="w-full h-[120px] bg-slate-950 rounded border border-slate-900/80 p-2 relative flex items-end justify-between gap-1 mt-1.5">
                    {(() => {
                      const last7Days = [];
                      for (let i = 6; i >= 0; i--) {
                        const d = new Date(Date.now() - i * 86400000);
                        last7Days.push(d.toISOString().split("T")[0]);
                      }

                      return last7Days.map((dayStr) => {
                        const dateObj = new Date(dayStr + "T12:00:00");
                        const activeHabitsCount = habits.length || 1;
                        const completes = habitHistory.filter(e => e.date === dayStr && e.completed).length;
                        const freezes = habitHistory.filter(e => e.date === dayStr && e.isFrozen).length;
                        const totalScore = completes + freezes;
                        const percent = Math.min(100, Math.round((totalScore / activeHabitsCount) * 100));
                        
                        // Height in pixels (max 90px)
                        const barHeight = Math.max(8, Math.round((percent / 100) * 80));

                        return (
                          <div key={dayStr} className="flex flex-col items-center flex-1 group">
                            {/* Hover tooltip */}
                            <div className="absolute bottom-18 bg-slate-900 border border-slate-800 text-[9px] font-mono px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                              <span className="block text-white font-bold">{percent}% Routine Completion</span>
                              <span className="block text-slate-400">{completes} checked • {freezes} frozen</span>
                            </div>

                            {/* Value marker */}
                            <span className="text-[8px] font-mono text-slate-500 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {percent}%
                            </span>

                            {/* Bar segment */}
                            <div className="w-5 sm:w-7 bg-slate-900 rounded-t overflow-hidden relative border border-slate-850 h-[80px] flex items-end">
                              <div 
                                className="w-full bg-gradient-to-t from-emerald-600 to-rose-500 transition-all duration-1000 ease-out rounded-t relative" 
                                style={{ height: `${barHeight}px` }}
                              >
                                {freezes > 0 && (
                                  <div className="absolute inset-x-0 top-0 h-1.5 bg-cyan-400 opacity-85" title="Frozen" />
                                )}
                              </div>
                            </div>

                            {/* Day Axis Label */}
                            <span className="text-[9px] font-mono text-slate-500 mt-2 font-bold uppercase tracking-wider">
                              {dateObj.toLocaleDateString(undefined, { weekday: "short" })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: AI OPERATIONS CONTROL CONSOLE */}
          {false && activeTab === "ai-ops" && (
            <div className="flex flex-col gap-6">
              
              {/* Header block with glowing visual accent */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display font-semibold text-lg text-white tracking-wide flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                      AI Operations Control Console
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Consolidated AI hub for automated command briefings, autonomous tactical planning, system diagnostics, and performance analytics.
                    </p>
                  </div>
                </div>

                {/* Sub-tabs selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/60 mt-5">
                  <button
                    type="button"
                    onClick={() => { setAiOpsSubTab("briefing"); playTacticalSound("click"); }}
                    className={`text-[10px] md:text-xs py-2 rounded-lg font-semibold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                      aiOpsSubTab === "briefing"
                        ? "bg-slate-900 border border-slate-800 text-emerald-400 shadow-md shadow-slate-950/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Daily Briefing
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiOpsSubTab("planner"); playTacticalSound("click"); }}
                    className={`text-[10px] md:text-xs py-2 rounded-lg font-semibold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                      aiOpsSubTab === "planner"
                        ? "bg-slate-900 border border-slate-800 text-emerald-400 shadow-md shadow-slate-950/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Tactical Planner
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiOpsSubTab("diagnostics"); playTacticalSound("click"); }}
                    className={`text-[10px] md:text-xs py-2 rounded-lg font-semibold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                      aiOpsSubTab === "diagnostics"
                        ? "bg-slate-900 border border-slate-800 text-emerald-400 shadow-md shadow-slate-950/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Diagnostics & Readiness
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiOpsSubTab("analytics"); playTacticalSound("click"); }}
                    className={`text-[10px] md:text-xs py-2 rounded-lg font-semibold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                      aiOpsSubTab === "analytics"
                        ? "bg-slate-900 border border-slate-800 text-emerald-400 shadow-md shadow-slate-950/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Productivity Analytics
                  </button>
                </div>
              </div>

              {/* Dynamic Sub-tab Views */}
              {aiOpsSubTab === "briefing" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-sm font-display font-semibold text-white tracking-wide uppercase">
                        Daily Command Briefing Feed
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Real-time tactical intelligence and combat strategy updates.</p>
                    </div>
                    <button
                      onClick={fetchDailyBriefing}
                      disabled={briefingLoading}
                      title="Compile new Daily Briefing"
                      className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer animate-none"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${briefingLoading ? "animate-spin" : ""}`} />
                      <span>{briefingLoading ? "Compiling..." : "Refile Briefing"}</span>
                    </button>
                  </div>

                  {briefingLoading ? (
                    <div className="space-y-4 py-3">
                      <div className="h-4 bg-slate-800 rounded w-1/3 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-800 rounded w-full animate-pulse" />
                        <div className="h-3 bg-slate-800 rounded w-5/6 animate-pulse" />
                        <div className="h-3 bg-slate-800 rounded w-4/5 animate-pulse" />
                      </div>
                    </div>
                  ) : briefingError ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{briefingError}</span>
                    </div>
                  ) : dailyBriefing ? (
                    <div className="space-y-4 font-sans">
                      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 flex items-center gap-3">
                        <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg shrink-0">
                          <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
                        </span>
                        <div>
                          <span className="block text-[10px] text-slate-500 font-mono uppercase">Operational Greeting</span>
                          <p className="text-slate-100 font-medium text-xs sm:text-sm leading-relaxed tracking-wide">
                            {dailyBriefing.greeting}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-5 flex flex-col gap-4 shadow-inner">
                        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-900 pb-2 mb-1">
                          Tactical Objectives Summary
                        </div>
                        {dailyBriefing.summary.split('\n').filter(line => line.trim().length > 0).map((line, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <p className="text-xs text-slate-300 leading-relaxed">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                      <p className="text-xs text-slate-500 italic font-mono mb-3">
                        No briefing compiled. Refresh feed to retrieve latest daily combat brief.
                      </p>
                      <button
                        onClick={fetchDailyBriefing}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                      >
                        Compile Briefing Feed
                      </button>
                    </div>
                  )}
                </div>
              )}

              {aiOpsSubTab === "planner" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-sm font-display font-semibold text-white tracking-wide uppercase">
                        AI Autonomous Tactical Planner
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Decompose high-level plans or balance the active workload.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/60 mb-5">
                    <button
                      type="button"
                      onClick={() => { setPlannerTab("decompose"); playTacticalSound("click"); }}
                      className={`text-[10px] md:text-xs py-2 rounded-lg font-semibold transition-all uppercase tracking-wider cursor-pointer ${
                        plannerTab === "decompose"
                          ? "bg-slate-900 border border-slate-850 text-white shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      🤖 Decompose Goal
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPlannerTab("optimize"); playTacticalSound("click"); }}
                      className={`text-[10px] md:text-xs py-2 rounded-lg font-semibold transition-all uppercase tracking-wider cursor-pointer ${
                        plannerTab === "optimize"
                          ? "bg-slate-900 border border-slate-850 text-white shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ⚡ Optimize Active Workload
                    </button>
                  </div>

                  {plannerTab === "decompose" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
                          Define High-Level Tactical Objective
                        </label>
                        <textarea
                          disabled={agentPlanning}
                          rows={3}
                          placeholder="e.g. Build an executive slide presentation, test core modules, and prepare deployment sequence in the next 3 hours..."
                          value={autonomousGoal}
                          onChange={(e) => setAutonomousGoal(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-xl mb-5">
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        This autonomous routine analyzes all active, unfinished tasks currently on your board. 
                        It load-balances their sequence, spaces out their deadlines, sets realistic focus durations, and attaches micro-coaching advice to each task!
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-950">
                        <span>Tasks detected for processing:</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          {tasks.filter(t => !t.completed).length} targets active
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stagger Horizon Selector */}
                  <div className="mt-5">
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider font-mono">
                      Time-Horizon Budget (Distribute tasks across)
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 bg-slate-950/50 p-1 rounded-xl border border-slate-850">
                      {[2, 4, 8, 12, 24].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setStaggerHorizon(h)}
                          className={`text-[10px] py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                            staggerHorizon === h
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                          }`}
                        >
                          {h}H
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Agent terminal progress logs */}
                  {agentPlanning && (
                    <div className="mt-5 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-1.5 shadow-inner max-h-[160px] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-2 text-slate-500">
                        <span>🤖 PLANNER_AGENT_SHELL v1.0.4</span>
                        <span className="animate-pulse font-bold text-emerald-400">● RUNNING</span>
                      </div>
                      {agentLogs.map((log, index) => (
                        <div key={index} className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-500">{">"}</span>
                          <span>{log}</span>
                        </div>
                      ))}
                      {agentLogs.length < 5 && (
                        <div className="text-slate-500 animate-pulse flex items-center gap-1">
                          <span>{">"}</span>
                          <span>Computing tactical matrices...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trigger Buttons */}
                  <div className="mt-6">
                    {plannerTab === "decompose" ? (
                      <button
                        type="button"
                        disabled={agentPlanning || !autonomousGoal.trim()}
                        onClick={() => runAutonomousPlanning("decompose")}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 border border-emerald-500/20 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {agentPlanning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Agent Strategizing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-white" />
                            <span>Generate Autonomous Tactical Blueprint</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={agentPlanning || tasks.filter(t => !t.completed).length === 0}
                        onClick={() => runAutonomousPlanning("optimize-existing")}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 border border-emerald-500/20 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {agentPlanning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Balancing Load Matrices...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-white" />
                            <span>Auto-Optimize & Balance Active Workload</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {aiOpsSubTab === "diagnostics" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-sm font-display font-semibold text-white tracking-wide uppercase flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                        AI Tactical Diagnostics & Readiness
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Comprehensive risk assessment and direct focus interventions.</p>
                    </div>
                    <button
                      onClick={runAIDiagnostics}
                      disabled={diagnosticsLoader}
                      className="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 animate-glow"
                    >
                      <RefreshCw className={`w-4 h-4 ${diagnosticsLoader ? "animate-spin" : ""}`} />
                      <span>{diagnosticsLoader ? "Analyzing Workload..." : "Run Tactical Diagnosis"}</span>
                    </button>
                  </div>

                  {/* LOADING SCANNER */}
                  {diagnosticsLoader && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping duration-1500" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-amber-400 uppercase tracking-widest animate-pulse">Running Neural Diagnostics...</p>
                        <p className="text-[10px] text-slate-500 font-mono">SCANNING ENLISTED TASKS • CALCULATING OVERDUE COEF • COGNITIVE OVERLAP SENSORS ACTIVE</p>
                      </div>
                    </div>
                  )}

                  {/* DIAGNOSTICS CONTENT */}
                  {!diagnosticsLoader && (
                    <>
                      {recommendations ? (
                        <div className="space-y-6">
                          
                          {/* Top Row: Readiness Meter & Assessment badge */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 border border-slate-800/60 p-4 rounded-xl">
                            
                            {/* Readiness Circular Meter */}
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full -rotate-90">
                                  <circle cx="32" cy="32" r="26" className="stroke-slate-900 fill-none" strokeWidth="4" />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    className={`fill-none transition-all duration-1000 ${
                                      recommendations.threatAssessment === "Red" ? "stroke-red-500" :
                                      recommendations.threatAssessment === "Amber" ? "stroke-amber-500" : "stroke-emerald-500"
                                    }`}
                                    strokeWidth="4"
                                    strokeDasharray={2 * Math.PI * 26}
                                    strokeDashoffset={2 * Math.PI * 26 * (1 - recommendations.combatReadinessRating / 100)}
                                  />
                                </svg>
                                <span className="absolute text-xs font-mono font-bold text-white">
                                  {recommendations.combatReadinessRating}%
                                </span>
                              </div>
                              <div>
                                <span className="block text-xs font-semibold text-slate-300">
                                  Combat Readiness Rating
                                </span>
                                <span className="block text-[10px] text-slate-500 font-mono">
                                  Neural readiness ratio calculated from active items
                                </span>
                              </div>
                            </div>

                            {/* Threat Assessment Badge Box */}
                            <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
                              <div>
                                <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Overall Threat Level</span>
                                <span className={`text-base font-bold tracking-tight block ${
                                  recommendations.threatAssessment === "Red" ? "text-red-400" :
                                  recommendations.threatAssessment === "Amber" ? "text-amber-400" : "text-emerald-400"
                                }`}>
                                  {recommendations.threatAssessment === "Red" ? "🟥 RED ALERT" :
                                   recommendations.threatAssessment === "Amber" ? "🟨 AMBER CAUTION" : "🟩 GREEN OPERATIONAL"}
                                </span>
                              </div>
                              <div className={`p-2 rounded-xl shrink-0 ${
                                recommendations.threatAssessment === "Red" ? "bg-red-500/10 border border-red-500/20 text-red-400" :
                                recommendations.threatAssessment === "Amber" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" :
                                "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              }`}>
                                {recommendations.threatAssessment === "Red" ? <ShieldAlert className="w-5 h-5 animate-pulse" /> :
                                 recommendations.threatAssessment === "Amber" ? <AlertTriangle className="w-5 h-5" /> :
                                 <ShieldCheck className="w-5 h-5" />}
                              </div>
                            </div>

                          </div>

                          {/* Columns: Risks vs Recommendations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Risks detected */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                Identified Security Risks ({recommendations.risksDetected?.length || 0})
                              </h4>
                              <div className="space-y-2">
                                {recommendations.risksDetected && recommendations.risksDetected.length > 0 ? (
                                  recommendations.risksDetected.map((risk, index) => (
                                    <div key={index} className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl flex items-start gap-2.5">
                                      <span className="text-red-400 text-xs shrink-0 mt-0.5">•</span>
                                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{risk}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center text-[10px] text-slate-500 font-mono">
                                    NO CRITICAL COGNITIVE OVERLAPS DETECTED
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tactical Interventions */}
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                Actionable Interventions ({recommendations.recommendations?.length || 0})
                              </h4>
                              <div className="space-y-2">
                                {recommendations.recommendations && recommendations.recommendations.length > 0 ? (
                                  recommendations.recommendations.map((rec, index) => (
                                    <div key={index} className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex items-start gap-2.5">
                                      <span className="text-amber-400 text-xs shrink-0 mt-0.5">⚡</span>
                                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{rec}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center text-[10px] text-slate-500 font-mono">
                                    NO INTERVENTIONS REQUIRED AT THIS TIME
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>

                          {/* Coach motivational quote */}
                          {recommendations.motivationalQuote && (
                            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl border-l-2 border-l-amber-500">
                              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 select-none">AI Coach Motivation</p>
                              <p className="text-xs text-slate-300 italic font-sans leading-relaxed">
                                "{recommendations.motivationalQuote}"
                              </p>
                            </div>
                          )}

                        </div>
                      ) : (
                        /* Empty/Pending State */
                        <div className="py-10 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
                            <Activity className="w-5 h-5 text-slate-600 stroke-1" />
                          </div>
                          <p className="text-xs font-semibold text-slate-400">Tactical Assessment Pending</p>
                          <p className="text-[11px] text-slate-500 max-w-sm mt-1 font-sans">
                            Run a neural diagnostic analysis on your current checklist to identify threat levels and extract actionable AI suggestions.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {aiOpsSubTab === "analytics" && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  
                  {/* Sync Row */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-display font-semibold text-white tracking-wide uppercase">
                          AI Productivity Analytics & Insights
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">
                          Dynamic tactical report showing completion spikes, focus window estimates, and performance coefficients.
                        </p>
                      </div>
                      <button
                        onClick={fetchProductivityAnalytics}
                        disabled={analyticsLoading}
                        className="shrink-0 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                      >
                        <RefreshCw className={`w-4 h-4 ${analyticsLoading ? "animate-spin" : ""}`} />
                        <span>{analyticsLoading ? "Compiling Report..." : "Sync Live AI Insights"}</span>
                      </button>
                    </div>

                    {analyticsError && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{analyticsError}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* RADIAL SCORE */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[280px]">
                      <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <h4 className="text-xs font-display font-semibold text-slate-400 uppercase tracking-widest mb-4">
                        Productivity Rating (0-100)
                      </h4>

                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-slate-800/80 fill-none"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-teal-500 fill-none transition-all duration-1000"
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - (analyticsData?.productivityScore || 0) / 100)}`}
                            strokeLinecap="round"
                            style={{
                              filter: "drop-shadow(0 0 4px rgba(20, 184, 166, 0.5))"
                            }}
                          />
                        </svg>
                        
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="font-mono text-4xl font-extrabold text-white tracking-tight">
                            {analyticsData?.productivityScore || 0}
                          </span>
                          <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider">
                            Tactical Score
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-3 py-1 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          {(analyticsData?.productivityScore || 0) >= 85 
                            ? "🔥 PEAK EFFICIENCY ACTIVE" 
                            : (analyticsData?.productivityScore || 0) >= 70 
                            ? "⚡ HIGH COMBAT STABILITY" 
                            : "⚠️ OPERATIONAL DEFICIT WARNING"}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-normal font-sans">
                          Calculated from Critical task ratios, deadline margins, and daily habit consistency checks.
                        </p>
                      </div>
                    </div>

                    {/* FOCUS HOURS */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                          <Clock className="w-4 h-4 text-teal-400" />
                          <h4 className="text-xs font-display font-semibold text-slate-300 uppercase tracking-wider">
                            Peak Focus Window Insight
                          </h4>
                        </div>

                        <div className="py-4">
                          <div className="text-2xl font-display font-extrabold text-white tracking-wide">
                            {analyticsData?.peakHours.timeRange || "2:00 PM - 5:00 PM"}
                          </div>
                          <p className="text-xs text-teal-400 font-semibold mt-1 font-sans">
                            🚀 Focus efficiency is {analyticsData?.peakHours.focusMultiplier || 42}% higher during this period
                          </p>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 border border-slate-800 p-3 rounded-xl font-sans">
                          {analyticsData?.peakHours.coachingTip || "Your completion spikes are heavily clustered in late afternoon hours. Safeguard this block."}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <span>Calculated by AI from task completion timestamps</span>
                      </div>
                    </div>
                  </div>

                  {/* WEEKLY TREND CHART */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
                      <h3 className="text-xs font-display font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Weekly Task Completion Trend
                      </h3>
                      <span className="text-[9px] font-mono text-slate-500">
                        Last 7 days completion load
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-7 gap-3 items-end h-40 pt-4 px-2 border-b border-slate-800">
                        {getWeeklyTrendData().map((day, idx) => {
                          const maxCount = Math.max(...getWeeklyTrendData().map(d => d.count), 1);
                          const barPercent = (day.count / maxCount) * 100;
                          return (
                            <div key={idx} className="flex flex-col items-center group relative cursor-pointer">
                              
                              <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 text-[10px] font-mono shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center w-24">
                                <span className="block font-bold text-teal-400">{day.count} Task(s)</span>
                                <span className="text-slate-400 text-[8px]">{day.dateStr}</span>
                              </div>

                              <div className="w-full bg-slate-950 rounded-t-lg h-full relative overflow-hidden flex items-end">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${barPercent}%` }}
                                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                                  className={`w-full rounded-t-md relative group-hover:brightness-110 transition-all ${
                                    day.count > 0 
                                      ? "bg-gradient-to-t from-teal-500 to-emerald-400" 
                                      : "bg-slate-900 border-t border-slate-800"
                                  }`}
                                  style={{
                                    boxShadow: day.count > 0 ? "0 0 10px rgba(20,184,166,0.15)" : "none"
                                  }}
                                />
                              </div>

                              <span className="text-[9px] font-mono font-bold text-slate-300 mt-1">
                                {day.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-7 gap-3 px-2 text-center text-[10px] font-mono text-slate-400">
                        {getWeeklyTrendData().map((day, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="font-semibold text-slate-200">{day.dayName}</span>
                            <span className="text-[8px] text-slate-600 mt-0.5">{day.dateStr.split(" ")[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* WEEKLY SUMMARY & PERFORMANCE AUDIT */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-teal-400" />
                        <h3 className="text-xs font-display font-semibold text-slate-300 uppercase tracking-wider">
                          Deadline Guard Weekly Performance Audit
                        </h3>
                      </div>
                      {analyticsData?.weakSpotCategory && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          Weak Spot: {analyticsData.weakSpotCategory}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 font-sans text-xs text-slate-300 leading-relaxed mb-6">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-900 pb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Tactical Summary Feed</span>
                      </div>
                      {analyticsData?.weeklySummary ? (
                        <p className="whitespace-pre-wrap">{analyticsData.weeklySummary}</p>
                      ) : (
                        <p className="text-slate-500 italic text-center py-4 font-mono">
                          No analytical summary compiled yet. Run AI Analytics to generate.
                        </p>
                      )}
                    </div>

                    <h4 className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">
                      AI Tactical Recommendations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {analyticsData?.recommendationList && analyticsData.recommendationList.length > 0 ? (
                        analyticsData.recommendationList.map((rec, idx) => (
                          <div 
                            key={idx} 
                            className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs mt-0.5 shrink-0">
                                <Zap className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-[11px] text-slate-300 leading-snug font-sans">{rec}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-4 text-slate-500 italic font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                          Waiting to generate AI recommendations...
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </section>

        {/* RIGHT COLUMN: TIMER & AI COACH CHAT CONSOLE (5 Cols) */}
        {rightColumnPinned && (
          <section id="strategy-hub" className="lg:col-span-5 flex flex-col gap-6">
            {renderRightColumnContent()}
          </section>
        )}

      </main>
      )}

      {/* FLOATING HANDLE / TRIGGER FOR UNPINNED RIGHT COLUMN */}
      {layoutMode === "split" && !rightColumnPinned && !isRightColumnOpen && (
        <div className="fixed right-6 bottom-6 z-40">
          <button
            onClick={() => {
              setIsRightColumnOpen(true);
              playTacticalSound("click");
            }}
            className="group flex items-center gap-3 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 pl-4 pr-5 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:translate-y-[-2px] active:scale-95 cursor-pointer"
            title="Open Deadline Guard AI"
          >
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <LifeBuoy className="w-5 h-5 text-emerald-400 relative z-10 animate-[spin_8s_linear_infinite]" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400">Deadline Guard AI</span>
              <span className="text-[8px] font-mono text-slate-400">Agent Online</span>
            </div>
          </button>
        </div>
      )}

      {/* OVERLAY DRAWER FOR UNPINNED RIGHT COLUMN */}
      <AnimatePresence>
        {layoutMode === "split" && !rightColumnPinned && isRightColumnOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsRightColumnOpen(false);
                playTacticalSound("click");
              }}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-slate-800/80 shadow-2xl z-50 flex flex-col p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Deadline Guard AI (Unpinned)</span>
                <button
                  onClick={() => {
                    setIsRightColumnOpen(false);
                    playTacticalSound("click");
                  }}
                  className="p-1.5 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer text-xs"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {renderRightColumnContent()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CINEMA SPRINT FOCUS LAYOUT */}
      {layoutMode === "cinema" && (
        <main id="cinema-workspace" className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8 justify-center items-center">
          
          {/* Header Banner */}
          <div className="text-center space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-mono uppercase tracking-widest animate-pulse">
              <Eye className="w-3.5 h-3.5" />
              <span>Immersive Cinema Sprint Chamber</span>
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight">
              Distraction-Free Focus
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">
              All other elements have been hidden to maximize your raw cognitive focus. Take deep breaths and complete the locked threat!
            </p>
          </div>

          <div className="w-full max-w-xl mx-auto">
            
            {/* TIMER CARD */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Circular SVG Progress Timer */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-emerald-500/10 animate-ping duration-3000" />
                <svg className="w-full h-full -rotate-90">
                  <circle cx="128" cy="128" r="105" className="stroke-slate-950 fill-none" strokeWidth="8" />
                  <circle
                    cx="128"
                    cy="128"
                    r="105"
                    className="stroke-emerald-500 fill-none transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 105}
                    strokeDashoffset={2 * Math.PI * 105 * (1 - (timerSeconds / (timerOriginalDuration || 1500)))}
                    strokeLinecap="round"
                  />
                </svg>
                
                <div className="absolute flex flex-col items-center z-10">
                  {isEditingTimer ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800">
                        <input
                          type="text"
                          maxLength={3}
                          value={editTimerMinutes}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setEditTimerMinutes(val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveManualTimer();
                            if (e.key === "Escape") setIsEditingTimer(false);
                          }}
                          className="w-12 bg-transparent text-white font-mono text-3xl font-bold text-center border-b-2 border-emerald-500 focus:outline-none focus:border-emerald-400 py-0.5"
                          autoFocus
                        />
                        <span className="text-white font-mono text-2xl font-bold animate-pulse">:</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={editTimerSeconds}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setEditTimerSeconds(val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveManualTimer();
                            if (e.key === "Escape") setIsEditingTimer(false);
                          }}
                          className="w-12 bg-transparent text-white font-mono text-3xl font-bold text-center border-b-2 border-emerald-500 focus:outline-none focus:border-emerald-400 py-0.5"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveManualTimer}
                          className="text-[9px] uppercase font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingTimer(false)}
                          className="text-[9px] uppercase font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (timerActive) setTimerActive(false);
                          const mins = Math.floor(timerSeconds / 60);
                          const secs = timerSeconds % 60;
                          setEditTimerMinutes(String(mins));
                          setEditTimerSeconds(String(secs).padStart(2, "0"));
                          setIsEditingTimer(true);
                        }}
                        className="font-mono text-5xl font-bold text-white tracking-tight hover:text-emerald-400 hover:scale-105 transition-all cursor-pointer select-none bg-transparent border-none outline-none focus:outline-none"
                        title="Click to edit timer manually"
                      >
                        {formatTimerString(timerSeconds)}
                      </button>
                      <span className="text-[9px] uppercase font-mono text-slate-500 tracking-widest mt-1 flex items-center gap-1">
                        {timerActive ? "Sprinting" : "Paused"}
                        <span className="text-[8px] text-slate-600 font-normal lowercase">(click digits to edit)</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Locked Target Details */}
              <div className="text-center w-full max-w-sm mt-6 mb-6">
                {focusedTask && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase font-mono font-bold">
                      {focusedTask.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Est: {focusedTask.duration} mins
                    </span>
                  </div>
                )}
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setTimerActive(!timerActive); playTacticalSound("click"); }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg ${
                    timerActive 
                      ? "bg-slate-800 border border-slate-700 hover:border-slate-500 text-white" 
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                  title={timerActive ? "Pause Sprint" : "Initiate Focus Sprint"}
                >
                  {timerActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setTimerActive(false);
                    setTimerSeconds(timerOriginalDuration);
                    playTacticalSound("click");
                  }}
                  className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  title="Reset Sprint Time"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {focusedTask && (
                  <button
                    onClick={() => {
                      toggleTaskComplete(focusedTask.id);
                      setTimerActive(false);
                    }}
                    className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                    title="Mark Current Target Complete"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Quick Intervals */}
              <div className="w-full mt-6 pt-5 border-t border-slate-800/60 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Quick Presets</span>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full">
                  <button
                    onClick={() => loadGenericMinutes(10)}
                    className="bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-600 text-[10px] py-2 rounded-lg font-mono transition-all cursor-pointer"
                  >
                    10m Quick
                  </button>
                  <button
                    onClick={() => loadGenericMinutes(25)}
                    className="bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-600 text-[10px] py-2 rounded-lg font-mono transition-all cursor-pointer"
                  >
                    25m Pomodoro
                  </button>
                  <button
                    onClick={() => loadGenericMinutes(50)}
                    className="bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-600 text-[10px] py-2 rounded-lg font-mono transition-all cursor-pointer"
                  >
                    50m Deep
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Manual Set</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/50 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5 flex-1 justify-center">
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={editTimerMinutes}
                      onChange={(e) => setEditTimerMinutes(e.target.value)}
                      placeholder="Min"
                      className="w-16 bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-slate-500 font-mono">m</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editTimerSeconds}
                      onChange={(e) => setEditTimerSeconds(e.target.value)}
                      placeholder="Sec"
                      className="w-16 bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1 text-xs text-center font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-xs text-slate-500 font-mono">s</span>
                  </div>
                  <button
                    onClick={() => {
                      const mins = parseInt(editTimerMinutes, 10) || 0;
                      const secs = parseInt(editTimerSeconds, 10) || 0;
                      const totalSecs = (mins * 60) + secs;
                      if (totalSecs >= 0) {
                        playTacticalSound("click");
                        setTimerTaskId(null);
                        setTimerSeconds(totalSecs);
                        setTimerOriginalDuration(totalSecs);
                        setTimerActive(false);
                      }
                    }}
                    className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 text-[10px] font-mono px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    Apply
                  </button>
                </div>
              </div>

            </div>

          </div>

        </main>
      )}

      {/* FLOATING CONTEXT-AWARE REMINDER TOASTS STACK */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {reminders.map((rem) => {
            let borderClass = "border-l-4 border-l-emerald-500";
            let badgeClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            if (rem.stage === "6h") {
              borderClass = "border-l-4 border-l-indigo-500";
              badgeClass = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
            } else if (rem.stage === "1h") {
              borderClass = "border-l-4 border-l-amber-500";
              badgeClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
            } else if (rem.stage === "overdue") {
              borderClass = "border-l-4 border-l-red-500";
              badgeClass = "text-red-400 bg-red-500/10 border-red-500/20";
            }

            return (
              <motion.div
                key={rem.id}
                initial={{ opacity: 0, x: 100, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
                layout
                className={`pointer-events-auto w-full bg-slate-900/95 border border-slate-800/80 backdrop-blur-md rounded-xl p-4 shadow-2xl flex flex-col gap-3 ${borderClass}`}
              >
                {/* Header: Badge, Emoji, Close button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{rem.emoji}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border rounded shrink-0 ${badgeClass}`}>
                      {rem.stageLabel}
                    </span>
                    {!rem.autoDismiss && (
                      <span className="text-[8px] font-mono font-bold bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shrink-0">
                        Critical
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      playTacticalSound("click");
                      setReminders(prev => prev.filter(r => r.id !== rem.id));
                    }}
                    className="p-1 hover:bg-slate-800/60 rounded text-slate-500 hover:text-slate-300 transition-all cursor-pointer font-sans"
                    title="Dismiss alert"
                  >
                    ✕
                  </button>
                </div>

                {/* Task Details */}
                <div className="flex flex-col gap-1 text-left">
                  <h4 className="text-xs font-bold text-white tracking-tight line-clamp-1">
                    {rem.taskName}
                  </h4>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                    <span>Category: {rem.task.category || "General"}</span>
                    <span>•</span>
                    <span>Priority: {rem.task.priority}</span>
                  </div>
                </div>

                {/* AI Plan / Message Body */}
                <div className="text-left bg-slate-950/60 border border-slate-800/40 p-2.5 rounded-lg min-h-[50px] flex items-center">
                  {rem.aiMessage === null ? (
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-mono animate-pulse w-full">
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />
                      <span>🤖 Getting AI plan...</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-300 leading-normal font-sans">
                      {rem.aiMessage}
                    </p>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <button
                    onClick={() => {
                      playTacticalSound("click");
                      setReminders(prev => prev.filter(r => r.id !== rem.id));
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      handleViewTask(rem.task);
                      setReminders(prev => prev.filter(r => r.id !== rem.id));
                    }}
                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View Task
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
