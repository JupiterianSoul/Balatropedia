/**
 * Inline loading fallback used while a lazy()'d tab chunk downloads.
 *
 * Kept deliberately cheap: pure CSS, no animation library, no sprite work.
 * It renders 8 skeleton card slots so the layout doesn't jump when the real
 * tab pops in. On a fresh APK cold-start this is the first thing the user
 * sees after the Home tab paints, so it has to be lightweight.
 */
export function TabLoader() {
  return (
    <div
      className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-3 md:grid-cols-4"
      aria-label="Loading"
      data-testid="tab-loader"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-md border-2 border-black/40 bg-[hsl(178_14%_18%)]"
        />
      ))}
    </div>
  );
}
