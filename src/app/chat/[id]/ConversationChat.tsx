"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { FormEvent, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Source = {
  number: number;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
};

type ConversationChatProps = {
  conversationId: string;
  title: string;
  initialMessages: ChatMessage[];
};

export default function ConversationChat({
  conversationId,
  title,
  initialMessages,
}: ConversationChatProps) {
  const [messages, setMessages] =
    useState<ChatMessage[]>(initialMessages);

  const [sources, setSources] = useState<Source[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const question = input.trim();

    if (!question || loading) {
      return;
    }

    setInput("");
    setLoading(true);
    setSources([]);

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: question,
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          conversationId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error ||
            "Failed to get a response from the AI."
        );
      }

      const sourcesHeader =
        response.headers.get("X-Sources");

      if (sourcesHeader) {
        try {
          const parsedSources = JSON.parse(
            sourcesHeader
          ) as Source[];

          setSources(parsedSources);
        } catch (sourceError) {
          console.error(
            "Failed to parse sources:",
            sourceError
          );
        }
      }

      if (!response.body) {
        throw new Error(
          "The server returned no response stream."
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        assistantText += decoder.decode(value, {
          stream: true,
        });

        setMessages((previous) => {
          const updated = [...previous];

          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantText,
          };

          return updated;
        });
      }

      assistantText += decoder.decode();

      setMessages((previous) => {
        const updated = [...previous];

        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantText,
        };

        return updated;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
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

          <div className="flex items-center gap-3">
            <Link
              href="/conversations"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Conversations
            </Link>

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

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Continue your conversation.
            </p>
          </div>

          <div className="min-h-[450px] max-h-[600px] space-y-4 overflow-y-auto bg-white p-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[350px] items-center justify-center text-center">
                <div>
                  <h3 className="text-lg font-semibold text-slate-700">
                    No messages yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Send a message to begin.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index}>
                  <div
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold opacity-70">
                        {message.role === "user"
                          ? "You"
                          : "AI Assistant"}
                      </p>

                      <p className="whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>

                  {message.role === "assistant" &&
                    index === messages.length - 1 &&
                    sources.length > 0 && (
                      <div className="mt-3 ml-0 max-w-[85%]">
                        <h4 className="mb-2 text-sm font-semibold text-slate-700">
                          Sources
                        </h4>

                        <div className="space-y-2">
                          {sources.map((source) => (
                            <details
                              key={source.chunkId}
                              className="rounded-lg border border-slate-200 bg-slate-50"
                            >
                              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-blue-700">
                                [{source.number}] Document source
                              </summary>

                              <div className="border-t border-slate-200 px-4 py-3">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {source.content}
                                </p>
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Continue the conversation..."
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}