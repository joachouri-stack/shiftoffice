"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FAQ } from "./faq-data";


export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-or text-sm font-bold uppercase tracking-[0.16em]">
            FAQ
          </p>
          <h2 className="font-display text-noir mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Les questions fréquentes
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="border-or/20 overflow-hidden rounded-xl border bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="hover:bg-creme/60 flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors"
                >
                  <span className="font-display text-noir font-bold">
                    {item.q}
                  </span>
                  <Plus
                    size={20}
                    className={`text-or shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-gris px-5 pb-5 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
