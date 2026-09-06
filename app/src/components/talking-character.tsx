"use client";

interface Props {
  speaking: boolean;
  onClick?: () => void;
  label?: string;
}

// a friendly mascot ("Fuchsi" the fox) that visibly talks while German audio plays,
// so listening exercises feel like a conversation instead of a bare audio button
export function TalkingCharacter({ speaking, onClick, label = "Play audio" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group mx-auto flex flex-col items-center gap-2"
    >
      <span
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-5xl shadow-lg transition-transform ${
          speaking ? "animate-bounce" : "group-hover:scale-105"
        }`}
      >
        <span className={speaking ? "animate-pulse" : ""}>🦊</span>
      </span>
      <span className="flex h-4 items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full bg-orange-400 transition-opacity ${speaking ? "opacity-100 animate-pulse" : "opacity-0"}`}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </button>
  );
}
