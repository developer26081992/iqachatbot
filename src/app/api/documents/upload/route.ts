import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { PDFParse } from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 50
) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);

    chunks.push(words.slice(start, end).join(" "));

    if (end >= words.length) {
      break;
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileType = file.type;

    const isPdfFile =
      fileName.toLowerCase().endsWith(".pdf") ||
      fileType === "application/pdf";

    const isTextFile =
      fileName.toLowerCase().endsWith(".txt") ||
      fileType === "text/plain";

    if (!isPdfFile && !isTextFile) {
      return Response.json(
        {
          error: "Only PDF and TXT files are supported",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    let content = "";

    if (isPdfFile) {
      const parser = new PDFParse({
        data: buffer,
      });

      const result = await parser.getText();

      content = result.text;

      await parser.destroy();
    } else {
      content = buffer.toString("utf-8");
    }

    content = content.trim();

    if (!content) {
      return Response.json(
        {
          error:
            "The uploaded document contains no readable text",
        },
        { status: 400 }
      );
    }

    const chunks = chunkText(content);

    const document = await prisma.document.create({
      data: {
        userId,
        name: fileName,
        content,
      },
    });

    for (
      let index = 0;
      index < chunks.length;
      index++
    ) {
      const chunk = chunks[index];

      const embeddingResponse =
        await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
        });

      const embedding =
        embeddingResponse.data[0].embedding;

      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk"
          ("id", "documentId", "content", "embedding", "chunkIndex")
        VALUES
          (
            ${crypto.randomUUID()},
            ${document.id},
            ${chunk},
            ${`[${embedding.join(",")}]`}::vector,
            ${index}
          )
      `;
    }

    return Response.json(
      {
        success: true,
        documentId: document.id,
        name: document.name,
        chunks: chunks.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Document upload error:",
      error
    );

    return Response.json(
      {
        error: "Failed to process document",
      },
      { status: 500 }
    );
  }
}