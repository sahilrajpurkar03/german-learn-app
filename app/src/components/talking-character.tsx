"use client";

export type MascotMood = "idle" | "happy" | "sad";

interface Props {
  speaking: boolean;
  mood?: MascotMood;
  bubbleText?: string | null;
  onClick?: () => void;
  label?: string;
  size?: "md" | "lg";
}

// "Fritz" the fox — an SVG face so eyes/mouth can animate independently
// (blink while idle, flap while talking, react with mood after each answer)
export function TalkingCharacter({ speaking, mood = "idle", bubbleText, onClick, label = "Play audio", size = "md" }: Props) {
  const dims = size === "lg" ? "h-32 w-32" : "h-24 w-24";
  const bodyAnimation =
    mood === "happy" ? "animate-mascot-happy" : mood === "sad" ? "animate-mascot-sad" : "animate-mascot-idle-bob";

  return (
    <div className="flex flex-col items-center gap-1">
      {bubbleText && (
        <div className="animate-pop-in mb-1 max-w-[12rem] rounded-2xl rounded-bl-sm bg-neutral-800 px-3 py-1.5 text-center text-sm text-neutral-100 shadow">
          {bubbleText}
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        disabled={!onClick}
        className={`group ${dims} ${bodyAnimation}`}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-lg transition-transform group-hover:scale-105 group-active:scale-95">
          <defs>
            <linearGradient id="fox-fur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>

          <polygon points="20,25 32,4 40,32" fill="url(#fox-fur)" />
          <polygon points="80,25 68,4 60,32" fill="url(#fox-fur)" />
          <polygon points="24,24 30,12 34,28" fill="#fff7ed" />
          <polygon points="76,24 70,12 66,28" fill="#fff7ed" />

          <circle cx="50" cy="55" r="38" fill="url(#fox-fur)" />
          <ellipse cx="50" cy="66" rx="20" ry="14" fill="#fff7ed" />
          <ellipse cx="50" cy="58" ry="3" rx="3.5" fill="#3f2a1d" />

          <ellipse className="animate-blink" cx="36" cy="50" rx="5.5" ry={mood === "happy" ? 2 : 6.5} fill="#1c1917" />
          <ellipse className="animate-blink" cx="64" cy="50" rx="5.5" ry={mood === "happy" ? 2 : 6.5} fill="#1c1917" />

          {mood === "sad" && (
            <>
              <path d="M28 42 q6 -6 13 -2" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M72 42 q-6 -6 -13 -2" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {mood === "happy" ? (
            <path d="M38 66 q12 14 24 0" stroke="#7c2d12" strokeWidth="3" fill="#fecaca" strokeLinecap="round" />
          ) : mood === "sad" ? (
            <path d="M40 72 q10 -8 20 0" stroke="#7c2d12" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <ellipse
              className={speaking ? "animate-mascot-talk" : ""}
              cx="50"
              cy="68"
              rx="7"
              ry={speaking ? 5 : 2}
              fill="#7c2d12"
            />
          )}
        </svg>
      </button>
      <span className="flex h-4 items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full bg-orange-400 transition-opacity ${speaking ? "opacity-100 animate-pulse" : "opacity-0"}`}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
