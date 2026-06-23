import { RunChallengePanel } from "@/components/RunChallenge";
import { useT } from "@/lib/i18n";

export function RunChallengeTab() {
  const t = useT();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-pixel text-xl text-accent">{t("ui.challenge.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("ui.challenge.intro")}</p>
      </div>
      <RunChallengePanel />
    </div>
  );
}
