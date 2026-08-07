"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

type Tab = "mistakes" | "cards";

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
  const [tab, setTab] = useState<Tab>("mistakes");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentCard = knowledgeCards[cardIndex];

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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "网络异常，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    setFlipped(false);
    window.setTimeout(() => setCardIndex((value) => (value + 1) % knowledgeCards.length), 180);
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
          {tab === "mistakes" ? (
            <section className="animate-in">
              <div className="mb-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"><Icon name="fire" className="h-3.5 w-3.5" /> 错一道，会一类</span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">错题消化器</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">把卡住你的题目或解题思路写下来，马上生成广东省考同类变式。</p>
              </div>

              <form onSubmit={generate} className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={2000}
                  placeholder="例如：数量关系里牛吃草问题总是分不清新增量和消耗量……"
                  className="h-40 w-full resize-none rounded-2xl bg-slate-50 p-4 text-[15px] leading-6 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex items-center justify-between px-1 pb-1 pt-3">
                  <span className="text-xs text-slate-400">{input.length}/2000</span>
                  <button type="submit" disabled={!input.trim() || loading} className="flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                    {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="spark" className="h-4 w-4" />}
                    {loading ? "正在出题…" : "生成广东变式题"}
                  </button>
                </div>
              </form>

              {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              {result && (
                <div className="mt-5 space-y-3 animate-in">
                  <div className="rounded-3xl bg-[#123c32] p-5 text-white shadow-xl shadow-emerald-950/10">
                    <p className="text-xs font-semibold tracking-wider text-emerald-300">该题在广东省考中的考频</p>
                    <p className="mt-2 text-lg font-bold">{result.frequency}</p>
                    <div className="my-4 h-px bg-white/10" />
                    <p className="text-xs font-semibold tracking-wider text-emerald-300">核心秒杀技巧</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/90">{result.skill}</p>
                  </div>
                  {result.questions.map((question) => (
                    <article key={question.title} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-bold text-emerald-700">{question.title}</p>
                      <p className="mt-2 text-[15px] font-medium leading-6">{question.text}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {question.options.map((option) => <button type="button" key={option} className="rounded-xl bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-emerald-50 active:scale-[0.98]">{option}</button>)}
                      </div>
                      <details className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm">
                        <summary className="cursor-pointer font-semibold text-emerald-700">查看答案与解析</summary>
                        <p className="mt-2 font-bold text-slate-800">答案：{question.answer}</p>
                        <p className="mt-1 leading-6 text-slate-600">{question.explanation}</p>
                      </details>
                    </article>
                  ))}
                </div>
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

              <button type="button" onClick={() => setFlipped((value) => !value)} className="perspective block h-[450px] w-full text-left focus:outline-none" aria-label="点击翻转卡片">
                <div className={`card-inner relative h-full w-full ${flipped ? "is-flipped" : ""}`}>
                  <article className="card-face absolute inset-0 flex flex-col overflow-hidden rounded-[32px] bg-[#123c32] p-6 text-white shadow-[0_24px_50px_rgba(18,60,50,0.22)]">
                    <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full border-[36px] border-white/[0.04]" />
                    <div className="relative flex items-center justify-between">
                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">{currentCard.category}</span>
                      <span className="text-xs text-white/50">点击翻面</span>
                    </div>
                    <p className="relative mt-8 text-xl font-bold leading-8">{currentCard.question}</p>
                    <div className="relative mt-6 space-y-2.5">
                      {currentCard.options.map((option, index) => <div key={option} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-5 text-white/90"><span className="mr-2 font-bold text-emerald-300">{String.fromCharCode(65 + index)}.</span>{option}</div>)}
                    </div>
                    <div className="relative mt-auto flex items-center justify-center gap-2 text-xs text-white/45"><span className="h-px w-8 bg-white/20" /> 先思考，再翻面 <span className="h-px w-8 bg-white/20" /></div>
                  </article>

                  <article className="card-face card-back absolute inset-0 flex flex-col rounded-[32px] border border-emerald-100 bg-[#effbf5] p-6 shadow-[0_24px_50px_rgba(18,60,50,0.16)]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><Icon name="check" className="h-4 w-4" /> 答案与解析</span>
                      <span className="text-xs text-slate-400">点击翻回</span>
                    </div>
                    <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-4xl font-black text-white shadow-lg shadow-emerald-600/20">{currentCard.answer}</div>
                    <h3 className="mt-7 text-lg font-bold">答案解析</h3>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{currentCard.explanation}</p>
                    <div className="mt-auto rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-500"><span className="font-bold text-emerald-700">记忆提示：</span> 抓住题目中的政策定位、核心城市或关键物理过程，排除表述绝对、方向相反的选项。</div>
                  </article>
                </div>
              </button>

              <button type="button" onClick={nextCard} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]">下一个 <Icon name="arrow" className="h-4 w-4" /></button>
            </section>
          )}
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-slate-200/70 bg-white/90 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-3">
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
