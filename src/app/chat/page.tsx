"use client";

import { UserButton } from "@clerk/nextjs";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
};

type Source = {
  number: number;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
};

export default function ChatPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [sources, setSources] = useState<Source[]>([]);

  const [conversations, setConversations] = useState<Conversation[]>(
    []
  );

  const [conversationsLoading, setConversationsLoading] =
    useState(true);

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations");

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setConversations(data.conversations ?? []);
      } catch (error) {
        console.error(
          "Failed to load conversations:",
          error
        );
      } finally {
        setConversationsLoading(false);
      }
    }

    loadConversations();
  }, []);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setMessage("");
  }

  async function handleUpload() {
    if (!file) {
      setMessage(
        "Please select a PDF or text file first."
      );
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/documents/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Upload failed"
        );
      }

      setMessage(
        `Uploaded successfully: ${data.name} (${data.chunks} chunks)`
      );

      setFile(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong during upload."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleChatSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const question = chatInput.trim();

    if (!question || chatLoading) {
      return;
    }

    setChatInput("");
    setChatLoading(true);
    setSources([]);

    setChatMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: question,
      },
    ]);

    try {
      const response = await fetch(
        "/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            conversationId,
          }),
        }
      );

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => null
          );

        throw new Error(
          data?.error ||
            "Failed to get a response from the AI."
        );
      }

      const newConversationId =
        response.headers.get(
          "X-Conversation-Id"
        );

      if (newConversationId) {
        setConversationId(
          newConversationId
        );
      }

      const sourcesHeader =
        response.headers.get(
          "X-Sources"
        );

      if (sourcesHeader) {
        try {
          const parsedSources =
            JSON.parse(
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

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let assistantText = "";

      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        assistantText +=
          decoder.decode(value, {
            stream: true,
          });

        setChatMessages(
          (previous) => {
            const updated = [
              ...previous,
            ];

            updated[
              updated.length - 1
            ] = {
              role: "assistant",
              content:
                assistantText,
            };

            return updated;
          }
        );
      }

      assistantText +=
        decoder.decode();

      setChatMessages(
        (previous) => {
          const updated = [
            ...previous,
          ];

          updated[
            updated.length - 1
          ] = {
            role: "assistant",
            content:
              assistantText,
          };

          return updated;
        }
      );

      try {
        const conversationsResponse =
          await fetch(
            "/api/conversations"
          );

        if (
          conversationsResponse.ok
        ) {
          const data =
            await conversationsResponse.json();

          setConversations(
            data.conversations ?? []
          );
        }
      } catch (conversationError) {
        console.error(
          "Failed to refresh conversations:",
          conversationError
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      setChatMessages(
        (previous) => [
          ...previous,
          {
            role: "assistant",
            content: `Error: ${errorMessage}`,
          },
        ]
      );
    } finally {
      setChatLoading(false);
    }
  }

  function formatDate(
    dateString: string
  ) {
    return new Date(
      dateString
    ).toLocaleString();
  }

  function startNewChat() {
    setConversationId(null);
    setChatMessages([]);
    setChatInput("");
    setSources([]);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              IQA AI Chatbot
            </h1>

            <p className="text-sm text-slate-500">
              RAG-powered knowledge assistant
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/conversations"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              All Conversations
            </Link>

            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        {/* CONVERSATION SIDEBAR */}

        <aside className="hidden w-72 shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">
                Conversations
              </h2>

              <button
                type="button"
                onClick={startNewChat}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                New Chat
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-180px)] overflow-y-auto p-3">
            {conversationsLoading ? (
              <p className="p-3 text-sm text-slate-500">
                Loading...
              </p>
            ) : conversations.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">
                No conversations yet.
              </p>
            ) : (
              <div className="space-y-2">
                {conversations.map(
                  (conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/chat/${conversation.id}`}
                      className={`block rounded-lg p-3 transition ${
                        conversation.id ===
                        conversationId
                          ? "border border-blue-200 bg-blue-50"
                          : "border border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-slate-900">
                        {conversation.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(
                          conversation.createdAt
                        )}
                      </p>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CHAT AREA */}

        <section className="min-w-0 flex-1">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Chat with your documents
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Upload a document and ask questions about its contents.
              </p>
            </div>

            <div className="p-6">
              {/* DOCUMENT UPLOAD */}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">
                  Upload Document
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Supported formats: PDF and TXT
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleFileChange}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  />

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={
                      !file || uploading
                    }
                    className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {uploading
                      ? "Uploading..."
                      : "Upload"}
                  </button>
                </div>

                {file && (
                  <p className="mt-3 text-sm text-slate-600">
                    Selected:{" "}
                    <strong>
                      {file.name}
                    </strong>
                  </p>
                )}

                {message && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    {message}
                  </div>
                )}
              </div>

              {/* CHAT */}

              <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">
                    AI Chat
                  </h3>

                  <p className="text-sm text-slate-500">
                    Ask questions about your uploaded documents.
                  </p>
                </div>

                <div className="min-h-[350px] max-h-[600px] space-y-4 overflow-y-auto bg-white p-6">
                  {chatMessages.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center text-center">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-700">
                          Start a conversation
                        </h4>

                        <p className="mt-2 text-sm text-slate-500">
                          Upload a document and ask the AI a question.
                        </p>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map(
                      (chatMessage, index) => (
                        <div key={index}>
                          <div
                            className={`flex ${
                              chatMessage.role ===
                              "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                                chatMessage.role ===
                                "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              <p className="mb-1 text-xs font-semibold opacity-70">
                                {chatMessage.role ===
                                "user"
                                  ? "You"
                                  : "AI Assistant"}
                              </p>

                              <p className="whitespace-pre-wrap">
                                {
                                  chatMessage.content
                                }
                              </p>
                            </div>
                          </div>

                          {chatMessage.role ===
                            "assistant" &&
                            index ===
                              chatMessages.length -
                                1 &&
                            sources.length >
                              0 && (
                              <div className="mt-3 max-w-[85%]">
                                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                                  Sources
                                </h4>

                                <div className="space-y-2">
                                  {sources.map(
                                    (source) => (
                                      <details
                                        key={
                                          source.chunkId
                                        }
                                        className="rounded-lg border border-slate-200 bg-slate-50"
                                      >
                                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-blue-700">
                                          [
                                          {
                                            source.number
                                          }
                                          ] Document source
                                        </summary>

                                        <div className="border-t border-slate-200 px-4 py-3">
                                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                            {
                                              source.content
                                            }
                                          </p>
                                        </div>
                                      </details>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )
                    )
                  )}

                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
                        AI is thinking...
                      </div>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={
                    handleChatSubmit
                  }
                  className="border-t border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) =>
                        setChatInput(
                          event.target.value
                        )
                      }
                      placeholder="Ask a question..."
                      disabled={chatLoading}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />

                    <button
                      type="submit"
                      disabled={
                        !chatInput.trim() ||
                        chatLoading
                      }
                      className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {chatLoading
                        ? "Sending..."
                        : "Send"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}