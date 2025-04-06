# Employee Experience AI Conversation Bot

<p align="center">
  An AI-powered Conversation Bot Built to Augment Employee Experience.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#development"><strong>Development</strong></a>
</p>
<br/>

## Features

- **Modern Frontend Framework**

  - [Next.js](https://nextjs.org) 15 with App Router
  - React 18 with Server Components
  - TypeScript for type safety
  - Tailwind CSS for styling

- **AI Integration**

  - Multiple AI model support (OpenAI, Fireworks)
  - Real-time chat interface
  - Code highlighting and markdown support
  - Structured data handling

- **UI/UX**

  - Modern component library with [shadcn/ui](https://ui.shadcn.com)
  - Responsive design
  - Dark/Light mode support
  - Accessible components with Radix UI

- **State Management**

  - Redux Toolkit for global state
  - SWR for data fetching
  - Custom hooks for reusable logic

- **Developer Experience**
  - Biome for linting and formatting
  - ESLint for code quality
  - TypeScript for type safety
  - Hot module replacement

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: Redux Toolkit, SWR
- **AI Integration**: Vercel AI SDK
- **Code Quality**: Biome, ESLint
- **Development Tools**: TypeScript, PostCSS

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/employee-frontend.git
cd employee-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```env
# Add your environment variables here
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
- `npm run lint` - Run linting checks
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code using Biome

### Project Structure

```
employee-frontend/
├── app/                 # Next.js app directory
├── components/          # Reusable UI components
├── lib/                 # Utility functions and configurations
├── hooks/              # Custom React hooks
├── redux/              # Redux store and slices
├── public/             # Static assets
└── docs/               # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the terms of the LICENSE file in the root directory.
