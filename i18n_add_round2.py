#!/usr/bin/env python3
"""Round-2 i18n: add UI-chrome keys for the tabs/components that still had
hardcoded English. Injects into ui_en/fr/es.json under new namespaces.
Idempotent: only sets keys that are missing or updates to the provided value.
"""
import json, collections

BASE = "client/src/data/i18n"

# key -> (en, fr, es)
NEW = {
    # ── Skeleton tab ──────────────────────────────────────────────
    "ui.skel.your_selected": ("Your selected Jokers", "Vos Jokers sélectionnés", "Tus Jokers seleccionados"),
    "ui.skel.add_up_to": ("Add up to 6 Jokers to diagnose your run skeleton.",
                          "Ajoutez jusqu'à 6 Jokers pour diagnostiquer le squelette de votre partie.",
                          "Añade hasta 6 Jokers para diagnosticar el esqueleto de tu partida."),
    "ui.skel.select_some": ("Select some Jokers to see a transparent, rule-based skeleton analysis.",
                            "Sélectionnez des Jokers pour voir une analyse de squelette transparente, basée sur des règles.",
                            "Selecciona algunos Jokers para ver un análisis de esqueleto transparente basado en reglas."),
    "ui.skel.diagnosis": ("Diagnosis", "Diagnostic", "Diagnóstico"),
    "ui.skel.what_you_have": ("What you have", "Ce que vous avez", "Lo que tienes"),
    "ui.skel.no_pieces": ("No recognized engine pieces yet.",
                          "Aucune pièce de moteur reconnue pour l'instant.",
                          "Aún no hay piezas de motor reconocidas."),
    "ui.skel.what_missing": ("What you're missing", "Ce qui vous manque", "Lo que te falta"),
    "ui.skel.nothing_all_covered": ("Nothing — all six engine categories are covered.",
                                    "Rien — les six catégories de moteur sont couvertes.",
                                    "Nada — las seis categorías de motor están cubiertas."),
    "ui.skel.suggested_next": ("Suggested next Joker type", "Prochain type de Joker suggéré", "Próximo tipo de Joker sugerido"),
    "ui.skel.biggest_gap_pre": ("Your biggest gap is", "Votre plus grande lacune est", "Tu mayor carencia es"),
    "ui.skel.biggest_gap_post": (". Consider one of these:", ". Envisagez l'un de ceux-ci :", ". Considera uno de estos:"),
    "ui.skel.no_candidates": ("No additional candidates outside your current selection.",
                              "Aucun candidat supplémentaire en dehors de votre sélection actuelle.",
                              "No hay candidatos adicionales fuera de tu selección actual."),
    "ui.skel.why_pre": ("Why this analysis?", "Pourquoi cette analyse ?", "¿Por qué este análisis?"),
    "ui.skel.why_hide": ("Hide", "Masquer", "Ocultar"),
    "ui.skel.why_show": ("Show", "Afficher", "Mostrar"),
    "ui.skel.why_post": ("the rules that fired", "les règles déclenchées", "las reglas que se activaron"),
    "ui.skel.no_rules": ("No diagnostic rules fired — the build is still developing.",
                         "Aucune règle de diagnostic déclenchée — le build est encore en développement.",
                         "No se activó ninguna regla de diagnóstico — el build aún se está desarrollando."),
    "ui.skel.remove_aria": ("Remove", "Retirer", "Quitar"),
    # diagnoses
    "ui.skel.dx_incomplete": ("Incomplete — add more pieces to evaluate.",
                              "Incomplet — ajoutez plus de pièces pour évaluer.",
                              "Incompleto — añade más piezas para evaluar."),
    "ui.skel.dx_too_narrow": ("Too narrow", "Trop étroit", "Demasiado estrecho"),
    "ui.skel.dx_too_slow": ("Too slow", "Trop lent", "Demasiado lento"),
    "ui.skel.dx_too_conditional": ("Too conditional", "Trop conditionnel", "Demasiado condicional"),
    "ui.skel.dx_well_rounded": ("Well-rounded", "Bien équilibré", "Equilibrado"),
    "ui.skel.dx_developing": ("Developing — covers some engine categories but has gaps.",
                              "En développement — couvre certaines catégories de moteur mais comporte des lacunes.",
                              "En desarrollo — cubre algunas categorías de motor pero tiene lagunas."),
    # rules
    "ui.skel.rule_narrow": ("All selected Jokers share a single archetype → the build is too narrow.",
                            "Tous les Jokers sélectionnés partagent un seul archétype → le build est trop étroit.",
                            "Todos los Jokers seleccionados comparten un solo arquetipo → el build es demasiado estrecho."),
    "ui.skel.rule_slow": ("Every selected Joker is late-stage only → the build is too slow to come online.",
                          "Chaque Joker sélectionné est uniquement de fin de partie → le build est trop lent à se mettre en place.",
                          "Cada Joker seleccionado es solo de etapa tardía → el build tarda demasiado en activarse."),
    "ui.skel.rule_conditional": ("Average setup difficulty is high → the build is too conditional.",
                                 "La difficulté de mise en place moyenne est élevée → le build est trop conditionnel.",
                                 "La dificultad media de preparación es alta → el build es demasiado condicional."),
    "ui.skel.rule_rounded": ("Covers {{n}} engine categories (≥4) → the build is well-rounded.",
                             "Couvre {{n}} catégories de moteur (≥4) → le build est bien équilibré.",
                             "Cubre {{n}} categorías de motor (≥4) → el build está equilibrado."),

    # ── Stakes tab ────────────────────────────────────────────────
    "ui.stakes.title": ("Stakes", "Mises", "Apuestas"),
    "ui.stakes.subtitle": ("8 difficulty tiers. Each stake adds a permanent modifier on top of the last.",
                           "8 niveaux de difficulté. Chaque mise ajoute un modificateur permanent par-dessus le précédent.",
                           "8 niveles de dificultad. Cada apuesta añade un modificador permanente sobre el anterior."),
    "ui.stakes.cumulative": ("Cumulative modifiers", "Modificateurs cumulatifs", "Modificadores acumulativos"),
    "ui.stakes.tier": ("Tier", "Niveau", "Nivel"),
    "ui.stakes.modifiers": ("Modifiers", "Modificateurs", "Modificadores"),
    "ui.stakes.inherited": ("Inherited from lower stakes", "Hérité des mises inférieures", "Heredado de apuestas inferiores"),
    "ui.stakes.watch_out": ("Watch out", "Attention", "Cuidado"),

    # ── Consumables tab ───────────────────────────────────────────
    "ui.cons.title": ("Consumables", "Consommables", "Consumibles"),
    "ui.cons.subtitle": ("Tarots, Planets, and Spectral cards — and the jokers they pair with.",
                         "Tarots, Planètes et cartes Spectrales — et les Jokers avec lesquels elles s'associent.",
                         "Tarots, Planetas y cartas Espectrales — y los Jokers con los que se combinan."),
    "ui.cons.tab_tarots": ("Tarots", "Tarots", "Tarots"),
    "ui.cons.tab_planets": ("Planets", "Planètes", "Planetas"),
    "ui.cons.tab_spectrals": ("Spectrals", "Spectrales", "Espectrales"),
    "ui.cons.search_tarots": ("Search Tarots…", "Rechercher des Tarots…", "Buscar Tarots…"),
    "ui.cons.search_planets": ("Search Planets…", "Rechercher des Planètes…", "Buscar Planetas…"),
    "ui.cons.search_spectrals": ("Search Spectrals…", "Rechercher des Spectrales…", "Buscar Espectrales…"),
    "ui.cons.when_to_use": ("When to use", "Quand l'utiliser", "Cuándo usar"),
    "ui.cons.best_with": ("Best with", "Idéal avec", "Mejor con"),
    "ui.cons.sequencing": ("Sequencing", "Séquençage", "Secuenciación"),
    "ui.cons.buffs": ("Buffs", "Améliore", "Mejora"),
    "ui.cons.per_level": ("+{{chips}} chips / +{{mult}} mult per level",
                          "+{{chips}} jetons / +{{mult}} mult par niveau",
                          "+{{chips}} fichas / +{{mult}} mult por nivel"),
    "ui.cons.cat_card_modify": ("Card Modify", "Modif. de carte", "Modif. de carta"),
    "ui.cons.cat_economy": ("Economy", "Économie", "Economía"),
    "ui.cons.cat_scaling": ("Scaling", "Mise à l'échelle", "Escalado"),
    "ui.cons.cat_utility": ("Utility", "Utilitaire", "Utilidad"),
    "ui.cons.cat_consumable_gen": ("Consumable Gen", "Génération de consommables", "Generación de consumibles"),

    # ── Modifiers tab ─────────────────────────────────────────────
    "ui.mods.title": ("Modifiers", "Modificateurs", "Modificadores"),
    "ui.mods.subtitle": ("Enhancements, editions, seals, and skip tags that shape your deck and economy.",
                         "Améliorations, éditions, sceaux et étiquettes qui façonnent votre deck et votre économie.",
                         "Mejoras, ediciones, sellos y etiquetas que dan forma a tu mazo y economía."),
    "ui.mods.tab_enhancements": ("Enhancements", "Améliorations", "Mejoras"),
    "ui.mods.tab_editions": ("Editions", "Éditions", "Ediciones"),
    "ui.mods.tab_seals": ("Seals", "Sceaux", "Sellos"),
    "ui.mods.tab_tags": ("Tags", "Étiquettes", "Etiquetas"),
    "ui.mods.trigger": ("Trigger", "Déclencheur", "Activador"),

    # ── Archetypes tab ────────────────────────────────────────────
    "ui.arch.enablers": ("Enablers", "Activateurs", "Habilitadores"),
    "ui.arch.scalers": ("Scalers", "Amplificateurs", "Escaladores"),
    "ui.arch.bait": ("Bait — looks good, usually isn't", "Pièges — semble bon, mais rarement", "Cebo — parece bueno, pero rara vez lo es"),
    "ui.arch.often_lacks": ("Often lacks", "Manque souvent de", "A menudo carece de"),

    # ── Boss blinds tab ───────────────────────────────────────────
    "ui.boss.title": ("Boss Blinds", "Blinds de Boss", "Ciegas de Jefe"),
    "ui.boss.subtitle": ("All 28 boss blinds, what they do, and how to beat them. The four Finals appear only at Ante 8.",
                         "Les 28 blinds de boss, ce qu'ils font et comment les battre. Les quatre Finales n'apparaissent qu'à l'Ante 8.",
                         "Las 28 ciegas de jefe, qué hacen y cómo vencerlas. Las cuatro Finales solo aparecen en el Ante 8."),
    "ui.boss.counter_strategy": ("Counter strategy", "Stratégie de contre", "Estrategia de contra"),
    "ui.boss.jokers_help": ("Jokers that help", "Jokers qui aident", "Jokers que ayudan"),

    # ── Combos tab ────────────────────────────────────────────────
    "ui.combos.count": ("{{n}} curated combos", "{{n}} combos sélectionnés", "{{n}} combos seleccionados"),
    "ui.combos.all_archetypes": ("All archetypes", "Tous les archétypes", "Todos los arquetipos"),
    "ui.combos.core_pieces": ("Core pieces", "Pièces principales", "Piezas principales"),
    "ui.combos.optional_supports": ("Optional supports", "Supports optionnels", "Apoyos opcionales"),
    "ui.combos.conditions": ("Conditions", "Conditions", "Condiciones"),
    "ui.combos.risks": ("Risks", "Risques", "Riesgos"),
    "ui.combos.why_works": ("Why it works", "Pourquoi ça marche", "Por qué funciona"),
    "ui.combos.pivot_out": ("When to pivot out", "Quand bifurquer", "Cuándo cambiar de rumbo"),

    # ── Synergy tab ───────────────────────────────────────────────
    "ui.syn.select_joker": ("Select a Joker", "Sélectionnez un Joker", "Selecciona un Joker"),
    "ui.syn.connection": ("connection", "connexion", "conexión"),
    "ui.syn.connections": ("connections", "connexions", "conexiones"),
    "ui.syn.curated": ("curated", "sélectionnée(s)", "seleccionada(s)"),
    "ui.syn.legend": ("Legend", "Légende", "Leyenda"),
    "ui.syn.no_synergies": ("No curated synergies for this Joker yet. Check the Library for general role tags.",
                            "Aucune synergie sélectionnée pour ce Joker pour l'instant. Consultez la Bibliothèque pour les rôles généraux.",
                            "Aún no hay sinergias seleccionadas para este Joker. Consulta la Biblioteca para ver roles generales."),

    # ── Glossary tab ──────────────────────────────────────────────
    "ui.gloss.rarity_term": ("Rarity", "Rareté", "Rareza"),
    "ui.gloss.rarity_def": ("Jokers come in four rarities — Common, Uncommon, Rare, Legendary. Higher rarities appear less often in the shop and have stronger or more complex effects. Legendaries can only appear from The Soul card.",
                            "Les Jokers existent en quatre raretés — Commun, Peu commun, Rare, Légendaire. Les raretés supérieures apparaissent moins souvent dans la boutique et ont des effets plus puissants ou plus complexes. Les Légendaires ne peuvent apparaître qu'à partir de la carte L'Âme.",
                            "Los Jokers tienen cuatro rarezas — Común, Poco común, Raro, Legendario. Las rarezas superiores aparecen con menos frecuencia en la tienda y tienen efectos más potentes o complejos. Los Legendarios solo pueden aparecer de la carta El Alma."),

    # ── Run meta selectors (component) ────────────────────────────
    "ui.runmeta.deck": ("Deck", "Deck", "Mazo"),
    "ui.runmeta.stake": ("Stake", "Mise", "Apuesta"),
    "ui.runmeta.select_stake": ("Select a stake…", "Choisir une mise…", "Elegir una apuesta…"),
    "ui.runmeta.none": ("None", "Aucune", "Ninguna"),
    "ui.runmeta.active_vouchers": ("Active vouchers", "Bons actifs", "Cupones activos"),
    "ui.runmeta.add_voucher": ("Add voucher", "Ajouter un bon", "Añadir cupón"),
    "ui.runmeta.search_vouchers": ("Search vouchers…", "Rechercher des bons…", "Buscar cupones…"),
    "ui.runmeta.no_voucher": ("No voucher found.", "Aucun bon trouvé.", "No se encontró ningún cupón."),
    "ui.runmeta.no_vouchers_yet": ("No vouchers added yet.", "Aucun bon ajouté pour l'instant.", "Aún no se han añadido cupones."),
    "ui.runmeta.remove_voucher": ("Remove {{name}}", "Retirer {{name}}", "Quitar {{name}}"),

    # ── Joker combobox (component) ────────────────────────────────
    "ui.combobox.select_joker": ("Select a Joker…", "Choisir un Joker…", "Elegir un Joker…"),
    "ui.combobox.search_jokers": ("Search Jokers…", "Rechercher des Jokers…", "Buscar Jokers…"),
    "ui.combobox.no_joker": ("No Joker found.", "Aucun Joker trouvé.", "No se encontró ningún Joker."),
    "ui.combobox.add_joker": ("Add Joker", "Ajouter un Joker", "Añadir Joker"),

    # ── User button (component) ───────────────────────────────────
    "ui.user.sign_in": ("Sign in", "Se connecter", "Iniciar sesión"),
    "ui.user.sign_out": ("Sign out", "Se déconnecter", "Cerrar sesión"),
    "ui.user.signed_out": ("Signed out", "Déconnecté", "Sesión cerrada"),
}


def set_path(obj, dotted, value):
    parts = dotted.split(".")
    cur = obj
    for p in parts[:-1]:
        cur = cur.setdefault(p, {})
    cur[parts[-1]] = value


for idx, lang in enumerate(("en", "fr", "es")):
    path = f"{BASE}/ui_{lang}.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=collections.OrderedDict)
    for key, vals in NEW.items():
        set_path(data, key, vals[idx])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"updated {path}: +{len(NEW)} keys ensured")

print("done")
