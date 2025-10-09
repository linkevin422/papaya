"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageProvider";

export type ViewMode = "daily" | "monthly" | "yearly";

type Props = {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
};

export default function TimeframeSwitcher({ viewMode, setViewMode }: Props) {
  const { t } = useLanguage();

  const labels: Record<ViewMode, string> = {
    daily: t("flowpage_daily"),
    monthly: t("flowpage_monthly"),
    yearly: t("flowpage_yearly"),
  };

  return (
    <div className="inline-flex gap-1 sm:gap-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 p-1 overflow-x-auto flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {(["daily", "monthly", "yearly"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={cn(
            "text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-1.5 rounded-md transition-colors whitespace-nowrap select-none",
            viewMode === mode
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          )}
        >
          {labels[mode]}
        </button>
      ))}
    </div>
  );
}
