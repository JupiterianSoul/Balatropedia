import { useEffect } from "react";
import { burstConfetti } from "@/lib/confetti";
import { useToast } from "@/hooks/use-toast";

const KONAMI = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "b","a",
];

// Listens for two hidden inputs:
//   1) The classic Konami code -> chip-blue confetti burst.
//   2) Typing "balatro" anywhere -> red mult confetti burst.
// Both ignore typing inside <input>, <textarea>, contenteditable.
export function EasterEggsProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    let konami: string[] = [];
    let buffer = "";
    let bufferTimer: number | undefined;

    function isTyping(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (target.isContentEditable) return true;
      return false;
    }

    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target)) return;

      // Konami
      const next = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      konami.push(next);
      if (konami.length > KONAMI.length) konami.shift();
      if (KONAMI.every((k, i) => konami[i] === k)) {
        konami = [];
        burstConfetti({ count: 110, originY: -5 });
        toast({
          title: "Joker unlocked.",
          description: "30 lives. Up Up Down Down Left Right Left Right B A.",
        });
        return;
      }

      // Word buffer: detect "balatro"
      if (e.key.length === 1) {
        buffer += e.key.toLowerCase();
        if (buffer.length > 20) buffer = buffer.slice(-20);
        if (buffer.endsWith("balatro")) {
          buffer = "";
          burstConfetti({ count: 60, originY: 0 });
          toast({
            title: "+5 Mult",
            description: "You typed the magic word.",
          });
        }
        // reset buffer after 3s of no keys
        if (bufferTimer) window.clearTimeout(bufferTimer);
        bufferTimer = window.setTimeout(() => { buffer = ""; }, 3000);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (bufferTimer) window.clearTimeout(bufferTimer);
    };
  }, [toast]);

  return <>{children}</>;
}
