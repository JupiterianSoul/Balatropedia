
import { Trash2, Library, Upload, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchCard } from "./SeedFinderTab";
import { useSeedTabState, deleteSavedSeed, setFinder } from "@/lib/seedTabState";
import type { SavedSeed } from "@/lib/seedTabState";
import { useT } from "@/lib/i18n";

function PresetBadge({ s }: { s: SavedSeed }) {
  const t = useT();
  const date = new Date(s.savedAt);
  const dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex flex-wrap items-baseline gap-3 text-xs text-zinc-400 mb-1">
      <span><span className="text-zinc-500">{t("ui.seedlibrary.deck")} </span><span className="text-zinc-200">{s.preset.deck}</span></span>
      <span><span className="text-zinc-500">{t("ui.seedlibrary.stake")} </span><span className="text-zinc-200">{s.preset.stake}</span></span>
      <span><span className="text-zinc-500">{t("ui.seedlibrary.version")} </span><span className="text-zinc-200">{s.preset.version}</span></span>
      <span><span className="text-zinc-500">{t("ui.seedlibrary.max_ante")} </span><span className="text-zinc-200">{s.preset.globalMaxAnte}</span></span>
      <span><span className="text-zinc-500">{t("ui.seedlibrary.constraints")} </span><span className="text-zinc-200">{s.preset.jokerConstraints.length}</span></span>
      <span className="ml-auto text-[10px] text-zinc-500">{dateStr}</span>
    </div>
  );
}

export function SeedLibraryTab() {
  const t = useT();
  const library = useSeedTabState(s => s.library);

  function loadIntoFinder(s: SavedSeed) {
    setFinder({
      deck: s.preset.deck,
      stake: s.preset.stake,
      version: s.preset.version,
      globalMaxAnte: s.preset.globalMaxAnte,
      selected: s.preset.jokerConstraints,
    });
  }

  if (library.length === 0) {
    return (
      <div className="rounded-lg border border-yellow-500/15 bg-zinc-950/40 p-8 text-center">
        <Library className="h-10 w-10 mx-auto mb-3 text-zinc-600" />
        <div className="text-sm text-zinc-400 font-semibold">{t("ui.seedlibrary.no_saved")}</div>
        <div
          className="text-xs text-zinc-500 mt-1 max-w-md mx-auto"
          dangerouslySetInnerHTML={{ __html: t("ui.seedlibrary.empty_help") }}
        />
      </div>
    );
  }

  const sorted = [...library].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-500">
        {t("ui.seedlibrary.saved_count", { n: String(library.length) })}
      </div>
      {sorted.map((s) => (
        <div key={s.id} className="space-y-1">
          <PresetBadge s={s} />
          <MatchCard
            match={s.match}
            showSave={false}
            trailing={
              <div className="ml-auto flex items-center gap-1">
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 text-xs"
                  onClick={() => navigator.clipboard?.writeText(s.seed)}
                  title={t("ui.seedlibrary.copy_seed")}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" /> {t("ui.seedlibrary.copy")}
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 text-xs text-yellow-300"
                  onClick={() => loadIntoFinder(s)}
                  title={t("ui.seedlibrary.load_into")}
                >
                  <Upload className="mr-1 h-3.5 w-3.5" /> {t("ui.seedlibrary.load_preset")}
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                  onClick={() => deleteSavedSeed(s.id)}
                  title={t("ui.seedlibrary.delete")}
                  data-testid={`delete-saved-${s.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            }
          />
        </div>
      ))}
    </div>
  );
}
