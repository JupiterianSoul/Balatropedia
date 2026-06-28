import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, ShoppingCart, Lock, Package, Sparkles, Info, Target, BookOpen } from "lucide-react";
import type { ReproStep, ReproductionPlan } from "@/lib/seedReproduction";
import { buildReproductionPlan } from "@/lib/seedReproduction";
import type { SeedMatch } from "@/lib/seedFinder";

const KIND_ICON: Record<ReproStep["kind"], JSX.Element> = {
  unlock:        <Lock className="h-4 w-4 text-amber-300" />,
  setup:         <BookOpen className="h-4 w-4 text-blue-300" />,
  ante:          <Target className="h-4 w-4 text-purple-300" />,
  shop:          <ShoppingCart className="h-4 w-4 text-emerald-300" />,
  buy:           <Sparkles className="h-4 w-4 text-yellow-300" />,
  "reroll-warn": <AlertTriangle className="h-4 w-4 text-orange-400" />,
  pack:          <Package className="h-4 w-4 text-pink-300" />,
  "skip-warn":   <AlertTriangle className="h-4 w-4 text-orange-400" />,
  consumable:    <Sparkles className="h-4 w-4 text-cyan-300" />,
  rule:          <Info className="h-4 w-4 text-zinc-300" />,
  result:        <Target className="h-4 w-4 text-emerald-300" />,
};

function StepRow({ step }: { step: ReproStep }) {
  return (
    <div className="flex items-start gap-2 py-1.5 text-xs">
      <div className="mt-0.5 shrink-0">{KIND_ICON[step.kind]}</div>
      <div className="flex-1">
        <div className="text-zinc-200">{step.text}</div>
        {step.hint && (
          <div className="text-[10px] text-zinc-500 italic mt-0.5">{step.hint}</div>
        )}
      </div>
    </div>
  );
}

export function SeedReproductionPanel({
  match,
  preset,
}: {
  match: SeedMatch;
  preset: { deck: string; stake: string; version: string };
}) {
  const [open, setOpen] = useState(false);
  const plan: ReproductionPlan = buildReproductionPlan(match, preset);

  const antes = Object.keys(plan.perAnteSteps).map(Number).sort((a, b) => a - b);

  return (
    <div className="rounded-md border border-zinc-700/60 bg-zinc-950/60 mt-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-900/60 transition"
        data-sprite=""
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <BookOpen className="h-3.5 w-3.5 text-yellow-300" />
        How to reproduce this seed — step by step
        <span className="ml-auto text-[10px] text-zinc-500 font-normal">
          {antes.length} ante{antes.length === 1 ? "" : "s"}, {plan.globalRules.length + Object.values(plan.perAnteSteps).reduce((s, a) => s + a.length, 0)} steps
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-zinc-800/80">
          {/* Global rules / setup */}
          <section className="pt-2">
            <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Setup &amp; preconditions</h4>
            <div className="space-y-0.5">
              {plan.globalRules.map((s, i) => <StepRow key={i} step={s} />)}
            </div>
          </section>

          {/* Per-ante steps */}
          {antes.map(ante => (
            <section key={ante}>
              <h4 className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold mb-1">
                Ante {ante}
              </h4>
              <div className="space-y-0.5 border-l border-purple-500/30 pl-2">
                {plan.perAnteSteps[ante].map((s, i) => <StepRow key={i} step={s} />)}
              </div>
            </section>
          ))}

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <section className="rounded-md border border-amber-500/30 bg-amber-950/15 p-2">
              <h4 className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Important caveats
              </h4>
              <ul className="space-y-1 text-[11px] text-amber-100/80 list-disc pl-4">
                {plan.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
