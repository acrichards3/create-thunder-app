import React from "react";
import { FiChevronRight } from "react-icons/fi";
import { Link } from "@tanstack/react-router";
import { Navbar } from "./components/navbar/Navbar";
import { TechCard } from "./components/techCard/TechCard";
import type { TechCardProps } from "./components/techCard/TechCard";

const technologies = [
  {
    description:
      "Bun is an all-in-one JavaScript runtime, bundler, test runner, and package manager. It's incredibly fast and provides a seamless development experience with built-in TypeScript support.",
    href: "https://bun.sh",
    logo: "/logos/logo.svg",
    name: "Bun",
  },
  {
    description:
      "Hono is an ultrafast web framework for the modern web. Built on Web Standards, it's lightweight and perfect for building APIs and full-stack applications with excellent performance.",
    href: "https://hono.dev",
    logo: "/logos/hono.svg",
    name: "Hono",
  },
  {
    description:
      "Auth.js provides flexible, secure, and scalable authentication. It integrates seamlessly with your database and offers a simple API for managing users and sessions.",
    href: "https://authjs.dev",
    logo: "/logos/authjs.png",
    name: "Auth.js",
  },
  {
    description:
      "Drizzle ORM is a lightweight, performant TypeScript ORM with a type-safe API. It's perfect for working with SQL databases and provides excellent developer experience with zero runtime overhead.",
    href: "https://orm.drizzle.team",
    logo: "/logos/drizzle.webp",
    name: "Drizzle",
  },
  {
    description:
      "Vite is a next-generation frontend build tool that provides instant server start and lightning-fast HMR. It's the foundation of modern frontend development with excellent developer experience.",
    href: "https://vite.dev",
    logo: "/logos/vite.svg",
    name: "Vite",
  },
  {
    description:
      "Tailwind CSS is a utility-first CSS framework that helps you build beautiful, responsive designs without leaving your HTML. It's completely customizable and works perfectly with modern React applications.",
    href: "https://tailwindcss.com",
    logo: "/logos/tailwind.svg",
    name: "Tailwind CSS",
  },
  {
    description:
      "TanStack Router provides fully type-safe file-based routing with automatic code splitting. TanStack Query (React Query) handles data fetching, caching, and synchronization. Together they power the frontend's navigation and server state.",
    href: "https://tanstack.com",
    logo: "/logos/react-query.svg",
    name: "TanStack Router + Query",
  },
  {
    description:
      "TypeScript is a strongly typed programming language that builds on JavaScript. It adds static type definitions to help catch errors early and improve developer experience with better tooling.",
    href: "https://www.typescriptlang.org",
    logo: "/logos/typescript.svg",
    name: "TypeScript",
  },
  {
    description:
      "Zod is a TypeScript-first schema validation library. It provides a simple, declarative API for runtime type checking and validation, ensuring data integrity across your application.",
    href: "https://zod.dev",
    logo: "/logos/zod.webp",
    name: "Zod",
  },
] as const satisfies TechCardProps[];

export function App() {
  const [copied, setCopied] = React.useState(false);
  const command = "bun create vex-app@latest";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <main className="relative flex flex-1 flex-col items-center gap-32 justify-start px-4 py-12">
      <Navbar hideLogo />
      <div className="flex flex-col items-center gap-6">
        <img alt="Vex App Logo" className="h-40 w-40 drop-shadow-lg" src="/logos/vex-app-logo.png" />
        <h1 className="text-7xl font-bold text-white drop-shadow-md text-center max-w-5xl">
          Stop wrestling with annoying <span className="text-violet-400">AI slop</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl text-center">
          An AI-first full-stack starter kit with strict linting, post-write hooks, and Cursor rules that keep AI agents
          writing production-quality code from the first keystroke.
        </p>
        <Link
          aria-label="View documentation"
          className="group inline-flex items-center gap-2 text-violet-300 hover:text-violet-200 text-base sm:text-lg font-semibold tracking-wide transition-colors duration-200"
          to="/introduction"
        >
          View documentation
          <FiChevronRight
            aria-hidden="true"
            className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
        <div className="flex items-center gap-3 bg-white/5 border border-violet-500/20 rounded-lg px-4 py-3 max-w-2xl w-full group hover:border-violet-400/40 transition-colors duration-200">
          <code className="text-white text-lg font-mono flex-1">{command}</code>
          <button
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors duration-200 cursor-pointer shrink-0 ${
              copied
                ? "bg-green-500/30 hover:bg-green-500/40 border border-green-400 text-green-200"
                : "bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300"
            }`}
            onClick={handleCopy}
            type="button"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex flex-col items-center gap-3 text-center max-w-4xl">
          <h2 className="text-6xl font-bold text-white drop-shadow-md leading-tight">
            Built on Bun. <span className="text-violet-400">Strict by default.</span>
          </h2>
          <p className="text-gray-400 text-lg">A type-safe full-stack powered by Bun with strict guardrails for AI</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {technologies.map((tech) => (
            <TechCard
              description={tech.description}
              href={tech.href}
              key={tech.name}
              logo={tech.logo}
              name={tech.name}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
