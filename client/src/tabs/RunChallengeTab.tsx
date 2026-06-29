import { Swords } from "lucide-react";
import { RunChallengePanel } from "@/components/RunChallenge";
import { useT } from "@/lib/i18n";
import { TabIntro } from "@/components/TabIntro";

export function RunChallengeTab() {
  const t = useT();
  return (
    <div className="space-y-4">
      <TabIntro Icon={Swords} title={t("ui.challenge.title")}>
        {t("ui.challenge.intro")}
      </TabIntro>
      <RunChallengePanel />
    </div>
  );
}
