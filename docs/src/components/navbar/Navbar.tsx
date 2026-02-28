import React from "react";
import { Link } from "@tanstack/react-router";
import { FaGithub, FaXTwitter } from "react-icons/fa6";

interface NavbarProps {
  hideLogo?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ hideLogo }) => {
  return (
    <nav className="fixed top-8 left-8 right-8 z-50 flex items-center justify-between pointer-events-none">
      {hideLogo ? (
        <div className="h-15 w-15" />
      ) : (
        <Link
          aria-label="Go to home"
          className="pointer-events-auto transition-opacity duration-200 hover:opacity-80 flex items-center gap-2"
          to="/"
        >
          <img alt="Thunder App Logo" className="h-15 w-15 drop-shadow-lg" src="/logos/thunder-app.png" />
        </Link>
      )}
      <div className="flex items-center gap-4 text-white/80 pointer-events-auto">
        <a
          aria-label="Open GitHub repository"
          className="hover:text-white transition-colors duration-200"
          href="https://github.com/acrichards3/thunder-cli"
          rel="noopener noreferrer"
          target="_blank"
        >
          <FaGithub className="h-10 w-10 drop-shadow" />
        </a>
        <a
          aria-label="Open X profile"
          className="hover:text-white transition-colors duration-200"
          href="https://x.com/Acricha3"
          rel="noopener noreferrer"
          target="_blank"
        >
          <FaXTwitter className="h-10 w-10 drop-shadow" />
        </a>
      </div>
    </nav>
  );
};
