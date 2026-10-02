import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import { embed, generateText, streamText } from "ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const conversationId =
      typeof body.conversationId === "string"
        ? body.conversationId
        : null;

    let conversation;

    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!conversation) {
        return Response.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: "New Conversation",
        },
      });
    }

    const isFirstMessage =
      conversation.title === "New Conversation";

    const embeddingResult = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: message,
    });

    const vector = `[${embeddingResult.embedding.join(",")}]`;

    // SECURITY:
    // Only search document chunks belonging to the
    // currently authenticated user's documents.
    const chunks = await prisma.$queryRaw<
      {
        id: string;
        content: string;
        documentId: string;
        chunkIndex: number;
        distance: number;
      }[]
    >`
      SELECT
        dc."id",
        dc."content",
        dc."documentId",
        dc."chunkIndex",
        dc."embedding" <=> ${vector}::vector AS "distance"
      FROM "DocumentChunk" dc
      INNER JOIN "Document" d
        ON d."id" = dc."documentId"
      WHERE d."userId" = ${userId}
      ORDER BY dc."embedding" <=> ${vector}::vector
      LIMIT 5
    `;

    const context = chunks
      .map(
        (chunk, index) =>
          `[${index + 1}] ${chunk.content}`
      )
      .join("\n\n");

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    const sources = chunks.map((chunk, index) => ({
      number: index + 1,
      chunkId: chunk.id,
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
    }));

    const result = streamText({
      model: openai("gpt-4.1-mini"),

      system: `You are an AI assistant that answers questions using the provided document context.

Use the document context when it is relevant.

If the answer cannot be found in the provided context, clearly say that the information is not available in the uploaded documents.

When using information from the document context, refer to the relevant source using [1], [2], [3], [4], or [5].

Document context:

${context}`,

      prompt: message,

      onFinish: async ({ text }) => {
        if (text.trim()) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "assistant",
              content: text,
            },
          });
        }

        if (isFirstMessage) {
          try {
            const titleResult = await generateText({
              model: openai("gpt-4.1-mini"),

              prompt: `Create a short conversation title based on this user message.

Rules:

- Maximum 6 words.
- Keep it concise.
- Do not use quotation marks.
- Return only the title.

User message:

${message}`,
            });

            const title = titleResult.text
              .trim()
              .replace(/^["']|["']$/g, "")
              .split(/\s+/)
              .slice(0, 6)
              .join(" ");

            if (title) {
              await prisma.conversation.update({
                where: {
                  id: conversation.id,
                },
                data: {
                  title,
                },
              });
            }
          } catch (titleError) {
            console.error(
              "Conversation title generation error:",
              titleError
            );
          }
        }
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "X-Conversation-Id": conversation.id,
        "X-Sources": JSON.stringify(sources),
        "Access-Control-Expose-Headers":
          "X-Conversation-Id, X-Sources",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return Response.json(
      {
        error: "Failed to process chat request",
      },
      { status: 500 }
    );
  }
}