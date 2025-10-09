"use client";

import Link from "next/link";
import { useProfile } from "@/context/ProfileProvider";
import { useLanguage } from "@/context/LanguageProvider";
import { createClient } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

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
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
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
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-md supports-[backdrop-filter]:bg-black/60 transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo */}
        <Link href="/" className="font-semibold flex items-center gap-2">
          Papaya
          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400 border border-yellow-500/40">
            Beta
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
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

        {/* Right: Auth / Burger */}
        <div className="flex items-center gap-2">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 active:scale-95 transition"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Auth controls (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {profile ? (
              <button
                onClick={handleLogout}
                className="text-sm opacity-80 hover:opacity-100"
              >
                {t("logout")}
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="md:hidden absolute top-16 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur-md flex flex-col items-center gap-5 py-8 animate-in fade-in slide-in-from-top duration-200"
        >
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className="text-sm opacity-90"
          >
            {t("about")}
          </Link>
          <Link
            href="/docs/flows"
            onClick={() => setMenuOpen(false)}
            className="text-sm opacity-90"
          >
            {t("guide")}
          </Link>
          <Link
            href={profile ? `/${profile.handle}` : "/login"}
            onClick={() => setMenuOpen(false)}
            className="text-sm opacity-90"
          >
            {t("my_papaya")}
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            className="text-sm opacity-90"
          >
            {t("pricing")}
          </Link>

          {profile ? (
            <button
              onClick={handleLogout}
              className="text-sm opacity-80 hover:opacity-100 mt-2"
            >
              {t("logout")}
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-white text-black px-6 py-2 text-sm font-semibold hover:bg-gray-100 shadow-sm transition"
              >
                {t("signup")}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
