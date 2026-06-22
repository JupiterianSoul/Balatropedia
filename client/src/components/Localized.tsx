import { ReactNode } from "react";
import { useGameText, useI18n } from "@/lib/i18n";
import { FormattedBalatroText } from "@/lib/balatroText";

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

  raw?: boolean;
}): ReactNode {
  const { text } = useGameText(category, id);
  const { lang } = useI18n();
  const value = text || fallback || "";
  const Tag = as as any;
  if (raw || !FORMATTED_CATEGORIES.has(category)) {
    return <Tag className={className}>{value}</Tag>;
  }
  return (
    <Tag className={className}>
      <FormattedBalatroText text={value} id={id} lang={lang} />
    </Tag>
  );
}

