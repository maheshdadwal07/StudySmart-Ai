export const documentMeta = {
  title: "Operating Systems — Unit 4.pdf",
  pages: 18,
  size: "3.2 MB",
  status: "Ready to generate"
};

export const difficulties = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" }
];

export const questionTypes = [
  { id: "mcq", label: "MCQ", hasIcon: true },
  { id: "short", label: "Short Answer", hasIcon: false },
  { id: "long", label: "Long Answer", hasIcon: true },
  { id: "interview", label: "Interview Questions", hasIcon: false },
  { id: "coding", label: "Coding Questions", hasIcon: false },
  { id: "scenario", label: "Scenario Based", hasIcon: false },
  { id: "behavioral", label: "Behavioral", hasIcon: false }
];

export const questionCounts = [10, 20, 30, 50];

export const questions = [
  {
    id: "q1",
    type: "MCQ",
    difficulty: "Medium",
    text: 'Which scheduling algorithm is most likely to cause the "convoy effect"?',
    options: [
      { letter: "A", text: "First-Come, First-Served (FCFS)", isCorrect: true },
      { letter: "B", text: "Shortest Job First (SJF)", isCorrect: false },
      { letter: "C", text: "Round Robin", isCorrect: false },
      { letter: "D", text: "Priority Scheduling", isCorrect: false }
    ],
    explanation: "FCFS runs processes strictly in arrival order, so one long process at the front blocks every shorter process behind it — this is the convoy effect. Round Robin and priority scheduling both avoid it through preemption.",
    badgeTypeClass: "badge-type",
    badgeDiffClass: "badge-medium",
    isBookmarked: false
  },
  {
    id: "q2",
    type: "Long Answer",
    difficulty: "Medium",
    text: "Explain the tradeoff involved in choosing a time quantum for Round Robin scheduling.",
    explanationTitle: "Model answer",
    explanation: "A short quantum keeps the system responsive since every process gets CPU time quickly, but it increases overhead because the CPU spends more time context-switching between processes. A long quantum reduces switching overhead but makes Round Robin behave increasingly like FCFS, reintroducing poor response times for processes waiting behind long-running ones. The ideal quantum balances these two costs for the workload at hand.",
    badgeTypeClass: "badge-type",
    badgeDiffClass: "badge-medium",
    isBookmarked: false
  },
  {
    id: "q3",
    type: "Interview",
    difficulty: "Hard",
    text: "A production system's scheduler is causing some background jobs to starve. Walk me through how you'd diagnose and fix this.",
    explanationTitle: "Model answer",
    explanation: "I'd start by checking whether the scheduler uses strict priority without aging — that's the classic starvation cause, since higher-priority jobs can indefinitely delay lower-priority ones. I'd confirm with logs showing wait-time distribution per priority tier, then propose adding aging (gradually boosting priority the longer a job waits) or switching the affected queue to a fairer policy like Round Robin.",
    badgeTypeClass: "badge-type",
    badgeDiffClass: "badge-hard",
    isBookmarked: true
  },
  {
    id: "q4",
    type: "Coding",
    difficulty: "Hard",
    text: "Implement a function that simulates Round Robin scheduling and returns each process's completion time.",
    code: `function roundRobin(processes, quantum) {
  const queue = [...processes.map(p => ({...p, remaining: p.burst}))];
  let time = 0, completion = {};
  while (queue.length) {
    const p = queue.shift();
    const run = Math.min(quantum, p.remaining);
    time += run; p.remaining -= run;
    if (p.remaining > 0) queue.push(p);
    else completion[p.id] = time;
  }
  return completion;
}`,
    explanationTitle: "Explanation",
    explanation: "This walks through the queue in FIFO order, giving each process up to `quantum` units of runtime. If a process still has remaining burst time, it's pushed to the back of the queue, matching the behavior described in the source document.",
    badgeTypeClass: "badge-type",
    badgeDiffClass: "badge-hard",
    isBookmarked: false
  }
];
