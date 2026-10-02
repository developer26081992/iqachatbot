"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load conversations."
          );
        }

        setConversations(data.conversations);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load conversations."
        );
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              IQA AI Chatbot
            </h1>

            <p className="text-sm text-slate-500">
              Conversation History
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Chat
            </Link>

            <UserButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Conversations
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              View your previous AI conversations.
            </p>
          </div>

          <div className="p-6">
            {loading && (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading conversations...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              conversations.length === 0 && (
                <div className="rounded-lg bg-slate-50 p-10 text-center">
                  <h3 className="font-semibold text-slate-700">
                    No conversations yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Start a new chat to create your first conversation.
                  </p>

                  <Link
                    href="/chat"
                    className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Start New Chat
                  </Link>
                </div>
              )}

            {!loading &&
              !error &&
              conversations.length > 0 && (
                <div className="space-y-3">
                  {conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/chat/${conversation.id}`}
                      className="block rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-slate-900">
                          {conversation.title}
                        </h3>

                        <span className="shrink-0 text-xs text-slate-500">
                          {formatDate(conversation.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-blue-600">
                        Open conversation →
                      </p>
                    </Link>
                  ))}
                </div>
              )}
          </div>
        </div>
      </section>
    </main>
  );
}