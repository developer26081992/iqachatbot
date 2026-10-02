import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConversationChat from "./ConversationChat";

type ChatPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ConversationPage({
  params,
}: ChatPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  return (
    <ConversationChat
      conversationId={conversation.id}
      title={conversation.title}
      initialMessages={conversation.messages.map((message) => ({
        role:
          message.role === "user"
            ? "user"
            : "assistant",
        content: message.content,
      }))}
    />
  );
}