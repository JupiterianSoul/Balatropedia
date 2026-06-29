import type { ComponentType, ReactNode } from "react";

/**
 * Standard description box shown at the top of a tab. Matches the Build Lab /
 * Score Calculator visual pattern: rounded card with an icon, an h2 title,
 * and a short xs-size description paragraph below.
 */
export function TabIntro({
  Icon,
  title,
  children,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  );
}
