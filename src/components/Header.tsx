"use client";

import Link from "next/link";
import { useProfile } from "@/context/ProfileProvider";
import { useLanguage } from "@/context/LanguageProvider";
import { createClient } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { profile } = useProfile();
  const { t } = useLanguage();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-neutral-800 bg-black/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo */}
        <Link href="/" className="font-semibold flex items-center gap-2">
          Papaya
          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400 border border-yellow-500/40">
            Beta
          </span>
        </Link>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-6">
          <Link href="/about" className="text-sm opacity-80 hover:opacity-100">
            {t("about")}
          </Link>
          <Link
            href="/docs/flows"
            className="text-sm opacity-80 hover:opacity-100"
          >
            {t("guide")}
          </Link>
          <Link
            href={profile ? `/${profile.handle}` : "/login"}
            className="text-sm opacity-80 hover:opacity-100"
          >
            {t("my_papaya")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm opacity-80 hover:opacity-100"
          >
            {t("pricing")}
          </Link>
        </nav>

        {/* Right: User / Auth controls */}
        {profile ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-neutral-900"
            >
              <span className="text-sm">{profile.handle ?? profile.email}</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  menuOpen ? "rotate-180 opacity-100" : "opacity-70"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl">
                <div className="px-4 py-2 text-sm text-neutral-400 border-b border-neutral-800">
                  {profile.subscription_level === "pro" ? "Pro" : "Basic"}
                </div>

                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm hover:bg-neutral-900"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("dashboard")}
                </Link>

                <Link
                  href={profile ? `/${profile.handle}` : "/login"}
                  className="block px-4 py-2 text-sm hover:bg-neutral-900"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("my_papaya")}
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-900"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm opacity-80 hover:opacity-100"
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-gray-200"
            >
              {t("signup")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
