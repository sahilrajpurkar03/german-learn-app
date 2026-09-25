"use client";

import { useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { GripVertical, RotateCcw } from "lucide-react";
import { playEffect } from "../feedback-fx";
import { Prompt, SpeakButton, type ExerciseProps } from "./shared";

/**
 * Tap words to build the sentence. Placed words can be dragged into a new order (the others
 * make room), tapped to send them back, or moved with the arrow keys and removed with Delete.
 */
export function BuildExercise({ step, disabled, onReady, onSpeaking }: ExerciseProps) {
  const tiles = step.tiles ?? [];
  const [chosen, setChosen] = useState<number[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const order = useRef<number[]>([]);
  const nodes = useRef(new Map<number, HTMLElement>());
  const dragged = useRef(false);

  function update(next: number[]) {
    order.current = next;
    setChosen(next);
    onReady(next.length ? next.map((index) => tiles[index]).join(" ") : null);
  }

  function place(tile: number, position: number) {
    const without = order.current.filter((entry) => entry !== tile);
    const at = Math.max(0, Math.min(position, without.length));
    if (order.current.indexOf(tile) === at) return;
    update([...without.slice(0, at), tile, ...without.slice(at)]);
  }

  function remove(tile: number) {
    playEffect("tap");
    update(order.current.filter((entry) => entry !== tile));
    setAnnouncement(`${tiles[tile]} removed`);
  }

  /** While dragging, find which placed word the pointer is over and take its place. */
  function follow(tile: number, point: { x: number; y: number }) {
    const x = point.x - window.scrollX;
    const y = point.y - window.scrollY;
    for (const [position, other] of order.current.entries()) {
      if (other === tile) continue;
      const box = nodes.current.get(other)?.getBoundingClientRect();
      if (box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
        place(tile, position);
        return;
      }
    }
  }

  function onKey(event: React.KeyboardEvent, tile: number) {
    const position = order.current.indexOf(tile);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const target = position + (event.key === "ArrowLeft" ? -1 : 1);
      if (target < 0 || target >= order.current.length) return;
      place(tile, target);
      setAnnouncement(`${tiles[tile]} moved to position ${target + 1}`);
      requestAnimationFrame(() => nodes.current.get(tile)?.focus());
    } else if (event.key === "Delete" || event.key === "Backspace" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      remove(tile);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!step.speaker && <Prompt>{step.prompt}</Prompt>}
      {!step.speaker && step.text && (
        <div className="flex items-center gap-3">
          {step.audio && <SpeakButton text={step.audio} onSpeaking={onSpeaking} label="Hear the German sentence" />}
          <p className="text-xl text-ink">{step.text}</p>
        </div>
      )}
      <div aria-label="Your sentence" role="list" className="flex min-h-[4.5rem] flex-wrap content-start items-start gap-2 border-b-2 border-line pb-3">
        <AnimatePresence>
          {chosen.length === 0 && <m.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-2 text-ink-soft">Tap the words in order</m.span>}
          {chosen.map((index, position) => (
            <m.button role="listitem" layout layoutId={`tile-${step.id}-${index}`} key={index} type="button" disabled={disabled} lang="de"
              ref={(node: HTMLButtonElement | null) => { if (node) nodes.current.set(index, node); else nodes.current.delete(index); }}
              drag={!disabled} dragSnapToOrigin dragElastic={1} dragMomentum={false}
              onDragStart={() => { dragged.current = true; }}
              onDrag={(_, info) => follow(index, info.point)}
              onDragEnd={() => { setTimeout(() => { dragged.current = false; }, 0); setAnnouncement(`${tiles[index]} is word ${order.current.indexOf(index) + 1}`); }}
              whileDrag={{ scale: 1.08, zIndex: 20, boxShadow: "var(--shadow-lift)" }}
              onClick={() => { if (!dragged.current) remove(index); }}
              onKeyDown={(event) => onKey(event, index)}
              aria-label={`${tiles[index]}, word ${position + 1} of ${chosen.length}. Drag or use arrow keys to move, press Delete to remove.`}
              style={{ touchAction: "none" }}
              className="relative inline-flex min-h-12 cursor-grab items-center gap-1 rounded-xl border-2 border-line bg-surface py-2 pl-2 pr-3.5 text-lg font-medium shadow-[0_3px_0_var(--v2-line)] active:cursor-grabbing">
              <GripVertical size={14} className="text-ink-soft/60" aria-hidden="true" />{tiles[index]}
            </m.button>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap justify-center gap-2" aria-label="Word bank">
        {tiles.map((tile, index) => (
          <div key={index} className="relative min-h-12 rounded-xl bg-surface-2">
            <span className="invisible block px-3.5 py-2.5 text-lg font-medium" aria-hidden="true">{tile}</span>
            {!chosen.includes(index) && (
              <m.button layout layoutId={`tile-${step.id}-${index}`} type="button" disabled={disabled} lang="de"
                onClick={() => { playEffect("tap"); update([...order.current, index]); setAnnouncement(`${tile} added`); }}
                className="absolute inset-0 rounded-xl border-2 border-line bg-surface text-lg font-medium shadow-[0_3px_0_var(--v2-line)] hover:bg-surface-2">
                {tile}
              </m.button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 text-sm text-ink-soft">
        {chosen.length > 1 && !disabled && <span>Drag words to reorder · tap to remove</span>}
        {chosen.length > 0 && !disabled && (
          <button type="button" onClick={() => { update([]); setAnnouncement("Sentence cleared"); }} className="inline-flex items-center gap-1.5 font-semibold hover:text-brand"><RotateCcw size={15} aria-hidden="true" />Start over</button>
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  );
}
