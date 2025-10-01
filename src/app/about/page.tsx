"use client";

import { useLanguage } from "@/context/LanguageProvider";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-black text-white px-6 py-32 flex items-center justify-center">
      <section className="max-w-3xl space-y-12">
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-center">
          {t("about_title")}
        </h1>

        {/* Mission */}
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">
            {t("about_mission_title") ?? "Mission"}
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            {t("about_mission")}
          </p>
        </div>

        {/* Story */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t("about_story_title")}</h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            {t("about_story")}
          </p>
        </div>

        {/* Values */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t("about_values_title")}</h2>
          <ul className="space-y-2 list-disc list-inside text-lg text-gray-400 leading-relaxed">
            {(t("about_values") as unknown as string[]).map((val, i) => (
              <li key={i}>{val}</li>
            ))}
          </ul>
        </div>

        {/* What Papaya Is */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t("about_what_title")}</h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            {t("about_what")}
          </p>
        </div>

        {/* Community */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t("about_community_title")}</h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            {t("about_community")}
          </p>
        </div>

        {/* Vision */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t("about_vision_title")}</h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            {t("about_vision")}
          </p>
        </div>
      </section>
    </main>
  );
}
