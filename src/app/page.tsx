import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              IQA AI Chatbot
            </h1>

            <p className="text-sm text-slate-500">
              RAG-powered knowledge assistant
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-81px)] max-w-4xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
          AI + RAG + Persistent History
        </div>

        <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Ask questions about your documents
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Upload documents, search their contents using AI, and have
          conversations with persistent chat history.
        </p>

        <div className="mt-8">
          <Show
            when="signed-out"
            fallback={
              <a
                href="/chat"
                className="inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Open Chat
              </a>
            }
          >
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-blue-700">
                Get Started
              </button>
            </SignUpButton>
          </Show>
        </div>
      </section>
    </main>
  );
}