import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `
你是一位长期教授“广东省公务员录用考试·行政职业能力测验”的一线名师。

你的教学风格：
1. 像经验丰富的广东省考行测老师：专业、直接、接地气，但不油腻，不喊口号。
2. 先判断考点和广东省考常见命题方式，再给最短解题路径；少讲泛泛理论。
3. 善用“题眼、排坑、秒杀、代入、赋值、极端情况”等考场语言，但每个结论必须可验证。
4. 明确区分“高频/中频/低频”和适用题型。无法仅凭题干确认真实历年频次时，必须写“基于题型特征的教学判断”，不得捏造年份、真题编号或统计数字。
5. 变式题必须完全原创，贴近广东省考行测的题干长度、难度和四选一格式；两题不能只是替换数字。
6. 解析要让考生能在 60—90 秒内复现方法，先给快解，再说明为什么。
7. 全程使用简体中文。不要声称自己是真实名师或命题组成员。

你必须只返回一个合法 JSON 对象，不要 Markdown、代码围栏或额外说明。结构严格如下：
{
  "frequency": "考频等级 + 一句话依据",
  "skill": "核心秒杀技巧，80—160字",
  "questions": [
    {
      "title": "变式练习 01",
      "text": "完整题干",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A/B/C/D",
      "explanation": "快解步骤与排坑提醒，80—180字"
    },
    {
      "title": "变式练习 02",
      "text": "完整题干",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A/B/C/D",
      "explanation": "快解步骤与排坑提醒，80—180字"
    }
  ]
}
`.trim();

type GeneratedQuestion = {
  title: string;
  text: string;
  options: string[];
  answer: string;
  explanation: string;
};

type GeneratedResult = {
  frequency: string;
  skill: string;
  questions: GeneratedQuestion[];
};

function isGeneratedResult(value: unknown): value is GeneratedResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<GeneratedResult>;
  return Boolean(
    typeof result.frequency === "string" &&
      typeof result.skill === "string" &&
      Array.isArray(result.questions) &&
      result.questions.length === 2 &&
      result.questions.every(
        (question) =>
          typeof question?.title === "string" &&
          typeof question.text === "string" &&
          Array.isArray(question.options) &&
          question.options.length === 4 &&
          question.options.every((option) => typeof option === "string") &&
          /^[A-D]$/.test(question.answer) &&
          typeof question.explanation === "string",
      ),
  );
}

function parseModelJson(content: string): unknown {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: unknown };
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (question.length < 5 || question.length > 2000) {
      return NextResponse.json(
        { error: "请输入 5—2000 字的错题题干或解题困惑。" },
        { status: 400 },
      );
    }

    const apiKey = process.env.LLM_API_KEY;
    const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.LLM_MODEL ?? "gpt-5.6-luna";
    const isOpenAI = new URL(baseUrl).hostname === "api.openai.com";

    if (!apiKey) {
      return NextResponse.json(
        { error: "服务端尚未配置 LLM_API_KEY。" },
        { status: 500 },
      );
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `请分析下面这道错题或学习困惑，并按规定生成两道原创变式题：\n\n${question}`,
          },
        ],
        response_format: { type: "json_object" },
        ...(isOpenAI ? { max_completion_tokens: 1800 } : { max_tokens: 1800 }),
      }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("LLM upstream error", upstream.status, detail.slice(0, 500));
      return NextResponse.json(
        { error: "模型服务暂时不可用，请稍后重试。" },
        { status: upstream.status === 429 ? 429 : 502 },
      );
    }

    const completion = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = completion.choices?.[0]?.message?.content;

    if (!content) throw new Error("模型未返回文本内容");

    const result = parseModelJson(content);
    if (!isGeneratedResult(result)) throw new Error("模型返回结构不符合约定");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate route error", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "生成超时，请重试。" : "生成失败，请稍后重试。" },
      { status: timedOut ? 504 : 500 },
    );
  }
}
