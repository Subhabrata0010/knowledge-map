# Knowledge Map - Frontend Client

Next.js frontend for the Internet Knowledge Map system with interactive graph visualization.

## 🚀 Features

- **Modern UI**: Clean, responsive interface built with Next.js 16 and TailwindCSS 4
- **Interactive Graphs**: React Flow-powered visualization with zoom, pan, and drag
- **Real-Time Search**: Instant feedback with loading states and error handling
- **Smart Caching**: Client-side localStorage caching (1 hour TTL)
- **Type-Safe**: Full TypeScript coverage for robust development
- **Performance**: Optimized with Next.js App Router and React 19
- **Accessibility**: Keyboard navigation and screen reader support

## 📁 Project Structure

```
client/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page with search
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   └── graph/
│       └── [topic]/
│           └── page.tsx   # Graph visualization page
│
├── components/            # React components
│   ├── ui/               # Reusable UI primitives
│   ├── search/           # Search components
│   ├── graph/            # Graph visualization
│   ├── panels/           # Info panels
│   └── layout/           # Header/Footer
│
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/            # Backend integration
├── types/               # TypeScript types
├── constants/           # Configuration
└── public/              # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: React 19
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4
- **Graph Viz**: React Flow
- **HTTP Client**: Axios

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

### Build

```bash
npm run build
npm start
```

## 📚 Documentation

See the full documentation in this README for:
- Component API
- Custom hooks usage
- Deployment options
- Performance optimization
- And more!

For backend documentation, see [../server/README.md](../server/README.md).
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
