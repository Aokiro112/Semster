"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Plus,
  Send,
  Bot,
  User,
  Settings,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { MathRenderer } from "@/components/math/math-renderer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: Message[];
}

export default function AITutorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>(["llama3.1:latest"]);
  const [selectedModel, setSelectedModel] = useState<string>("llama3.1:latest");
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTutorData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai-tutor");
      if (res.ok) {
        const data = await res.json();
        setOllamaOnline(data.ollamaOnline);
        setAvailableModels(data.availableModels || []);
        if (data.availableModels?.length > 0) setSelectedModel(data.availableModels[0]);
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !selectedConvId) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to AI tutor service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorData();
  }, []);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, sending]);

  const handleSendMessage = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const promptToSend = promptOverride || inputPrompt;
    if (!promptToSend.trim() || sending) return;

    setInputPrompt("");
    setSending(true);

    // Optimistically show user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: promptToSend,
      createdAt: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv?.id ? { ...c, messages: [...c.messages, tempUserMsg] } : c
      )
    );

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv?.id,
          userMessage: promptToSend,
          model: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace or append assistant message
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === (activeConv?.id || data.conversationId)) {
              return {
                ...c,
                messages: [...c.messages.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, data.message],
              };
            }
            return c;
          })
        );
      } else {
        toast.error("Failed to generate response");
      }
    } catch {
      toast.error("Network error while connecting to tutor");
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewChat = () => {
    const newId = `new-${Date.now()}`;
    const newChat: Conversation = {
      id: newId,
      title: "New Discussion",
      model: selectedModel,
      messages: [],
    };
    setConversations((prev) => [newChat, ...prev]);
    setSelectedConvId(newId);
  };

  const samplePrompts = [
    "Explain chain rule of differentiation with an example.",
    "Generate 5 oral viva questions for Newton's Rings experiment.",
    "State Cayley-Hamilton theorem and explain how to find matrix inverse.",
    "Explain dynamic memory allocation malloc vs calloc in C.",
  ];

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="AI Tutor"
        subtitle="Syllabus-aware local study companion with LaTeX equations and viva preparation"
        actions={
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
              <Sparkles className="w-3.5 h-3.5 text-foreground" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-foreground font-mono focus:outline-none text-xs"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m} {ollamaOnline ? "(Local)" : "(Simulated)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Ollama Status Badge */}
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border",
                ollamaOnline
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  ollamaOnline ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                )}
              />
              <span>{ollamaOnline ? "Ollama Online" : "Ollama Offline (Simulated)"}</span>
            </span>
          </div>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border rounded-xl bg-card overflow-hidden shadow-sm h-[calc(100vh-140px)]">
          {/* Left Column: History Chats (3 cols) */}
          <div className="md:col-span-3 border-r border-border p-3 space-y-3 bg-muted/10 flex flex-col justify-between">
            <div className="space-y-3">
              <button
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>

              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Recent Discussions
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[500px]">
                  {conversations.map((c) => {
                    const isSelected = c.id === activeConv?.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConvId(c.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors truncate flex items-center gap-2",
                          isSelected
                            ? "bg-card border border-border text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <Bot className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{c.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-card/60 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Local Privacy First</span>
              </div>
              <p className="leading-snug">
                Academic files and syllabus questions are processed locally on your machine.
              </p>
            </div>
          </div>

          {/* Right Column: Chat Stream & Prompt Bar (9 cols) */}
          <div className="md:col-span-9 flex flex-col justify-between bg-card overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {!activeConv?.messages || activeConv.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 my-12">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      How can I help you study today?
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ask conceptual questions, request syllabus derivations, generate viva questions,
                      or test your understanding with practice quizzes.
                    </p>
                  </div>

                  {/* Sample Query Suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left pt-2">
                    {samplePrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(undefined, p)}
                        className="p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors text-xs text-foreground text-left"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                        <span className="line-clamp-2">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                activeConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 text-xs leading-relaxed max-w-3xl",
                      msg.role === "user" ? "ml-auto justify-end" : "mr-auto"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "p-4 rounded-xl border",
                        msg.role === "user"
                          ? "bg-foreground text-background border-foreground font-medium"
                          : "bg-muted/10 border-border text-foreground space-y-2"
                      )}
                    >
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <MathRenderer content={msg.content} />
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center flex-shrink-0 mt-0.5 text-foreground font-bold font-mono">
                        U
                      </div>
                    )}
                  </div>
                ))
              )}

              {sending && (
                <div className="flex gap-3 text-xs max-w-3xl mr-auto">
                  <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-foreground animate-ping" />
                    <span>Analyzing engineering concepts...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Prompt Input Area */}
            <div className="p-4 border-t border-border bg-card/60 backdrop-blur-md">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask anything about your subjects, derivations, or viva prep..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={sending}
                  className="flex-1 p-3 rounded-xl border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-foreground"
                />
                <button
                  type="submit"
                  disabled={sending || !inputPrompt.trim()}
                  className="p-3 rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-40"
                  title="Send Question"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
