"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border transition-colors duration-200",
              isOpen
                ? "border-brand-200 bg-brand-50"
                : "border-slate-200 bg-white hover:border-brand-200"
            )}
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  "text-sm sm:text-base font-semibold leading-snug",
                  isOpen ? "text-brand-700" : "text-slate-800"
                )}
              >
                {item.q}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                  isOpen ? "rotate-180 text-brand-500" : "text-slate-400"
                )}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-4">
                <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
