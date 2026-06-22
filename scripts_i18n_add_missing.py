#!/usr/bin/env python3
"""Idempotently add the few missing UI keys referenced by primitives.tsx and tabs."""
import json, os

BASE = os.path.join(os.path.dirname(__file__), "client", "src", "data", "i18n")

# section -> key -> {en, fr, es}
ADD = {
    "favStar": {
        "remove": {"en": "Remove from favorites", "fr": "Retirer des favoris", "es": "Quitar de favoritos"},
        "add": {"en": "Add to favorites", "fr": "Ajouter aux favoris", "es": "Añadir a favoritos"},
    },
    "chip": {
        "generic_conflict": {"en": "Potential conflict", "fr": "Conflit potentiel", "es": "Conflicto potencial"},
    },
    "tabs": {
        "myrun_remove_aria": {"en": "Remove {{name}}", "fr": "Retirer {{name}}", "es": "Quitar {{name}}"},
        "myrun_delete_aria": {"en": "Delete {{name}}", "fr": "Supprimer {{name}}", "es": "Eliminar {{name}}"},
        "myrun_voucher_frag": {"en": " \u00b7 {{count}} vouchers", "fr": " \u00b7 {{count}} bons", "es": " \u00b7 {{count}} cupones"},
        "myrun_voucher_frag_one": {"en": " \u00b7 {{count}} voucher", "fr": " \u00b7 {{count}} bon", "es": " \u00b7 {{count}} cup\u00f3n"},
        "compare_conflicts_with": {"en": " \u00b7 conflicts with {{names}}", "fr": " \u00b7 en conflit avec {{names}}", "es": " \u00b7 en conflicto con {{names}}"},
        "heatmap_subtitle": {
            "en": "Pick a Joker to see how strongly it pairs with every other Joker. Gold is positive, oxblood is a clash.",
            "fr": "Choisissez un Joker pour voir la force de ses associations avec tous les autres Jokers. L'or est positif, le rouge sang est un conflit.",
            "es": "Elige un comod\u00edn para ver con qu\u00e9 fuerza combina con todos los dem\u00e1s. El oro es positivo, el rojo sangre es un choque.",
        },
        "fav_empty": {
            "en": "No favorites yet. Star Jokers and Combos to save them here. Notes are kept in this session only \u2014 they'll reset on refresh.",
            "fr": "Aucun favori pour l'instant. Ajoutez des Jokers et des combos en favoris pour les retrouver ici. Les notes ne sont gard\u00e9es que pour cette session \u2014 elles seront r\u00e9initialis\u00e9es au rechargement.",
            "es": "A\u00fan no hay favoritos. Marca Jokers y combos para guardarlos aqu\u00ed. Las notas solo se guardan en esta sesi\u00f3n: se reiniciar\u00e1n al recargar.",
        },
        "fav_jokers": {"en": "Jokers", "fr": "Jokers", "es": "Comodines"},
        "fav_combos": {"en": "Combos", "fr": "Combos", "es": "Combos"},
        "shop_subtitle": {
            "en": "Roll a shop using Balatro's rarity weights \u2014 common 70%, uncommon 25%, rare 5%.",
            "fr": "G\u00e9n\u00e9rez une boutique avec les probabilit\u00e9s de raret\u00e9 de Balatro \u2014 commun 70 %, peu commun 25 %, rare 5 %.",
            "es": "Genera una tienda usando las probabilidades de rareza de Balatro: com\u00fan 70 %, poco com\u00fan 25 %, raro 5 %.",
        },
        "shop_empty_pre": {"en": "Hit ", "fr": "Appuyez sur ", "es": "Pulsa "},
        "shop_empty_post": {
            "en": " to deal three jokers. Add the ones you like straight into My Run.",
            "fr": " pour distribuer trois jokers. Ajoutez ceux que vous aimez directement \u00e0 Ma partie.",
            "es": " para repartir tres comodines. A\u00f1ade los que te gusten directamente a Mi partida.",
        },
        "shop_in_run": {"en": "In your run", "fr": "Dans votre partie", "es": "En tu partida"},
        "shop_add_to_run": {"en": "Add to My Run", "fr": "Ajouter \u00e0 Ma partie", "es": "A\u00f1adir a Mi partida"},
        "decks_subtitle": {
            "en": "15 starting decks \u2014 pick the build engine that fits your plan.",
            "fr": "15 decks de d\u00e9part \u2014 choisissez le moteur de build qui correspond \u00e0 votre plan.",
            "es": "15 mazos iniciales: elige el motor de build que se adapte a tu plan.",
        },
        "decks_sort_prefix": {"en": "Sort: {{val}}", "fr": "Trier : {{val}}", "es": "Ordenar: {{val}}"},
        "decks_diff_low": {"en": "Low", "fr": "Faible", "es": "Baja"},
        "decks_diff_medium": {"en": "Medium", "fr": "Moyenne", "es": "Media"},
        "decks_diff_high": {"en": "High", "fr": "\u00c9lev\u00e9e", "es": "Alta"},
        "vouchers_subtitle": {
            "en": "16 voucher pairs. Buying a tier-1 voucher unlocks its tier-2 upgrade in a later shop.",
            "fr": "16 paires de bons. Acheter un bon de niveau 1 d\u00e9bloque son am\u00e9lioration de niveau 2 dans une boutique ult\u00e9rieure.",
            "es": "16 pares de cupones. Comprar un cup\u00f3n de nivel 1 desbloquea su mejora de nivel 2 en una tienda posterior.",
        },
        "vouchers_tier_label": {"en": "{{tier}}-tier", "fr": "Niveau {{tier}}", "es": "Nivel {{tier}}"},
        "vouchers_no_upgrade": {"en": "No tier-2 upgrade", "fr": "Pas d'am\u00e9lioration de niveau 2", "es": "Sin mejora de nivel 2"},
    },
}

for lang in ("en", "fr", "es"):
    path = os.path.join(BASE, f"ui_{lang}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    ui = data.setdefault("ui", {})
    for section, keys in ADD.items():
        sec = ui.setdefault(section, {})
        for k, vals in keys.items():
            sec.setdefault(k, vals[lang])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"updated ui_{lang}.json")
print("done")
