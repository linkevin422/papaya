"use client";

import { useLanguage } from "@/context/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-black text-white px-6 py-32 flex items-center justify-center">
      <section className="max-w-3xl text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-8">
          {t("about_title")}
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 leading-relaxed">
          {t("about_mission")}
        </p>
      </section>
    </main>
  );
}
