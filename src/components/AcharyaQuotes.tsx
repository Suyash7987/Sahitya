"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  {
    text: "Good books that carry pure knowledge and elevated thoughts have the potential to transform ordinary beings into great personalities.",
    source: "On Yug Sahitya",
  },
  {
    text: "I am not a person; I am a thought.",
    source: "Thought Revolution",
  },
  {
    text: "Literature of superb quality written by me so far is equivalent to the weight of my body.",
    source: "My Life: Its Legacy and Message",
  },
  {
    text: "We will change — the era will change. We will reform ourselves — the era will be reformed.",
    source: "Yug Nirman Mission",
  },
] as const;

export function AcharyaQuotes() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % QUOTES.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const quote = QUOTES[index];

  return (
    <blockquote className="max-w-md">
      <p className="font-display text-2xl leading-snug transition-opacity duration-500 xl:text-4xl">
        “{quote.text}”
      </p>
      <footer className="mt-6 space-y-1 text-card/75">
        <p className="text-base font-medium text-card/90">
          — Pandit Shriram Sharma Acharya
        </p>
        <p className="text-sm">{quote.source}</p>
      </footer>
      <div className="mt-6 flex gap-2" aria-hidden="true">
        {QUOTES.map((item, i) => (
          <button
            key={item.text}
            type="button"
            aria-label={`Show quote ${i + 1}`}
            onClick={() => setIndex(i)}
            className={
              i === index
                ? "h-1.5 w-6 rounded-full bg-gold"
                : "h-1.5 w-1.5 rounded-full bg-card/35 hover:bg-card/55"
            }
          />
        ))}
      </div>
    </blockquote>
  );
}
