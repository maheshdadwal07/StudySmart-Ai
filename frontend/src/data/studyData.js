import { 
  AlignLeft, 
  FileText, 
  HelpCircle, 
  Maximize, // using Maximize for flashcards icon
  Hash, 
  MessageSquare 
} from 'lucide-react';

export const documentMeta = {
  title: "Operating Systems — Unit 4 Notes.pdf",
  status: "Processed",
  pages: 18,
  size: "3.2 MB"
};

export const documentPages = [
  {
    pageId: 1,
    content: [
      {
        type: 'heading',
        text: '4.2 Process Scheduling Algorithms'
      },
      {
        type: 'paragraph',
        text: 'The scheduler is responsible for deciding which process runs on the CPU at any given time. ',
        highlight: 'A good scheduling algorithm balances throughput, turnaround time, and fairness',
        textAfter: ' across all competing processes.'
      },
      {
        type: 'paragraph',
        text: 'First-Come, First-Served (FCFS) executes processes strictly in arrival order. While simple, ',
        highlight2: 'FCFS can cause the "convoy effect," where short processes wait behind one long process',
        textAfter: ', hurting average wait time significantly.'
      },
      {
        type: 'paragraph',
        text: 'Shortest Job First (SJF) instead selects the process with the smallest execution time next. This minimizes average waiting time but requires knowing burst times in advance, which is rarely possible in practice.'
      }
    ]
  },
  {
    pageId: 2,
    content: [
      {
        type: 'heading',
        text: '4.3 Round Robin Scheduling'
      },
      {
        type: 'paragraph',
        text: 'Round Robin assigns each process a fixed time quantum. ',
        highlight: 'If a process doesn\'t finish within its slice, it\'s moved to the back of the ready queue',
        textAfter: ', ensuring every process gets CPU time regularly.'
      },
      {
        type: 'paragraph',
        text: 'Choosing the time quantum is a tradeoff: too small increases context-switch overhead, while too large makes Round Robin behave like FCFS.'
      }
    ]
  }
];

export const tabLabels = {
  summary: 'Generated from 18 pages · Updated just now',
  notes: '4 note sections · Updated just now',
  keypoints: '5 key points identified · Updated just now',
  flashcards: '6 flashcards generated · Updated just now',
  topics: '4 important topics ranked by priority',
  chat: 'Grounded in your uploaded document'
};

export const summaryData = [
  {
    id: 1,
    title: "Overview",
    content: "This unit covers CPU scheduling — how an operating system decides which process runs next. It compares FCFS, SJF, and Round Robin, and explains the tradeoffs each algorithm makes between simplicity, fairness, and average wait time."
  },
  {
    id: 2,
    title: "FCFS and the convoy effect",
    content: "First-Come, First-Served is the simplest scheduler but suffers from the convoy effect: a single long process can force every process behind it to wait, dragging down average turnaround time even though the algorithm itself is fair in order."
  },
  {
    id: 3,
    title: "Shortest Job First",
    content: "SJF picks whichever process needs the least CPU time next, which provably minimizes average wait time — but it depends on knowing burst times ahead of time, which real systems can only estimate."
  },
  {
    id: 4,
    title: "Round Robin and time quantum",
    content: "Round Robin cycles through processes with a fixed time slice, guaranteeing responsiveness. The unit stresses that quantum size is a core design tradeoff — too short wastes time on switching, too long collapses back into FCFS-like behavior."
  }
];

export const notesData = [
  {
    title: "Process Scheduling — Core Definitions",
    items: [
      { bold: "Scheduler:", text: " the OS component choosing which process runs next on the CPU." },
      { bold: "Throughput:", text: " number of processes completed per unit time." },
      { bold: "Turnaround time:", text: " total time from process arrival to completion." }
    ]
  },
  {
    title: "FCFS (First-Come, First-Served)",
    items: [
      { text: "Non-preemptive; processes run strictly in arrival order." },
      { text: "Simple to implement with a single FIFO queue." },
      { text: "Weakness: convoy effect — short jobs stuck behind long ones." }
    ]
  },
  {
    title: "SJF (Shortest Job First)",
    items: [
      { text: "Selects the process with smallest next CPU burst." },
      { text: "Optimal for minimizing average waiting time." },
      { text: "Limitation: burst time must be predicted, not guaranteed." }
    ]
  },
  {
    title: "Round Robin",
    items: [
      { text: "Preemptive; each process gets a fixed time quantum." },
      { text: "Unfinished processes re-queue at the back." },
      { text: "Quantum size directly trades off overhead vs. responsiveness." }
    ]
  }
];

export const keyPointsData = [
  "A scheduling algorithm's quality is judged on throughput, turnaround time, and fairness — not just one metric alone.",
  "FCFS is fair in arrival order but not in outcome — the convoy effect can make average wait time much worse than it looks.",
  "SJF is mathematically optimal for average wait time, but it's rarely usable as-is because burst times aren't known in advance.",
  "Round Robin's time quantum is the single most important tuning parameter — it decides whether the system feels responsive or wastes time context-switching.",
  "There is no universally \"best\" scheduler — the right choice depends on whether the system prioritizes fairness, responsiveness, or raw throughput."
];

export const topicsData = [
  {
    title: "Convoy Effect",
    priority: "High priority",
    priorityClass: "badge-high",
    desc: "Frequently tested concept — understand cause and how Round Robin avoids it."
  },
  {
    title: "Time Quantum Tradeoffs",
    priority: "High priority",
    priorityClass: "badge-high",
    desc: "Core exam topic: explain effects of quantum too small vs. too large."
  },
  {
    title: "SJF Optimality Proof",
    priority: "Medium priority",
    priorityClass: "badge-med",
    desc: "Useful for theory-heavy exams; less common in applied questions."
  },
  {
    title: "FIFO Queue Implementation",
    priority: "Good to know",
    priorityClass: "badge-low",
    desc: "Background detail — rarely asked directly but supports other answers."
  }
];

export const flashcardsData = [
  { q: 'What causes the "convoy effect" in FCFS scheduling?', a: 'A long process at the front of the queue forces all shorter processes behind it to wait, increasing average wait time.' },
  { q: 'What metric does SJF provably minimize?', a: 'Average waiting time across all processes, assuming burst times are known in advance.' },
  { q: 'Why is SJF difficult to implement in practice?', a: 'It requires knowing each process\'s CPU burst time ahead of time, which real systems can only estimate.' },
  { q: 'What happens if the Round Robin quantum is too small?', a: 'Context-switch overhead increases significantly, wasting CPU time on switching rather than useful work.' },
  { q: 'What happens if the Round Robin quantum is too large?', a: 'Round Robin starts behaving like FCFS, losing its responsiveness benefits.' },
  { q: 'Is FCFS preemptive or non-preemptive?', a: 'Non-preemptive — once a process starts running, it keeps the CPU until it finishes.' }
];

export const chatMessages = [
  {
    sender: 'ai',
    text: "Hi! I've read through your document. Ask me anything about process scheduling and I'll answer using this material."
  },
  {
    sender: 'user',
    text: "Why is SJF hard to use in real operating systems?",
    initials: "AR"
  },
  {
    sender: 'ai',
    text: "Because SJF needs to know each process's exact CPU burst time before it runs — and in practice, the OS can only estimate that. Your notes mention this is why SJF stays mostly theoretical."
  }
];
