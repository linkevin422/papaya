"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageProvider";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-28 sm:pt-32 pb-20 sm:pb-24">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-5 sm:mb-6 leading-tight">
        {t("hero_title")}
      </h1>

      <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-md sm:max-w-xl mb-6 sm:mb-8">
        {t("hero_subtitle")}
      </p>

      <Link
        href="/docs/flows"
        className="text-sm text-gray-400 hover:text-white underline transition"
      >
        {t("learn_more")}
      </Link>

      <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3 w-full">
        <Link
          href="/register"
          className="bg-white text-black text-sm font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition w-3/4 sm:w-auto"
        >
          {t("get_started")}
        </Link>

        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white underline transition"
        >
          {t("go_to_flows", { defaultValue: "前往我的 Flows" })}
        </Link>
      </div>
    </section>
  );
}
