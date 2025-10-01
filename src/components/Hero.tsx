"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageProvider";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
        {t("hero_title")}
      </h1>
      <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-6">
        {t("hero_subtitle")}
      </p>
      <Link
        href="/docs/flows"
        className="text-sm text-gray-400 hover:text-white underline transition"
      >
        {t("learn_more")}
      </Link>
      <div className="mt-10">
        <Link
          href="/register"
          className="bg-white text-black text-sm font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition"
        >
          {t("get_started")}
        </Link>
      </div>
    </section>
  );
}
