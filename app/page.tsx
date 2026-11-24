
"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "नमस्ते! मैं तुम्हारा JARVIS हूँ। मुझसे हिंदी या English में बात करो।" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function sendMessage(text = input) {
    const value = text.trim();
    if (!value || busy) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "कुछ गड़बड़ हो गई।";
      setMessages([...next, { role: "assistant", content: `माफ़ करना, अभी जवाब नहीं मिल पाया: ${message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function listen() {
    const w = window as Window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) {
      alert("इस browser में voice input उपलब्ध नहीं है। Chrome में खोलकर कोशिश करें।");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceBusy(true);
    recognition.onend = () => setVoiceBusy(false);
    recognition.onerror = () => setVoiceBusy(false);
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="shell">
      <header className="top">
        <div className="orb">J</div>
        <div><h1>JARVIS</h1><p>PERSONAL AI ASSISTANT</p></div>
        <span className="status"><i /> ONLINE UI</span>
      </header>
      <section className="intro">
        <p className="eyebrow">YOUR PERSONAL ASSISTANT</p>
        <h2>नमस्ते, कैसे मदद करूँ?</h2>
        <p>हिंदी या English में अपना सवाल लिखो या माइक्रोफोन से बोलो।</p>
      </section>
      <section className="chat" aria-live="polite">
        {messages.map((m, i) => (
          <div className={`message ${m.role}`} key={i}>
            <span className="who">{m.role === "user" ? "YOU" : "JARVIS"}</span>
            <p>{m.content}</p>
            {m.role === "assistant" && (
              <button className="speak" onClick={() => speak(m.content)}>🔊 सुनो</button>
            )}
          </div>
        ))}
        {busy && <div className="message assistant"><span className="who">JARVIS</span><p className="typing">सोच रहा हूँ…</p></div>}
        <div ref={bottomRef} />
      </section>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}>
        <button type="button" className={`mic ${voiceBusy ? "active" : ""}`} onClick={listen} aria-label="Voice input">🎙️</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="JARVIS से कुछ पूछो…" aria-label="Message" />
        <button className="send" type="submit" disabled={busy || !input.trim()}>भेजो ↑</button>
      </form>
      <p className="note">यह शुरुआती वेब ऐप है। माइक्रोफोन browser support और permission पर निर्भर है।</p>
    </main>
  );
}
