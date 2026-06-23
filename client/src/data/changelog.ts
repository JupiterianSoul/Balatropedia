// Shared changelog source. WhatsNewTab renders the full list,
// HomeTab renders only ENTRIES[0] as a "latest update" card.
// Reverse-chronological, newest first. Dates intentionally omitted.

export type ChangelogKind = "feature" | "data" | "fix" | "polish" | "community" | "nav";

export interface ChangelogEntry {
  version: string;
  kind: ChangelogKind;
  titleKey: string;
  bullets: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v1.4",
    kind: "feature",
    titleKey: "ui.whatsnew.v1_4.title",
    bullets: [
      "ui.whatsnew.v1_4.home_rebuild",
      "ui.whatsnew.v1_4.menu_bg",
      "ui.whatsnew.v1_4.crt",
      "ui.whatsnew.v1_4.conveyors",
      "ui.whatsnew.v1_4.search_first",
      "ui.whatsnew.v1_4.discover",
      "ui.whatsnew.v1_4.updates_rename",
    ],
  },
  {
    version: "v1.3",
    kind: "feature",
    titleKey: "ui.whatsnew.v1_3.title",
    bullets: [
      "ui.whatsnew.v1_3.home_redesign",
      "ui.whatsnew.v1_3.auto_signin",
      "ui.whatsnew.v1_3.particles",
      "ui.whatsnew.v1_3.easter_eggs",
      "ui.whatsnew.v1_3.no_emdash",
      "ui.whatsnew.v1_3.whatsnew_dates",
    ],
  },
  {
    version: "v1.2",
    kind: "nav",
    titleKey: "ui.whatsnew.v1_2.title",
    bullets: [
      "ui.whatsnew.v1_2.home_tab",
      "ui.whatsnew.v1_2.run_group",
      "ui.whatsnew.v1_2.jokers_in_game",
      "ui.whatsnew.v1_2.tier_variants",
      "ui.whatsnew.v1_2.tier_disclaimer",
      "ui.whatsnew.v1_2.tier_blank_row",
    ],
  },
  {
    version: "v1.1",
    kind: "feature",
    titleKey: "ui.whatsnew.v1_1.title",
    bullets: [
      "ui.whatsnew.v1_1.tierlist",
      "ui.whatsnew.v1_1.runchallenge",
      "ui.whatsnew.v1_1.searcheffects",
      "ui.whatsnew.v1_1.colorcoding",
      "ui.whatsnew.v1_1.mobileback",
      "ui.whatsnew.v1_1.mobilesearch",
      "ui.whatsnew.v1_1.og",
    ],
  },
  {
    version: "v1.0.3",
    kind: "data",
    titleKey: "ui.whatsnew.v1_0_3.title",
    bullets: [
      "ui.whatsnew.v1_0_3.syn60",
      "ui.whatsnew.v1_0_3.combos16",
      "ui.whatsnew.v1_0_3.arch7",
      "ui.whatsnew.v1_0_3.ranking",
      "ui.whatsnew.v1_0_3.backfill",
    ],
  },
  {
    version: "v1.0.2",
    kind: "community",
    titleKey: "ui.whatsnew.v1_0_2.title",
    bullets: [
      "ui.whatsnew.v1_0_2.reddit",
      "ui.whatsnew.v1_0_2.kofi",
      "ui.whatsnew.v1_0_2.hardening",
    ],
  },
  {
    version: "v1.0.1",
    kind: "polish",
    titleKey: "ui.whatsnew.v1_0_1.title",
    bullets: [
      "ui.whatsnew.v1_0_1.sounds",
      "ui.whatsnew.v1_0_1.shop",
      "ui.whatsnew.v1_0_1.comments",
    ],
  },
];
