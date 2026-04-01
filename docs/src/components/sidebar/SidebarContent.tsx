import React from "react";
import { Link, useLocation } from "@tanstack/react-router";

interface SidebarItem {
  items: Array<{
    href: string;
    title: string;
  }>;
  order: number;
  sectionTitle: string;
}

export const SIDEBAR_ITEMS = {
  deployment: {
    items: [
      {
        href: "/deployment",
        title: "Deployment",
      },
    ],
    order: 3,
    sectionTitle: "Deployment",
  },
  usage: {
    items: [
      {
        href: "/first-steps",
        title: "First Steps",
      },
      {
        href: "/typescript",
        title: "Typescript",
      },
      {
        href: "/vite",
        title: "Vite",
      },
      {
        href: "/bun",
        title: "Bun",
      },
      {
        href: "/drizzle",
        title: "Drizzle",
      },
      {
        href: "/authjs",
        title: "Auth.js",
      },
      {
        href: "/testing",
        title: "Testing",
      },
    ],
    order: 2,
    sectionTitle: "Usage",
  },
  vexApp: {
    items: [
      {
        href: "/introduction",
        title: "Introduction",
      },
      {
        href: "/getting-started",
        title: "Getting Started",
      },
      {
        href: "/project-structure",
        title: "Project Structure",
      },
      {
        href: "/vex-spec",
        title: "Vex spec (.vex)",
      },
      {
        href: "/recommendations",
        title: "Recommendations",
      },
      {
        href: "/ai",
        title: "AI Integration",
      },
    ],
    order: 1,
    sectionTitle: "Vex App",
  },
} as const satisfies Record<string, SidebarItem>;

export const getAllNavigationItems = (): Array<{
  href: string;
  title: string;
}> => {
  const sortedSections = Object.values(SIDEBAR_ITEMS).sort((a, b) => a.order - b.order);
  return sortedSections.flatMap((section) => section.items.map((item) => ({ href: item.href, title: item.title })));
};

interface SidebarContentProps {
  onLinkClick?: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ onLinkClick }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const sortedSections = Object.values(SIDEBAR_ITEMS).sort((a, b) => a.order - b.order);

  return (
    <>
      {sortedSections.map((section) => (
        <div className="flex flex-col gap-2" key={section.sectionTitle}>
          <h3 className="mb-2 text-base font-semibold uppercase tracking-wide text-white">{section.sectionTitle}</h3>
          <nav className="flex flex-col gap-1">
            {section.items.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link
                  className={`relative flex items-center rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-white/10 font-semibold text-violet-300"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                  key={item.href}
                  onClick={onLinkClick}
                  to={item.href}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-400 rounded-r" />}
                  <span className="pl-1">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </>
  );
};
