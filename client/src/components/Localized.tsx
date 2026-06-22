import { ReactNode } from "react";
import { useGameText } from "@/lib/i18n";
import { FormattedBalatroText } from "@/lib/balatroText";

/** Categories whose `text` field uses Balatro's #N# placeholder + scoring tokens. */
const FORMATTED_CATEGORIES = new Set([
  "jokers",
  "tarots",
  "planets",
  "spectrals",
  "vouchers",
  "enhancements",
  "editions",
  "seals",
  "tags",
  "blinds",
]);

/**
 * Render a game entity's localized NAME. Falls back to `fallback` (the raw EN
 * `name` field from the static dataset) when no translation exists.
 *
 * Usage:
 *   <LName category="jokers" id={j.id} fallback={j.name} />
 *
 * `category` is one of: jokers | decks | stakes | tarots | planets | spectrals
 *   | vouchers | enhancements | editions | seals | tags | blinds
 */
export function LName({
  category,
  id,
  fallback,
  as,
}: {
  category: string;
  id: string;
  fallback?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const { name } = useGameText(category, id);
  const value = name || fallback || id;
  if (!as) return <>{value}</>;
  const Tag = as as any;
  return <Tag>{value}</Tag>;
}

/**
 * Render a game entity's localized TEXT/effect/summary, with fallback to the
 * raw EN copy from the static dataset (joker.summary, voucher.effect, ...).
 *
 * Renders inside a <span> by default so it can be dropped into any layout.
 */
export function LText({
  category,
  id,
  fallback,
  className,
  as = "span",
  raw = false,
}: {
  category: string;
  id: string;
  fallback?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  /** If true, render plain text (no #N# stripping, no colorization). */
  raw?: boolean;
}): ReactNode {
  const { text } = useGameText(category, id);
  const value = text || fallback || "";
  const Tag = as as any;
  if (raw || !FORMATTED_CATEGORIES.has(category)) {
    return <Tag className={className}>{value}</Tag>;
  }
  return (
    <Tag className={className}>
      <FormattedBalatroText text={value} />
    </Tag>
  );
}
