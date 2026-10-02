# IQA Chatbot

An AI-powered document question-answering chatbot that allows authenticated users to upload documents and ask questions about their own uploaded content using Retrieval-Augmented Generation (RAG).

The application uses vector embeddings to retrieve relevant document sections and an AI language model to generate answers based on the retrieved context.

## Features

* User authentication with Clerk
* Secure user-specific document management
* Document upload and processing
* Document chunking and vector embeddings
* Retrieval-Augmented Generation (RAG)
* Semantic similarity search using PostgreSQL and pgvector
* AI-powered responses using OpenAI
* Conversation creation and management
* Automatic conversation title generation
* Source references for retrieved document chunks
* User-isolated RAG searches
* Responsive web interface
* Production-ready Next.js application

## Security

Security and user data isolation are important parts of the application.

The application ensures that:

* Users must be authenticated before accessing protected chat functionality.
* Conversations are associated with the authenticated user's Clerk ID.
* Users cannot access conversations belonging to another user.
* RAG similarity searches are restricted to documents belonging to the currently authenticated user.
* Document chunks from other users are excluded from the similarity search.
* API keys and other secrets are stored in environment variables rather than committed to GitHub.

The RAG query explicitly filters documents using the authenticated user's ID before retrieving the most relevant document chunks.

## How RAG Works

The chatbot uses Retrieval-Augmented Generation to answer questions from uploaded documents.

The process is:

1. A user uploads a document.
2. The document is processed and divided into smaller chunks.
3. Each chunk is converted into a vector embedding.
4. The embeddings are stored in PostgreSQL using pgvector.
5. The authenticated user submits a question.
6. The question is converted into an embedding.
7. A similarity search finds the most relevant chunks from that user's documents.
8. The retrieved chunks are provided as context to the AI model.
9. The AI generates an answer based on the supplied document context.
10. The response includes references to the relevant retrieved sources.

Importantly, the similarity search is restricted to documents owned by the currently authenticated user.

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js App Router
* Next.js API Routes
* Prisma ORM
* PostgreSQL
* pgvector

### Authentication

* Clerk

### Artificial Intelligence

* OpenAI
* Vercel AI SDK
* `text-embedding-3-small` for document/question embeddings
* `gpt-4.1-mini` for AI-generated responses and conversation titles

### Development Tools

* Cursor
* GitHub
* GitHub Copilot
* Claude
* ChatGPT

## Project Structure

```text
iqachatbot/
├── app/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── chat/
│   │       ├── conversations/
│   │       └── documents/
│   ├── components/
│   └── lib/
├── prisma/
│   └── schema.prisma
├── public/
├── package.json
├── tsconfig.json
├── next.config.*
└── README.md
```

## Requirements

Before running the project, make sure you have:

* Node.js installed
* npm installed
* A PostgreSQL database with pgvector support
* A Clerk application
* An OpenAI API key

## Installation

Clone the repository:

```bash
git clone https://github.com/developer26081992/iqachatbot.git
```

Change into the project directory:

```bash
cd iqachatbot
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a local environment file:

```text
.env.local
```

Add the required environment variables.

Example:

```env
DATABASE_URL="your_database_connection_string"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

OPENAI_API_KEY="your_openai_api_key"
```

Use the actual values provided by your PostgreSQL, Clerk, and OpenAI accounts.

### Important Security Notice

Never commit `.env.local`, API keys, database passwords, Clerk secret keys, or other credentials to GitHub.

These values should remain in environment variables.

## Database Setup

After configuring the database connection, validate the Prisma schema:

```bash
npx prisma validate
```

Generate the Prisma client:

```bash
npx prisma generate
```

If database migrations are required, run the appropriate Prisma migration command for the development environment.

## Running the Development Server

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

Open the address in a web browser.

## TypeScript Validation

To check the project for TypeScript errors:

```bash
npx tsc --noEmit
```

## Production Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## GitHub Repository

The source code for this project is available at:

https://github.com/developer26081992/iqachatbot.git

## AI Coding Assistance Declaration

AI coding assistants were used during the development of this project to support software development activities, including code generation, debugging, code explanation, documentation, and troubleshooting.

The following AI coding assistants were used:

* GitHub Copilot
* Cursor
* Claude
* ChatGPT

The developer reviewed, tested, and integrated the generated suggestions and remains responsible for the final implementation, functionality, and security of the application.

## Testing and Validation

The project was checked during development using:

```bash
npx tsc --noEmit
```

and:

```bash
npm run build
```

The Prisma schema was also validated using:

```bash
npx prisma validate
```

The RAG implementation was reviewed to ensure that document similarity searches are restricted to documents owned by the authenticated user.

## Data Privacy

Uploaded documents may contain user-provided information.

The application is designed so that authenticated users can retrieve information only from their own uploaded documents.

The application should be deployed with appropriate security controls, protected environment variables, secure authentication configuration, and a properly secured production database.

## Deployment

The application is designed to be deployed using a platform such as Vercel.

Before deployment:

1. Push the project to GitHub.
2. Import the repository into the deployment platform.
3. Configure all required environment variables.
4. Configure the production PostgreSQL database.
5. Configure Clerk for the production domain.
6. Configure the OpenAI API key securely.
7. Deploy the application.
8. Test authentication.
9. Test document upload.
10. Test RAG question answering.
11. Verify that users cannot retrieve documents belonging to other users.

## Future Improvements

Possible future improvements include:

* Additional document formats
* Improved document processing
* Streaming response improvements
* Conversation search
* Document management interface
* Improved source previews
* Usage monitoring
* Rate limiting
* More granular authorization controls
* Automated security testing
* Production logging and monitoring

## Author

Developed as an AI-powered document question-answering application using Next.js, PostgreSQL, Prisma, Clerk, OpenAI, and Retrieval-Augmented Generation (RAG).
