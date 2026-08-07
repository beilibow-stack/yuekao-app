"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type Tab = "today" | "mistakes" | "cards";

type KnowledgeCard = {
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type GeneratedResult = {
  frequency: string;
  skill: string;
  questions: Array<{
    title: string;
    text: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
};

type ReviewItem = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  source: string;
  stage: 0 | 1 | 2;
  dueAt: number;
  createdAt: number;
};

type PracticeStep = "brief" | "question" | "summary";

type DailyTask = {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  reviewId?: string;
};

type DailyProgress = {
  date: string;
  tasks: DailyTask[];
  index: number;
  answers: string[];
  choice: string;
  answered: boolean;
};

const REVIEW_KEY = "yuekao-review-v1";
const DAILY_KEY = "yuekao-daily-v1";
const DAY = 24 * 60 * 60 * 1000;
const REVIEW_INTERVALS = [1, 3, 7] as const;

const knowledgeCards: KnowledgeCard[] = [
  {
    category: "“百千万工程”",
    question: "广东省实施“百县千镇万村高质量发展工程”，其核心着力点是什么？",
    options: [
      "推动县域经济与城乡区域协调发展",
      "全面扩大城市行政区划",
      "集中发展珠三角核心城市",
      "减少县镇公共服务投入",
    ],
    answer: "A",
    explanation:
      "“百千万工程”以县域为重要切入点，突出县镇村联动，着力破解城乡区域发展不平衡问题，推动县域高质量发展。",
  },
  {
    category: "粤港澳大湾区",
    question: "粤港澳大湾区建设的四个中心城市是下列哪一组？",
    options: [
      "广州、深圳、珠海、佛山",
      "香港、澳门、广州、深圳",
      "香港、广州、深圳、东莞",
      "澳门、珠海、广州、佛山",
    ],
    answer: "B",
    explanation:
      "《粤港澳大湾区发展规划纲要》明确香港、澳门、广州、深圳为区域发展的核心引擎，发挥中心城市带动作用。",
  },
  {
    category: "科学推理",
    question: "夏天打开冰箱门，看到门口出现“白气”。这些白气主要是怎样形成的？",
    options: [
      "冰箱内的水蒸气汽化",
      "空气中的水蒸气液化",
      "冰箱内的水蒸气凝华",
      "空气中的水滴升华",
    ],
    answer: "B",
    explanation:
      "冰箱外温度较高的水蒸气遇到冷空气后液化成细小水滴，悬浮在空气中形成肉眼可见的“白气”。",
  },
  {
    category: "广东地理",
    question: "广东省最长的河流，也是珠江水系最大干流的是？",
    options: ["东江", "北江", "西江", "韩江"],
    answer: "C",
    explanation:
      "西江是珠江水系中流量、长度和流域面积最大的干流，是连接粤港澳大湾区与西南地区的重要水运通道。",
  },
  {
    category: "广东历史文化",
    question: "下列世界文化遗产中，位于广东省的是？",
    options: ["福建土楼", "开平碉楼与村落", "皖南古村落", "平遥古城"],
    answer: "B",
    explanation:
      "开平碉楼与村落位于广东江门开平市，集中体现了中国乡村建筑主动吸收外来文化的历史，于 2007 年列入《世界遗产名录》。",
  },
];

const abilityQuestions: DailyTask[] = [
  {
    id: "ability-logic-1",
    category: "判断推理 · 削弱",
    question: "某市上线错峰预约系统后，窗口平均排队时间下降。负责人据此认为，该系统有效缓解了办事拥堵。以下哪项最能削弱这一结论？",
    options: [
      "A. 上线同期，多个高频事项改为全程网上办理",
      "B. 大多数群众认为预约页面操作简单",
      "C. 该系统的开发成本低于原计划",
      "D. 部分窗口工作人员接受了操作培训",
    ],
    answer: "A",
    explanation: "题干用‘上线系统’解释‘排队下降’。A 项给出同期发生的另一关键原因，说明排队下降未必由预约系统造成，属于典型的另有他因。",
  },
  {
    id: "ability-number-1",
    category: "数量关系 · 工程问题",
    question: "甲单独完成一项工程需 12 天，乙单独完成需 18 天。两人合作 4 天后，剩余工程由甲单独完成，还需多少天？",
    options: ["A. 4 天", "B. 5 又 1/3 天", "C. 6 天", "D. 8 天"],
    answer: "B",
    explanation: "设总量为 36，甲、乙效率分别为 3 和 2。合作 4 天完成 20，剩余 16，甲单独需 16÷3=5 又 1/3 天。工程问题优先用最小公倍数设总量。",
  },
  {
    id: "ability-language-1",
    category: "言语理解 · 逻辑填空",
    question: "基层治理不能只靠临时性的集中整治，更要建立常态长效机制，避免问题反复出现、治理成效______。填入最恰当的一项是？",
    options: ["A. 功亏一篑", "B. 昙花一现", "C. 差强人意", "D. 一蹴而就"],
    answer: "B",
    explanation: "前文强调‘临时’与‘长效’的对立，空格对应成效持续时间短。‘昙花一现’最贴合；‘功亏一篑’强调最后关头失败。",
  },
];

const fallbackReview: DailyTask = {
  id: "review-fallback",
  category: "易错回顾 · 科学推理",
  question: "同一实心物体分别放入水和盐水中，均漂浮。关于两次所受浮力和排开液体体积，下列说法正确的是？",
  options: ["A. 浮力相同，盐水中排开体积更小", "B. 浮力相同，盐水中排开体积更大", "C. 水中浮力更大", "D. 盐水中浮力更大"],
  answer: "A",
  explanation: "漂浮时浮力等于物体重力，因此两次浮力相同；由 F浮=ρ液gV排，盐水密度更大，所以排开体积更小。",
};

function localDateKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function seedFromDate(date: string) {
  return Number(date.replaceAll("-", "")) || 0;
}

function createDailyTasks(date: string, reviews: ReviewItem[]): DailyTask[] {
  const seed = seedFromDate(date);
  const due = reviews.find((item) => item.dueAt <= Date.now());
  const reviewTask: DailyTask = due
    ? {
        id: `review-${due.id}`,
        category: `到期错题 · ${due.source}`,
        question: due.question,
        options: due.options,
        answer: due.answer,
        explanation: due.explanation,
        reviewId: due.id,
      }
    : fallbackReview;
  const ability = abilityQuestions[seed % abilityQuestions.length];
  const knowledge = knowledgeCards[seed % knowledgeCards.length];
  return [
    reviewTask,
    ability,
    {
      id: `knowledge-${seed % knowledgeCards.length}`,
      category: `广东常识 · ${knowledge.category}`,
      question: knowledge.question,
      options: knowledge.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`),
      answer: knowledge.answer,
      explanation: knowledge.explanation,
    },
  ];
}

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    pen: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
    cards: <><rect width="14" height="18" x="5" y="3" rx="2"/><path d="m9 8 3-2 3 2v5l-3 2-3-2Z"/></>,
    spark: <><path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2Z"/><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8Z"/><path d="m18 14-.7 1.8-1.8.7 1.8.7L18 19l.7-1.8 1.8-.7-1.8-.7Z"/></>,
    fire: <path d="M12 2s3 3.4 3 7a3 3 0 0 1-6 0c0-1 .3-2 .8-3C7 8.2 5 10.8 5 14a7 7 0 0 0 14 0c0-5-3-9-7-12Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("today");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState("");
  const [practiceStep, setPracticeStep] = useState<PracticeStep>("brief");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState("");
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewLoaded, setReviewLoaded] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewChoice, setReviewChoice] = useState("");
  const [reviewAnswered, setReviewAnswered] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cardChoice, setCardChoice] = useState("");
  const [cardAnswered, setCardAnswered] = useState(false);
  const [todayKey, setTodayKey] = useState("");
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [dailyIndex, setDailyIndex] = useState(0);
  const [dailyChoice, setDailyChoice] = useState("");
  const [dailyAnswered, setDailyAnswered] = useState(false);
  const [dailyAnswers, setDailyAnswers] = useState<string[]>([]);
  const [dailyReady, setDailyReady] = useState(false);

  const currentCard = knowledgeCards[cardIndex];
  const dueReviews = useMemo(
    () => reviewItems.filter((item) => item.dueAt <= Date.now()),
    [reviewItems],
  );
  const activeReview = dueReviews[0];

  useEffect(() => {
    setTodayKey(localDateKey());
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(REVIEW_KEY);
      if (stored) setReviewItems(JSON.parse(stored) as ReviewItem[]);
    } catch {
      // 本地记录损坏时从空错题本继续，不影响主流程。
    } finally {
      setReviewLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!reviewLoaded) return;
    window.localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewItems));
  }, [reviewItems, reviewLoaded]);

  useEffect(() => {
    if (!todayKey || !reviewLoaded || dailyReady) return;
    try {
      const stored = window.localStorage.getItem(DAILY_KEY);
      if (stored) {
        const progress = JSON.parse(stored) as DailyProgress;
        if (progress.date === todayKey && progress.tasks?.length === 3) {
          setDailyTasks(progress.tasks);
          setDailyIndex(progress.index);
          setDailyAnswers(progress.answers ?? []);
          setDailyChoice(progress.choice ?? "");
          setDailyAnswered(Boolean(progress.answered));
          setDailyReady(true);
          return;
        }
      }
    } catch {
      // 当日进度异常时重新生成，不影响错题本。
    }
    setDailyTasks(createDailyTasks(todayKey, reviewItems));
    setDailyReady(true);
  }, [dailyReady, reviewItems, reviewLoaded, todayKey]);

  useEffect(() => {
    if (!dailyReady || !todayKey || dailyTasks.length !== 3) return;
    const progress: DailyProgress = {
      date: todayKey,
      tasks: dailyTasks,
      index: dailyIndex,
      answers: dailyAnswers,
      choice: dailyChoice,
      answered: dailyAnswered,
    };
    window.localStorage.setItem(DAILY_KEY, JSON.stringify(progress));
  }, [dailyAnswered, dailyAnswers, dailyChoice, dailyIndex, dailyReady, dailyTasks, todayKey]);

  function scheduleReview(
    question: { text: string; options: string[]; answer: string; explanation: string },
    source: string,
  ) {
    const now = Date.now();
    setReviewItems((items) => {
      const existing = items.find((item) => item.question === question.text);
      const next: ReviewItem = {
        id: existing?.id ?? `${now}-${Math.random().toString(36).slice(2, 8)}`,
        question: question.text,
        options: question.options,
        answer: question.answer,
        explanation: question.explanation,
        source,
        stage: 0,
        dueAt: now + REVIEW_INTERVALS[0] * DAY,
        createdAt: existing?.createdAt ?? now,
      };
      return existing
        ? items.map((item) => (item.id === existing.id ? next : item))
        : [next, ...items];
    });
  }

  function updateReviewResult(reviewId: string, correct: boolean) {
    setReviewItems((items) =>
      items.flatMap((item): ReviewItem[] => {
        if (item.id !== reviewId) return [item];
        if (!correct) return [{ ...item, stage: 0, dueAt: Date.now() + DAY }];
        if (item.stage === 2) return [];
        const nextStage = (item.stage + 1) as 1 | 2;
        return [{
          ...item,
          stage: nextStage,
          dueAt: Date.now() + REVIEW_INTERVALS[nextStage] * DAY,
        }];
      }),
    );
  }

  function submitDailyAnswer() {
    const task = dailyTasks[dailyIndex];
    if (!task || !dailyChoice || dailyAnswered) return;
    const correct = dailyChoice === task.answer;
    setDailyAnswered(true);
    setDailyAnswers((values) => {
      const next = [...values];
      next[dailyIndex] = dailyChoice;
      return next;
    });
    if (task.reviewId) {
      updateReviewResult(task.reviewId, correct);
    } else if (!correct) {
      scheduleReview(
        {
          text: task.question,
          options: task.options,
          answer: task.answer,
          explanation: task.explanation,
        },
        task.category,
      );
    }
  }

  function nextDailyQuestion() {
    if (!dailyAnswered) return;
    setDailyIndex((value) => value + 1);
    setDailyChoice("");
    setDailyAnswered(false);
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败，请稍后重试。");
      setResult(data as GeneratedResult);
      setPracticeStep("brief");
      setQuestionIndex(0);
      setChoice("");
      setAnswered(false);
      setAnswers([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    setFlipped(false);
    setCardChoice("");
    setCardAnswered(false);
    window.setTimeout(() => setCardIndex((value) => (value + 1) % knowledgeCards.length), 180);
  }

  function submitGeneratedAnswer() {
    if (!result || !choice || answered) return;
    const question = result.questions[questionIndex];
    setAnswered(true);
    setAnswers((values) => {
      const next = [...values];
      next[questionIndex] = choice;
      return next;
    });
    if (choice !== question.answer) scheduleReview(question, "AI 变式题");
  }

  function nextGeneratedQuestion() {
    if (!result) return;
    if (questionIndex < result.questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setChoice("");
      setAnswered(false);
    } else {
      setPracticeStep("summary");
    }
  }

  function submitCardAnswer() {
    if (!cardChoice || cardAnswered) return;
    setCardAnswered(true);
    setFlipped(true);
    if (cardChoice !== currentCard.answer) {
      scheduleReview(
        {
          text: currentCard.question,
          options: currentCard.options.map(
            (option, index) => `${String.fromCharCode(65 + index)}. ${option}`,
          ),
          answer: currentCard.answer,
          explanation: currentCard.explanation,
        },
        currentCard.category,
      );
    }
  }

  function finishReviewItem() {
    if (!activeReview || !reviewAnswered) return;
    const correct = reviewChoice === activeReview.answer;
    updateReviewResult(activeReview.id, correct);
    setReviewedCount((value) => value + 1);
    setReviewChoice("");
    setReviewAnswered(false);
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5f7f6] text-slate-900 selection:bg-emerald-100">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-[#f8faf9] shadow-[0_0_50px_rgba(15,23,42,0.08)]">
        <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#f8faf9]/90 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-emerald-700">GUANGDONG EXAM</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight">粤考上岸计划</h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg">🌱</div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden px-5 pb-28 pt-5">
          {tab === "today" ? (
            <section className="animate-in">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">今天只做 3 题</span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight">今日上岸训练</h2>
                  <p className="mt-1.5 text-sm text-slate-500">复习一题，补弱一题，广东常识一题。</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                  <p className="text-lg font-black text-emerald-700">5</p>
                  <p className="text-[10px] text-slate-400">分钟</p>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">今日进度</span>
                  <span className="font-semibold text-emerald-700">{Math.min(dailyIndex, 3)} / 3</span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(Math.min(dailyIndex, 3) / 3) * 100}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-400">
                  {['错题复习', '能力补弱', '广东常识'].map((label, index) => (
                    <span key={label} className={index < dailyIndex ? "text-emerald-600" : index === dailyIndex ? "text-slate-700" : ""}>{index < dailyIndex ? "✓ " : ""}{label}</span>
                  ))}
                </div>
              </div>

              {!dailyReady ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-5 h-6 w-full animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-slate-100" />
                </div>
              ) : dailyIndex >= dailyTasks.length ? (
                <div className="overflow-hidden rounded-[30px] bg-[#123c32] p-7 text-white shadow-xl shadow-emerald-950/15">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/20 text-3xl">🎯</div>
                  <p className="mt-5 text-xs font-bold tracking-widest text-emerald-300">TODAY COMPLETED</p>
                  <h3 className="mt-2 text-2xl font-black">今天的 3 题完成了</h3>
                  <div className="mt-5 flex items-end gap-2"><span className="text-5xl font-black">{dailyAnswers.filter((value, index) => value === dailyTasks[index]?.answer).length}</span><span className="pb-1 text-emerald-100/60">/ 3 正确</span></div>
                  <p className="mt-4 text-sm leading-6 text-emerald-50/75">答错的题已经自动放进 1 / 3 / 7 天复习队列。今天到这里就够了，保持每天都来。</p>
                  <button type="button" onClick={() => setTab("mistakes")} className="mt-6 w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-emerald-800">还有时间，消化一道错题</button>
                </div>
              ) : (() => {
                const task = dailyTasks[dailyIndex];
                return (
                  <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{task.category}</span>
                      <span className="text-xs font-semibold text-slate-400">第 {dailyIndex + 1} 题</span>
                    </div>
                    <p className="mt-5 text-[16px] font-bold leading-7">{task.question}</p>
                    <div className="mt-5 space-y-2.5">
                      {task.options.map((option, index) => {
                        const letter = option.match(/^[A-D]/)?.[0] ?? String.fromCharCode(65 + index);
                        const correct = dailyAnswered && letter === task.answer;
                        const wrong = dailyAnswered && letter === dailyChoice && letter !== task.answer;
                        return (
                          <button key={option} type="button" disabled={dailyAnswered} onClick={() => setDailyChoice(letter)} className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm font-medium leading-5 transition active:scale-[0.99] ${correct ? "border-emerald-500 bg-emerald-50 text-emerald-800" : wrong ? "border-red-400 bg-red-50 text-red-700" : dailyChoice === letter ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {!dailyAnswered ? (
                      <button type="button" disabled={!dailyChoice} onClick={submitDailyAnswer} className="mt-5 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 disabled:bg-slate-300 disabled:shadow-none">提交答案</button>
                    ) : (
                      <div className="mt-5 animate-in">
                        <div className={`rounded-2xl p-4 ${dailyChoice === task.answer ? "bg-emerald-50" : "bg-red-50"}`}>
                          <p className={`font-bold ${dailyChoice === task.answer ? "text-emerald-800" : "text-red-700"}`}>{dailyChoice === task.answer ? "答对了 · 思路稳住" : `答错了 · 正确答案 ${task.answer}`}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{task.explanation}</p>
                        </div>
                        <button type="button" onClick={nextDailyQuestion} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white">{dailyIndex === 2 ? "查看今日结果" : "下一题"} <Icon name="arrow" className="h-4 w-4" /></button>
                      </div>
                    )}
                  </article>
                );
              })()}
            </section>
          ) : tab === "mistakes" ? (
            <section className="animate-in">
              <div className="mb-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"><Icon name="fire" className="h-3.5 w-3.5" /> 错一道，会一类</span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">错题消化器</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">把卡住你的题目或解题思路写下来，马上生成广东省考同类变式。</p>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                <div>
                  <p className="text-xs font-bold text-emerald-700">🧠 1 / 3 / 7 天记忆复习</p>
                  <p className="mt-1 text-xs text-slate-500">错题本 {reviewItems.length} 题 · 今日待复习 {dueReviews.length} 题</p>
                </div>
                <button
                  type="button"
                  disabled={!dueReviews.length}
                  onClick={() => { setReviewMode(true); setReviewedCount(0); }}
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white disabled:bg-emerald-200"
                >
                  开始复习
                </button>
              </div>

              {reviewMode ? (
                <div className="animate-in">
                  {activeReview ? (
                    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">到期复习</span>
                        <span className="text-xs text-slate-400">第 {reviewedCount + 1} 条</span>
                      </div>
                      <p className="mt-4 text-base font-bold leading-7">{activeReview.question}</p>
                      <div className="mt-5 space-y-2.5">
                        {activeReview.options.map((option, index) => {
                          const letter = option.match(/^[A-D]/)?.[0] ?? String.fromCharCode(65 + index);
                          const correct = reviewAnswered && letter === activeReview.answer;
                          const wrong = reviewAnswered && letter === reviewChoice && letter !== activeReview.answer;
                          return (
                            <button key={option} type="button" disabled={reviewAnswered} onClick={() => setReviewChoice(letter)} className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${correct ? "border-emerald-500 bg-emerald-50 text-emerald-800" : wrong ? "border-red-400 bg-red-50 text-red-700" : reviewChoice === letter ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {!reviewAnswered ? (
                        <button type="button" disabled={!reviewChoice} onClick={() => setReviewAnswered(true)} className="mt-5 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white disabled:bg-slate-300">提交答案</button>
                      ) : (
                        <div className="mt-5 animate-in">
                          <div className={`rounded-2xl p-4 ${reviewChoice === activeReview.answer ? "bg-emerald-50" : "bg-red-50"}`}>
                            <p className="font-bold">{reviewChoice === activeReview.answer ? "答对了，记忆正在加固" : `答错了，正确答案是 ${activeReview.answer}`}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{activeReview.explanation}</p>
                          </div>
                          <button type="button" onClick={finishReviewItem} className="mt-3 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white">下一条</button>
                        </div>
                      )}
                    </article>
                  ) : (
                    <div className="rounded-[28px] bg-[#123c32] p-7 text-center text-white">
                      <div className="text-4xl">✅</div>
                      <h3 className="mt-3 text-xl font-bold">今日复习完成</h3>
                      <p className="mt-2 text-sm text-emerald-100/70">已处理 {reviewedCount} 道，系统会按 1 / 3 / 7 天再次安排。</p>
                      <button type="button" onClick={() => setReviewMode(false)} className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-800">返回错题消化</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!result && (
                    <form onSubmit={generate} className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                      <textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="例如：数量关系里牛吃草问题总是分不清新增量和消耗量……" className="h-40 w-full resize-none rounded-2xl bg-slate-50 p-4 text-[15px] leading-6 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20" />
                      <div className="flex items-center justify-between px-1 pb-1 pt-3">
                        <span className="text-xs text-slate-400">{input.length}/2000</span>
                        <button type="submit" disabled={!input.trim() || loading} className="flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="spark" className="h-4 w-4" />}
                          {loading ? "正在出题…" : "生成广东变式题"}
                        </button>
                      </div>
                    </form>
                  )}

                  {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                  {result && practiceStep === "brief" && (
                    <div className="animate-in">
                      <div className="rounded-3xl bg-[#123c32] p-5 text-white shadow-xl shadow-emerald-950/10">
                        <p className="text-xs font-semibold tracking-wider text-emerald-300">该题在广东省考中的考频</p>
                        <p className="mt-2 text-lg font-bold">{result.frequency}</p>
                        <div className="my-4 h-px bg-white/10" />
                        <p className="text-xs font-semibold tracking-wider text-emerald-300">考前 20 秒 · 核心秒杀技巧</p>
                        <p className="mt-2 text-sm leading-6 text-emerald-50/90">{result.skill}</p>
                      </div>
                      <button type="button" onClick={() => setPracticeStep("question")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20">开始 2 题迁移训练 <Icon name="arrow" className="h-4 w-4" /></button>
                    </div>
                  )}

                  {result && practiceStep === "question" && (() => {
                    const question = result.questions[questionIndex];
                    return (
                      <article className="animate-in rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700">迁移训练 {questionIndex + 1} / {result.questions.length}</span>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${((questionIndex + 1) / result.questions.length) * 100}%` }} /></div>
                        </div>
                        <p className="mt-4 text-base font-bold leading-7">{question.text}</p>
                        <div className="mt-5 space-y-2.5">
                          {question.options.map((option, index) => {
                            const letter = option.match(/^[A-D]/)?.[0] ?? String.fromCharCode(65 + index);
                            const correct = answered && letter === question.answer;
                            const wrong = answered && letter === choice && letter !== question.answer;
                            return <button key={option} type="button" disabled={answered} onClick={() => setChoice(letter)} className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition active:scale-[0.99] ${correct ? "border-emerald-500 bg-emerald-50 text-emerald-800" : wrong ? "border-red-400 bg-red-50 text-red-700" : choice === letter ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{option}</button>;
                          })}
                        </div>
                        {!answered ? (
                          <button type="button" disabled={!choice} onClick={submitGeneratedAnswer} className="mt-5 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white disabled:bg-slate-300">提交答案</button>
                        ) : (
                          <div className="mt-5 animate-in">
                            <div className={`rounded-2xl p-4 ${choice === question.answer ? "bg-emerald-50" : "bg-red-50"}`}>
                              <p className="font-bold">{choice === question.answer ? "回答正确" : `回答错误 · 正确答案 ${question.answer}`}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{question.explanation}</p>
                            </div>
                            <button type="button" onClick={() => scheduleReview(question, "AI 变式题")} className="mt-3 w-full rounded-2xl border border-amber-200 bg-amber-50 py-3 text-xs font-bold text-amber-800">还模糊，加入 1 / 3 / 7 天复习</button>
                            <button type="button" onClick={nextGeneratedQuestion} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white">{questionIndex === result.questions.length - 1 ? "查看练习总结" : "下一题"} <Icon name="arrow" className="h-4 w-4" /></button>
                          </div>
                        )}
                      </article>
                    );
                  })()}

                  {result && practiceStep === "summary" && (
                    <div className="animate-in rounded-[28px] bg-[#123c32] p-6 text-white shadow-xl">
                      <p className="text-xs font-bold text-emerald-300">本轮练习完成</p>
                      <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-black">{answers.filter((value, index) => value === result.questions[index].answer).length}</span><span className="pb-1 text-emerald-100/60">/ {result.questions.length} 正确</span></div>
                      <p className="mt-4 text-sm leading-6 text-emerald-50/80">做错或标记“还模糊”的题已进入错题本，明天开始按 1 / 3 / 7 天节奏复现。</p>
                      <button type="button" onClick={() => { setResult(null); setInput(""); setError(""); }} className="mt-5 w-full rounded-2xl bg-white py-3.5 text-sm font-bold text-emerald-800">消化下一道错题</button>
                    </div>
                  )}
                </>
              )}
            </section>
          ) : (
            <section className="animate-in">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">每日 5 分钟</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">广东常识抽卡</h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">{cardIndex + 1} / {knowledgeCards.length}</span>
              </div>

              <div className="perspective block h-[500px] w-full text-left">
                <div className={`card-inner relative h-full w-full ${flipped ? "is-flipped" : ""}`}>
                  <article className="card-face absolute inset-0 flex flex-col overflow-hidden rounded-[32px] bg-[#123c32] p-6 text-white shadow-[0_24px_50px_rgba(18,60,50,0.22)]">
                    <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full border-[36px] border-white/[0.04]" />
                    <div className="relative flex items-center justify-between">
                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">{currentCard.category}</span>
                      <span className="text-xs text-white/50">先选，再看解析</span>
                    </div>
                    <p className="relative mt-6 text-lg font-bold leading-7">{currentCard.question}</p>
                    <div className="relative mt-5 space-y-2.5">
                      {currentCard.options.map((option, index) => {
                        const letter = String.fromCharCode(65 + index);
                        return <button key={option} type="button" onClick={() => setCardChoice(letter)} className={`w-full rounded-2xl border px-4 py-3 text-left text-sm leading-5 transition ${cardChoice === letter ? "border-emerald-300 bg-emerald-300/15 text-white" : "border-white/10 bg-white/[0.06] text-white/90"}`}><span className="mr-2 font-bold text-emerald-300">{letter}.</span>{option}</button>;
                      })}
                    </div>
                    <button type="button" disabled={!cardChoice} onClick={submitCardAnswer} className="relative mt-auto w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white disabled:bg-white/10 disabled:text-white/30">提交答案</button>
                  </article>

                  <article className="card-face card-back absolute inset-0 flex flex-col rounded-[32px] border border-emerald-100 bg-[#effbf5] p-6 shadow-[0_24px_50px_rgba(18,60,50,0.16)]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Icon name="check" className="h-4 w-4" /> 答案与解析</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cardChoice === currentCard.answer ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{cardChoice === currentCard.answer ? "回答正确" : "已加入错题本"}</span>
                    </div>
                    <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-3xl font-black text-white shadow-lg shadow-emerald-600/20">{currentCard.answer}</div>
                    <h3 className="mt-5 text-lg font-bold">答案解析</h3>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{currentCard.explanation}</p>
                    <div className="mt-auto rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-500"><span className="font-bold text-emerald-700">记忆提示：</span> 抓住题目中的政策定位、核心城市或关键物理过程，排除表述绝对、方向相反的选项。</div>
                  </article>
                </div>
              </div>

              <button type="button" onClick={nextCard} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]">下一个 <Icon name="arrow" className="h-4 w-4" /></button>
            </section>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-slate-200/70 bg-white/90 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setTab("today")} className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${tab === "today" ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}><Icon name="check" />今日训练</button>
            <button onClick={() => setTab("mistakes")} className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${tab === "mistakes" ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}><Icon name="pen" />错题消化</button>
            <button onClick={() => setTab("cards")} className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition ${tab === "cards" ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}><Icon name="cards" />每日抽卡</button>
          </div>
        </nav>
      </div>

      <style jsx>{`
        .perspective { perspective: 1200px; }
        .card-inner { transform-style: preserve-3d; transition: transform 0.55s cubic-bezier(.2,.8,.2,1); }
        .card-inner.is-flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .card-back { transform: rotateY(180deg); }
        .animate-in { animation: enter .35s ease-out both; }
        @keyframes enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .card-inner, .animate-in { transition: none; animation: none; } }
      `}</style>
    </main>
  );
}
