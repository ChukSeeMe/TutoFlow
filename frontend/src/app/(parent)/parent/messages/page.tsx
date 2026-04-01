"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parentsApi } from "@/lib/api";
import { MessageSquare, Send, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { ChildSummary } from "@/types";

interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  student_id: number;
  subject: string;
  body: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
  direction: "inbound" | "outbound";
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === "outbound";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isOut
          ? "bg-brand-500 text-white rounded-br-sm"
          : "bg-white dark:bg-[#1c1c2a] border border-gray-200 dark:border-white/[0.07] text-gray-900 dark:text-zinc-100 rounded-bl-sm"
      }`}>
        <p className="text-xs font-medium mb-1 opacity-70">{msg.subject}</p>
        <p className="text-sm leading-relaxed">{msg.body}</p>
        <p className={`text-[10px] mt-1.5 ${isOut ? "text-white/60" : "text-gray-400 dark:text-zinc-600"}`}>
          {formatDate(msg.sent_at || msg.created_at)}
          {isOut && msg.read_at && " · Read"}
        </p>
      </div>
    </div>
  );
}

export default function ParentMessages() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [studentId, setStudentId] = useState<number | "">("");
  const [showCompose, setShowCompose] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["parent-messages"],
    queryFn: () => parentsApi.myMessages().then((r) => r.data),
    refetchInterval: 30_000,  // poll every 30s
  });

  const { data: children = [] } = useQuery<ChildSummary[]>({
    queryKey: ["parent-children"],
    queryFn: () => parentsApi.myChildren().then((r) => r.data),
  });

  // Auto-select single child
  useEffect(() => {
    if (children.length === 1 && studentId === "") {
      setStudentId(children[0].student_id);
    }
  }, [children, studentId]);

  const sendMutation = useMutation({
    mutationFn: () =>
      parentsApi.sendMessage({
        student_id: studentId as number,
        subject,
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-messages"] });
      setSubject("");
      setBody("");
      setStudentId("");
      setShowCompose(false);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    },
  });

  const canSend = !!studentId && subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Messages</h1>
          <p className="text-gray-500 dark:text-zinc-500 text-sm mt-1">
            Your conversation with the tutor.
          </p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send className="h-4 w-4" />
          New message
        </button>
      </div>

      {sent && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm">
          Message sent to your tutor.
        </div>
      )}

      {/* Compose panel */}
      {showCompose && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">New message</h2>

          {children.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                Regarding
              </label>
              <div className="relative">
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none pr-8"
                >
                  <option value="">Select child…</option>
                  {children.map((c) => (
                    <option key={c.student_id} value={c.student_id}>{c.first_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}


          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question about homework"
              className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Type your message…"
              className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => sendMutation.mutate()}
              disabled={!canSend || sendMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
              {sendMutation.isPending ? "Sending…" : "Send"}
            </button>
            <button
              onClick={() => setShowCompose(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Message thread */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className="h-16 w-64 rounded-2xl bg-gray-200 dark:bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && messages.length === 0 && !showCompose && (
        <div className="bg-white dark:bg-[#16161f] rounded-xl border border-gray-200 dark:border-white/[0.07] py-12 text-center">
          <MessageSquare className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-zinc-500 text-sm">No messages yet.</p>
          <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1">
            Use &ldquo;New message&rdquo; to contact your tutor.
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="bg-gray-50 dark:bg-[#0f0f17] rounded-xl border border-gray-200 dark:border-white/[0.07] p-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>
      )}
    </div>
  );
}
