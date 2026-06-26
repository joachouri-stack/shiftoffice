"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Toggle({
  defaultChecked = false,
  label,
}: {
  defaultChecked?: boolean;
  label?: string;
}) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-brand" : "bg-line"
      )}
    >
      <span
        className={cn(
          "bg-paper inline-block h-5 w-5 transform rounded-full shadow transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
