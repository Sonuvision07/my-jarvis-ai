
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY सेट नहीं है।" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You are JARVIS, a helpful personal AI assistant. Talk naturally and warmly. Reply in the same language as the user, especially Hindi or Hinglish. Give clear, practical step-by-step help. Never claim you performed an action unless you actually did it. Ask for approval before important actions.",
      input: messages
        .filter((m: any) => ["user", "assistant"].includes(m.role))
        .map((m: any) => ({
          role: m.role,
          content: String(m.content)
        }))
    });

    return NextResponse.json({ reply: response.output_text });
  } catch (error) {
    console.error("JARVIS API error:", error);
    return NextResponse.json(
      { error: "AI से कनेक्शन नहीं हो पाया।" },
      { status: 500 }
    );
  }
}
