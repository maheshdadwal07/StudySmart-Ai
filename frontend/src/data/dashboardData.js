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
    title: "Recent Documents",
    value: "42",
    trend: "+18%",
    trendDir: "up",
    icon: FileText,
    iconBg: "rgba(79,70,229,0.09)",
    iconColor: "#4F46E5",
    progress: null,
    progressColor: null
  },
  {
    title: "Learning Progress",
    value: "78%",
    trend: "+6%",
    trendDir: "up",
    icon: TrendingUp,
    iconBg: "rgba(34,197,94,0.09)",
    iconColor: "#22C55E",
    progress: 78,
    progressColor: "linear-gradient(90deg,var(--primary),var(--accent))"
  },
  {
    title: "Questions Generated",
    value: "1,204",
    trend: "+32%",
    trendDir: "up",
    icon: HelpCircle,
    iconBg: "rgba(6,182,212,0.09)",
    iconColor: "#06B6D4",
    progress: null,
    progressColor: null
  },
  {
    title: "Storage Used of 5 GB",
    value: "3.1 GB",
    trend: "62%",
    trendDir: "down",
    icon: Database,
    iconBg: "rgba(245,158,11,0.1)",
    iconColor: "#F59E0B",
    progress: 62,
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

export const recentUploadsData = [
  {
    name: "Operating Systems — Unit 4 Notes.pdf",
    meta: "Uploaded 2 hours ago · 3.2 MB",
    type: "pdf",
    tagText: "28 questions",
    tagClass: "tag-questions"
  },
  {
    name: "Product Analyst — Job Description.pptx",
    meta: "Uploaded yesterday · 1.8 MB",
    type: "ppt",
    tagText: "Summary ready",
    tagClass: "tag-summary"
  },
  {
    name: "Machine Learning — Chapter 7.docx",
    meta: "Uploaded 2 days ago · 5.1 MB",
    type: "docx",
    tagText: "40 questions",
    tagClass: "tag-questions"
  },
  {
    name: "DBMS Interview Prep — Full Guide.pdf",
    meta: "Uploaded 4 days ago · 2.4 MB",
    type: "pdf",
    tagText: "Summary ready",
    tagClass: "tag-summary"
  }
];

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
    iconColor: "#4F46E5"
  },
  {
    title: "Generate Questions",
    desc: "MCQs, interview & coding sets",
    icon: HelpCircle,
    iconColor: "#06B6D4"
  },
  {
    title: "View History",
    desc: "All past documents & results",
    icon: History,
    iconColor: "#22C55E"
  }
];
