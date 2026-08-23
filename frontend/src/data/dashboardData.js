import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  History,
  Upload,
  CreditCard,
  Settings,
  User,
  LogOut,
  FileText,
  TrendingUp,
  Database
} from 'lucide-react';

export const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    route: "/dashboard",
    badge: null,
    isActive: true
  },
  {
    title: "Study Mode",
    icon: BookOpen,
    route: "/study-mode",
    badge: null
  },
  {
    title: "Question Mode",
    icon: HelpCircle,
    route: "/question-mode",
    badge: null
  },
  {
    title: "History",
    icon: History,
    route: "/history",
    badge: null
  },
  {
    title: "Uploads",
    icon: Upload,
    route: "/uploads",
    badge: 12
  }
];

export const accountItems = [
  {
    title: "Pricing",
    icon: CreditCard,
    route: "/pricing",
    badge: null
  },
  {
    title: "Settings",
    icon: Settings,
    route: "/settings",
    badge: null
  },
  {
    title: "Profile",
    icon: User,
    route: "/profile",
    badge: null
  }
];

export const statCardsData = [
  {
    id: 'documents',
    title: "Documents Uploaded",
    value: "—",
    trend: null,
    trendDir: null,
    icon: FileText,
    iconBg: "rgba(79,70,229,0.09)",
    iconColor: "#4F46E5",
    progress: null,
    progressColor: null
  },
  {
    id: 'learning',
    title: "Learning Progress",
    value: "—",
    trend: null,
    trendDir: null,
    icon: TrendingUp,
    iconBg: "rgba(34,197,94,0.09)",
    iconColor: "#22C55E",
    progress: null,
    progressColor: "linear-gradient(90deg,var(--primary),var(--accent))"
  },
  {
    id: 'questions',
    title: "Questions Generated",
    value: "—",
    trend: null,
    trendDir: null,
    icon: HelpCircle,
    iconBg: "rgba(6,182,212,0.09)",
    iconColor: "#06B6D4",
    progress: null,
    progressColor: null
  },
  {
    id: 'storage',
    title: "Storage Used",
    value: "—",
    trend: null,
    trendDir: null,
    icon: Database,
    iconBg: "rgba(245,158,11,0.1)",
    iconColor: "#F59E0B",
    progress: null,
    progressColor: "linear-gradient(90deg,#fbbf24,var(--warning))"
  }
];

export const weeklyActivityData = [
  { day: "Mon", docs: 38, questions: 22 },
  { day: "Tue", docs: 55, questions: 40 },
  { day: "Wed", docs: 32, questions: 60 },
  { day: "Thu", docs: 70, questions: 45 },
  { day: "Fri", docs: 48, questions: 78 },
  { day: "Sat", docs: 90, questions: 65 },
  { day: "Sun", docs: 100, questions: 82 }
];

export const recentUploadsData = [];

export const progressStats = {
  percent: 78,
  studySessions: 32,
  questionSessions: 21,
  flashcards: 486
};

export const quickActionsData = [
  {
    title: "Start Study Mode",
    desc: "Summaries, notes & flashcards",
    icon: BookOpen,
    iconColor: "#4F46E5",
    route: "/study-mode"
  },
  {
    title: "Generate Questions",
    desc: "MCQs, interview & coding sets",
    icon: HelpCircle,
    iconColor: "#06B6D4",
    route: "/question-mode"
  },
  {
    title: "View History",
    desc: "All past documents & results",
    icon: History,
    iconColor: "#22C55E",
    route: "/history"
  }
];
