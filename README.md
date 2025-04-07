# DeloConnect

<p align="center">
  An AI-powered Employee Support Platform for Professional Development and Guidance.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#development"><strong>Development</strong></a> ·
  <a href="#project-structure"><strong>Project Structure</strong></a>
</p>
<br/>

## Features

- **Modern Frontend Framework**
  - [Next.js](https://nextjs.org) 15 with App Router
  - React 18 with Server Components
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Framer Motion for animations

- **AI Integration**
  - Multiple AI model support (OpenAI, Fireworks)
  - Real-time chat interface with speech recognition
  - Code highlighting and markdown support
  - Structured data handling
  - CodeMirror integration for code editing

- **UI/UX**
  - Modern component library with [shadcn/ui](https://ui.shadcn.com)
  - Responsive design
  - Dark/Light mode support with next-themes
  - Accessible components with Radix UI
  - Data grid support with react-data-grid
  - Toast notifications with sonner

- **State Management**
  - Redux Toolkit for global state
  - SWR for data fetching
  - Custom hooks for reusable logic
  - React Query for server state management

- **Developer Experience**
  - Biome for linting and formatting
  - ESLint for code quality
  - TypeScript for type safety
  - Hot module replacement
  - Prettier for code formatting
  - PostCSS for CSS processing

## Tech Stack

- **Framework**: Next.js 15.1.0
- **Language**: TypeScript 5.6.3
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: Redux Toolkit 2.6.1, SWR 2.2.5
- **AI Integration**: Vercel AI SDK, OpenAI, Fireworks
- **Code Quality**: Biome 1.9.4, ESLint 8.57.0
- **Development Tools**: TypeScript, PostCSS, Prettier
- **Data Handling**: Zod for validation, PapaParse for CSV

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/deloconnect.git
cd deloconnect
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_APP_URL=<backend_url>
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Development

### Available Scripts

- `npm run dev` - Start development server with turbo mode
- `npm run build` - Build the application
- `npm run start` - Start the production server
- `npm run lint` - Run linting checks with Next.js and Biome
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Check code formatting
- `npm run format:fix` - Fix code formatting issues

## Project Structure

```
deloconnect/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (session)/         # Session management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI components
│   ├── chat.tsx          # Chat interface
│   ├── employee-dashboard.tsx  # Dashboard
│   └── ...              # Other components
├── lib/                  # Core utilities
│   ├── ai/              # AI integration
│   ├── artifacts/       # Artifact handling
│   ├── db/             # Database utilities
│   └── utils.ts        # Utility functions
├── redux/               # Redux store
├── hooks/              # Custom React hooks
├── public/             # Static assets
├── docs/               # Documentation
└── config files        # Various configuration files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the terms of the LICENSE file in the root directory.
