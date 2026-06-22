#!/usr/bin/env python3
"""Merge new i18n keys into ui_en/ui_fr/ui_es.json under the `ui` namespace.
Run from the balatro-app directory."""
import json, os

BASE = "client/src/data/i18n"

# New keys. Structure: { section: { key: {en, fr, es} } }
DATA = {
    "auth": {
        "session_note": {
            "en": "Sessions don't persist across page reloads — sign in again after refresh.",
            "fr": "Les sessions ne persistent pas après un rechargement — reconnectez-vous après actualisation.",
            "es": "Las sesiones no persisten al recargar la página — vuelve a iniciar sesión tras actualizar.",
        },
        "welcome_back": {"en": "Welcome back", "fr": "Content de vous revoir", "es": "Bienvenido de nuevo"},
        "signed_in": {"en": "Signed in successfully.", "fr": "Connexion réussie.", "es": "Sesión iniciada correctamente."},
        "signin_failed": {"en": "Sign in failed", "fr": "Échec de la connexion", "es": "Error al iniciar sesión"},
        "account_created": {"en": "Account created", "fr": "Compte créé", "es": "Cuenta creada"},
        "youre_signed_in": {"en": "You're signed in.", "fr": "Vous êtes connecté.", "es": "Has iniciado sesión."},
        "create_failed": {"en": "Could not create account", "fr": "Impossible de créer le compte", "es": "No se pudo crear la cuenta"},
        "something_wrong": {"en": "Something went wrong.", "fr": "Une erreur s'est produite.", "es": "Algo salió mal."},
    },
    "btn": {
        "clear_all": {"en": "Clear all", "fr": "Tout effacer", "es": "Borrar todo"},
        "save_run": {"en": "Save run", "fr": "Sauvegarder la partie", "es": "Guardar partida"},
        "roll_shop": {"en": "Roll Shop", "fr": "Relancer la boutique", "es": "Girar tienda"},
    },
    "common": {
        "saving": {"en": "Saving…", "fr": "Sauvegarde…", "es": "Guardando…"},
        "cancel": {"en": "Cancel", "fr": "Annuler", "es": "Cancelar"},
        "remove": {"en": "Remove", "fr": "Retirer", "es": "Quitar"},
        "all": {"en": "All", "fr": "Tous", "es": "Todos"},
    },
    # Enum / game-terminology labels (match official Balatro FR/ES where possible)
    "labels": {
        # roles
        "role_chips": {"en": "Chips", "fr": "Jetons", "es": "Fichas"},
        "role_flat_mult": {"en": "Flat Mult", "fr": "Mult fixe", "es": "Mult fijo"},
        "role_xmult": {"en": "XMult", "fr": "XMult", "es": "XMult"},
        "role_retrigger": {"en": "Retrigger", "fr": "Redéclenchement", "es": "Reactivación"},
        "role_economy": {"en": "Economy", "fr": "Économie", "es": "Economía"},
        "role_consistency": {"en": "Consistency", "fr": "Régularité", "es": "Consistencia"},
        "role_discard_support": {"en": "Discard Support", "fr": "Soutien défausse", "es": "Apoyo de descarte"},
        "role_hand_size": {"en": "Hand Size", "fr": "Taille de main", "es": "Tamaño de mano"},
        "role_held_in_hand": {"en": "Held in Hand", "fr": "Gardée en main", "es": "Retenida en mano"},
        "role_suit_support": {"en": "Suit Support", "fr": "Soutien couleur", "es": "Apoyo de palo"},
        "role_rank_face_support": {"en": "Rank / Face", "fr": "Rang / Figure", "es": "Rango / Figura"},
        "role_deck_manipulation": {"en": "Deck Manipulation", "fr": "Manipulation du deck", "es": "Manipulación del mazo"},
        "role_deck_growth": {"en": "Deck Growth", "fr": "Croissance du deck", "es": "Crecimiento del mazo"},
        "role_enhancement_interaction": {"en": "Enhancement", "fr": "Amélioration", "es": "Mejora"},
        "role_destroy_value": {"en": "Destroy Value", "fr": "Valeur de destruction", "es": "Valor de destrucción"},
        "role_scaling_engine": {"en": "Scaling Engine", "fr": "Moteur d'évolution", "es": "Motor de escalado"},
        "role_payoff": {"en": "Payoff", "fr": "Récompense", "es": "Recompensa"},
        "role_enabler": {"en": "Enabler", "fr": "Activateur", "es": "Habilitador"},
        "role_pivot": {"en": "Pivot", "fr": "Pivot", "es": "Pivote"},
        # scaling
        "scaling_static": {"en": "Static", "fr": "Statique", "es": "Estático"},
        "scaling_linear": {"en": "Linear", "fr": "Linéaire", "es": "Lineal"},
        "scaling_multiplicative": {"en": "Multiplicative", "fr": "Multiplicatif", "es": "Multiplicativo"},
        "scaling_exponential": {"en": "Exponential", "fr": "Exponentiel", "es": "Exponencial"},
        "scaling_conditional": {"en": "Conditional", "fr": "Conditionnel", "es": "Condicional"},
        # hand types (match Balatro poker hand names)
        "hand_high_card": {"en": "High Card", "fr": "Carte haute", "es": "Carta alta"},
        "hand_pair": {"en": "Pair", "fr": "Paire", "es": "Pareja"},
        "hand_two_pair": {"en": "Two Pair", "fr": "Double paire", "es": "Doble pareja"},
        "hand_three_of_a_kind": {"en": "Three of a Kind", "fr": "Brelan", "es": "Trío"},
        "hand_straight": {"en": "Straight", "fr": "Suite", "es": "Escalera"},
        "hand_flush": {"en": "Flush", "fr": "Couleur", "es": "Color"},
        "hand_full_house": {"en": "Full House", "fr": "Full", "es": "Full"},
        "hand_four_of_a_kind": {"en": "Four of a Kind", "fr": "Carré", "es": "Póker"},
        "hand_straight_flush": {"en": "Straight Flush", "fr": "Quinte flush", "es": "Escalera de color"},
        "hand_any": {"en": "Any", "fr": "Toute main", "es": "Cualquiera"},
        # stage
        "stage_early": {"en": "Early", "fr": "Début", "es": "Inicio"},
        "stage_mid": {"en": "Mid", "fr": "Milieu", "es": "Medio"},
        "stage_late": {"en": "Late", "fr": "Fin", "es": "Final"},
        # level
        "level_low": {"en": "Low", "fr": "Faible", "es": "Bajo"},
        "level_med": {"en": "Med", "fr": "Moyen", "es": "Medio"},
        "level_high": {"en": "High", "fr": "Élevé", "es": "Alto"},
        # rarity (official Balatro terms)
        "rarity_common": {"en": "Common", "fr": "Commun", "es": "Común"},
        "rarity_uncommon": {"en": "Uncommon", "fr": "Peu commun", "es": "Poco común"},
        "rarity_rare": {"en": "Rare", "fr": "Rare", "es": "Raro"},
        "rarity_legendary": {"en": "Legendary", "fr": "Légendaire", "es": "Legendario"},
        # synergy kinds
        "synergy_core_pair": {"en": "Core Pair", "fr": "Paire centrale", "es": "Pareja central"},
        "synergy_strong_support": {"en": "Strong Support", "fr": "Soutien fort", "es": "Apoyo fuerte"},
        "synergy_conditional": {"en": "Conditional", "fr": "Conditionnel", "es": "Condicional"},
        "synergy_archetype_only": {"en": "Archetype Only", "fr": "Archétype uniquement", "es": "Solo arquetipo"},
        "synergy_risky_explosive": {"en": "Risky but Explosive", "fr": "Risqué mais explosif", "es": "Arriesgado pero explosivo"},
        "synergy_trap_unless_enabled": {"en": "Trap unless Enabled", "fr": "Piège sauf si activé", "es": "Trampa salvo si se activa"},
        # engines
        "engine_retrigger": {"en": "retrigger", "fr": "redéclenchement", "es": "reactivación"},
        "engine_xmult_stack": {"en": "xmult stack", "fr": "cumul xmult", "es": "acumulación xmult"},
        "engine_deck_manipulation": {"en": "deck manipulation", "fr": "manipulation du deck", "es": "manipulación del mazo"},
        "engine_consistency": {"en": "consistency", "fr": "régularité", "es": "consistencia"},
        "engine_economy": {"en": "economy", "fr": "économie", "es": "economía"},
        "engine_face_card": {"en": "face card", "fr": "carte figure", "es": "carta de figura"},
        "engine_discard_volume": {"en": "discard volume", "fr": "volume de défausse", "es": "volumen de descarte"},
        "engine_enhancement": {"en": "enhancement", "fr": "amélioration", "es": "mejora"},
        "engine_suit_unification": {"en": "suit unification", "fr": "unification de couleur", "es": "unificación de palo"},
        "engine_scaling": {"en": "scaling", "fr": "évolution", "es": "escalado"},
        # risk prefix
        "risk_prefix": {"en": "Risk", "fr": "Risque", "es": "Riesgo"},
    },
    "filters": {
        "rarity": {"en": "Rarity", "fr": "Rareté", "es": "Rareza"},
        "role": {"en": "Role", "fr": "Rôle", "es": "Rol"},
        "archetype": {"en": "Archetype", "fr": "Archétype", "es": "Arquetipo"},
        "hand_type": {"en": "Hand type", "fr": "Type de main", "es": "Tipo de mano"},
        "scaling": {"en": "Scaling", "fr": "Évolution", "es": "Escalado"},
        "build_stage": {"en": "Build stage", "fr": "Phase de build", "es": "Fase de construcción"},
        "risk_level": {"en": "Risk level", "fr": "Niveau de risque", "es": "Nivel de riesgo"},
        "filters": {"en": "Filters", "fr": "Filtres", "es": "Filtros"},
        "all_tiers": {"en": "All tiers", "fr": "Tous les paliers", "es": "Todos los niveles"},
    },
    "tabs": {
        # Library
        "library_search_ph": {"en": "Search Jokers by name, effect, or note…", "fr": "Rechercher des Jokers par nom, effet ou note…", "es": "Buscar Jokers por nombre, efecto o nota…"},
        "library_sort_name": {"en": "Sort: Name (A–Z)", "fr": "Tri : Nom (A–Z)", "es": "Orden: Nombre (A–Z)"},
        "library_sort_beginner": {"en": "Sort: Beginner-friendly", "fr": "Tri : Accessible aux débutants", "es": "Orden: Apto para principiantes"},
        "library_sort_setup": {"en": "Sort: Setup difficulty", "fr": "Tri : Difficulté de mise en place", "es": "Orden: Dificultad de preparación"},
        "library_sort_synergy": {"en": "Sort: Synergy density", "fr": "Tri : Densité de synergie", "es": "Orden: Densidad de sinergia"},
        "library_sort_rarity": {"en": "Sort: Rarity (rare first)", "fr": "Tri : Rareté (rares d'abord)", "es": "Orden: Rareza (raros primero)"},
        "library_result_count": {"en": "{{shown}} of {{total}} Jokers", "fr": "{{shown}} sur {{total}} Jokers", "es": "{{shown}} de {{total}} Jokers"},
        "library_empty": {"en": "No Jokers match these filters. Try clearing some pills.", "fr": "Aucun Joker ne correspond à ces filtres. Essayez d'enlever des filtres.", "es": "Ningún Joker coincide con estos filtros. Prueba a quitar algunos."},
        # MyRun
        "myrun_title": {"en": "My Run", "fr": "Ma partie", "es": "Mi partida"},
        "myrun_subtitle": {"en": "Pick a deck, stake and vouchers, then watch synergies light up in real time.", "fr": "Choisissez un deck, une mise et des bons, puis regardez les synergies s'activer en temps réel.", "es": "Elige un mazo, una apuesta y cupones, y observa cómo las sinergias se activan en tiempo real."},
        "myrun_slots": {"en": "Slots", "fr": "Emplacements", "es": "Espacios"},
        "myrun_add_ph": {"en": "Add a Joker to your run…", "fr": "Ajouter un Joker à votre partie…", "es": "Añadir un Joker a tu partida…"},
        "myrun_full_ph": {"en": "Run is full — raise slots to add", "fr": "Partie pleine — augmentez les emplacements pour ajouter", "es": "Partida llena — aumenta los espacios para añadir"},
        "myrun_run_full": {"en": "Run is full", "fr": "Partie pleine", "es": "Partida llena"},
        "myrun_already_in": {"en": "Already in run", "fr": "Déjà dans la partie", "es": "Ya está en la partida"},
        "myrun_full_desc": {"en": "Increase the slot cap above {{cap}} to add more.", "fr": "Augmentez la limite d'emplacements au-delà de {{cap}} pour en ajouter.", "es": "Aumenta el límite de espacios por encima de {{cap}} para añadir más."},
        "myrun_name_required": {"en": "Name required", "fr": "Nom requis", "es": "Nombre obligatorio"},
        "myrun_run_saved": {"en": "Run saved", "fr": "Partie sauvegardée", "es": "Partida guardada"},
        "myrun_save_failed": {"en": "Could not save run", "fr": "Impossible de sauvegarder la partie", "es": "No se pudo guardar la partida"},
        "myrun_run_loaded": {"en": "Run loaded", "fr": "Partie chargée", "es": "Partida cargada"},
        "myrun_sign_in_save": {"en": "Sign in to save", "fr": "Connectez-vous pour sauvegarder", "es": "Inicia sesión para guardar"},
        "myrun_empty_slot": {"en": "Empty slot", "fr": "Emplacement vide", "es": "Espacio vacío"},
        "myrun_active_synergies": {"en": "Active synergies", "fr": "Synergies actives", "es": "Sinergias activas"},
        "myrun_no_synergies": {"en": "No curated synergies yet. Add two jokers that pair up.", "fr": "Aucune synergie pour l'instant. Ajoutez deux jokers qui se complètent.", "es": "Aún no hay sinergias. Añade dos jokers que combinen."},
        "myrun_implied_arch": {"en": "Implied archetypes", "fr": "Archétypes suggérés", "es": "Arquetipos implícitos"},
        "myrun_no_arch": {"en": "Add 2+ core pieces of an archetype to imply a direction.", "fr": "Ajoutez 2+ pièces centrales d'un archétype pour suggérer une direction.", "es": "Añade 2+ piezas clave de un arquetipo para sugerir una dirección."},
        "myrun_anti_warnings": {"en": "Anti-synergy warnings", "fr": "Avertissements d'anti-synergie", "es": "Avisos de anti-sinergia"},
        "myrun_no_conflicts": {"en": "No conflicts in this build.", "fr": "Aucun conflit dans ce build.", "es": "Sin conflictos en esta build."},
        "myrun_save_title": {"en": "Save this run", "fr": "Sauvegarder cette partie", "es": "Guardar esta partida"},
        "myrun_run_name": {"en": "Run name", "fr": "Nom de la partie", "es": "Nombre de la partida"},
        "myrun_run_name_ph": {"en": "e.g. Face-card spiral", "fr": "ex. Spirale de figures", "es": "p. ej. Espiral de figuras"},
        "myrun_notes_optional": {"en": "Notes (optional)", "fr": "Notes (facultatif)", "es": "Notas (opcional)"},
        "myrun_saved_runs": {"en": "Saved runs", "fr": "Parties sauvegardées", "es": "Partidas guardadas"},
        "myrun_no_saved": {"en": "No saved runs yet.", "fr": "Aucune partie sauvegardée.", "es": "Aún no hay partidas guardadas."},
        "myrun_snapshot": {"en": "{{count}} jokers in this snapshot", "fr": "{{count}} jokers dans cet instantané", "es": "{{count}} jokers en esta instantánea"},
        "myrun_snapshot_one": {"en": "{{count}} joker in this snapshot", "fr": "{{count}} joker dans cet instantané", "es": "{{count}} joker en esta instantánea"},
        "myrun_deck_set": {"en": "deck set", "fr": "deck défini", "es": "mazo definido"},
        "myrun_stake_set": {"en": "stake set", "fr": "mise définie", "es": "apuesta definida"},
        # Compare
        "compare_role": {"en": "Role", "fr": "Rôle", "es": "Rol"},
        "compare_scaling": {"en": "Scaling", "fr": "Évolution", "es": "Escalado"},
        "compare_setup_difficulty": {"en": "Setup difficulty", "fr": "Difficulté de mise en place", "es": "Dificultad de preparación"},
        "compare_archetype_fit": {"en": "Archetype fit", "fr": "Affinité d'archétype", "es": "Afinidad de arquetipo"},
        "compare_early_value": {"en": "Early-game value", "fr": "Valeur en début de partie", "es": "Valor en el inicio"},
        "compare_late_ceiling": {"en": "Late-game ceiling", "fr": "Potentiel en fin de partie", "es": "Techo en el final"},
        "compare_reliability": {"en": "Reliability", "fr": "Fiabilité", "es": "Fiabilidad"},
        "compare_best_partners": {"en": "Best partners", "fr": "Meilleurs partenaires", "es": "Mejores compañeros"},
        "compare_main_risks": {"en": "Main risks", "fr": "Risques principaux", "es": "Riesgos principales"},
        "compare_select_hint": {"en": "Select 2–4 Jokers to compare side by side.", "fr": "Sélectionnez 2 à 4 Jokers à comparer côte à côte.", "es": "Selecciona de 2 a 4 Jokers para compararlos."},
        "compare_add_two": {"en": "Add at least two Jokers to start comparing.", "fr": "Ajoutez au moins deux Jokers pour commencer la comparaison.", "es": "Añade al menos dos Jokers para empezar a comparar."},
        "compare_none": {"en": "None listed", "fr": "Aucun listé", "es": "Ninguno"},
        # Heatmap
        "heatmap_title": {"en": "Synergy Heatmap", "fr": "Carte de chaleur des synergies", "es": "Mapa de calor de sinergias"},
        "heatmap_pick": {"en": "Pick a Joker…", "fr": "Choisir un Joker…", "es": "Elige un Joker…"},
        "heatmap_neg_first": {"en": "Negatives first", "fr": "Négatifs d'abord", "es": "Negativos primero"},
        "heatmap_pos_first": {"en": "Positives first", "fr": "Positifs d'abord", "es": "Positivos primero"},
        "heatmap_scale": {"en": "Scale:", "fr": "Échelle :", "es": "Escala:"},
        "heatmap_clash": {"en": "Clash", "fr": "Conflit", "es": "Conflicto"},
        "heatmap_neutral": {"en": "Neutral", "fr": "Neutre", "es": "Neutral"},
        "heatmap_empty": {"en": "Select a Joker to build the heatmap.", "fr": "Sélectionnez un Joker pour générer la carte de chaleur.", "es": "Selecciona un Joker para generar el mapa de calor."},
        # Favorites
        "fav_sign_in_note": {"en": "Sign in to save favorites permanently. Right now they only last this session.", "fr": "Connectez-vous pour sauvegarder vos favoris durablement. Pour l'instant, ils ne durent que cette session.", "es": "Inicia sesión para guardar favoritos de forma permanente. Por ahora solo duran esta sesión."},
        "fav_add_saved_note": {"en": "Add a saved note…", "fr": "Ajouter une note enregistrée…", "es": "Añadir una nota guardada…"},
        "fav_add_session_note": {"en": "Add a note (session only)…", "fr": "Ajouter une note (session uniquement)…", "es": "Añadir una nota (solo esta sesión)…"},
        # Shop
        "shop_title": {"en": "Shop", "fr": "Boutique", "es": "Tienda"},
        "shop_added": {"en": "Added to My Run", "fr": "Ajouté à Ma partie", "es": "Añadido a Mi partida"},
        "shop_already": {"en": "Already in your run", "fr": "Déjà dans votre partie", "es": "Ya está en tu partida"},
        "shop_run_full": {"en": "Run is full", "fr": "Partie pleine", "es": "Partida llena"},
        # Decks
        "decks_title": {"en": "Decks", "fr": "Decks", "es": "Mazos"},
        "decks_set": {"en": "Deck set in My Run", "fr": "Deck défini dans Ma partie", "es": "Mazo definido en Mi partida"},
        "decks_sort_by": {"en": "Sort by", "fr": "Trier par", "es": "Ordenar por"},
        "decks_sort_name": {"en": "Name", "fr": "Nom", "es": "Nombre"},
        "decks_sort_difficulty": {"en": "Difficulty", "fr": "Difficulté", "es": "Dificultad"},
        "decks_recommended": {"en": "Recommended jokers", "fr": "Jokers recommandés", "es": "Jokers recomendados"},
        # Vouchers
        "vouchers_title": {"en": "Vouchers", "fr": "Bons", "es": "Cupones"},
        "vouchers_upgrades_to": {"en": "upgrades to", "fr": "s'améliore en", "es": "mejora a"},
    },
    "sheet": {
        "why_play": {"en": "Why play this?", "fr": "Pourquoi le jouer ?", "es": "¿Por qué jugarlo?"},
        "role_in_build": {"en": "Role in a build", "fr": "Rôle dans un build", "es": "Papel en una build"},
        "strong_weak": {"en": "Why it's strong / weak / conditional", "fr": "Pourquoi il est fort / faible / conditionnel", "es": "Por qué es fuerte / débil / condicional"},
        "best_partners": {"en": "Best partners", "fr": "Meilleurs partenaires", "es": "Mejores compañeros"},
        "no_partners": {"en": "No curated partners listed.", "fr": "Aucun partenaire listé.", "es": "No hay compañeros listados."},
        "anti_synergies": {"en": "Anti-synergies", "fr": "Anti-synergies", "es": "Anti-sinergias"},
        "example_use": {"en": "Example use cases", "fr": "Exemples d'utilisation", "es": "Casos de uso"},
        "for_new_players": {"en": "For new players", "fr": "Pour les nouveaux joueurs", "es": "Para nuevos jugadores"},
        "your_note_fav": {"en": "Your note (saved with favorite)", "fr": "Votre note (enregistrée avec le favori)", "es": "Tu nota (guardada con el favorito)"},
        "your_note_fav_ph": {"en": "Save a strategy note (kept with your favorite)…", "fr": "Enregistrez une note de stratégie (gardée avec votre favori)…", "es": "Guarda una nota de estrategia (junto a tu favorito)…"},
        "your_note": {"en": "Your note", "fr": "Votre note", "es": "Tu nota"},
        "star_to_note": {"en": "Star this Joker to attach a saved note.", "fr": "Mettez ce Joker en favori pour y joindre une note.", "es": "Marca este Joker como favorito para adjuntar una nota."},
        "your_note_session": {"en": "Your note (session only)", "fr": "Votre note (session uniquement)", "es": "Tu nota (solo esta sesión)"},
        "your_note_session_ph": {"en": "Jot a strategy note for this Joker…", "fr": "Notez une stratégie pour ce Joker…", "es": "Anota una estrategia para este Joker…"},
        "sign_in_save_notes": {"en": "Sign in to save notes permanently.", "fr": "Connectez-vous pour sauvegarder les notes durablement.", "es": "Inicia sesión para guardar notas de forma permanente."},
        "primarily_a": {"en": "Primarily a", "fr": "Principalement une pièce", "es": "Principalmente una pieza"},
        "piece": {"en": "piece", "fr": "", "es": ""},
        "with_a": {"en": "with a", "fr": "avec un angle", "es": "con un enfoque"},
        "angle": {"en": "angle", "fr": "", "es": ""},
        "it_triggers_on": {"en": "It triggers on", "fr": "Il se déclenche sur", "es": "Se activa con"},
        "and_provides": {"en": "and provides", "fr": "et apporte de la valeur en", "es": "y aporta valor de"},
        "value_to_build": {"en": "value to a build.", "fr": "à un build.", "es": "a una build."},
    },
}


def merge():
    for loc in ["en", "fr", "es"]:
        path = os.path.join(BASE, f"ui_{loc}.json")
        with open(path) as f:
            d = json.load(f)
        ui = d["ui"]
        for section, keys in DATA.items():
            ui.setdefault(section, {})
            for k, vals in keys.items():
                ui[section][k] = vals[loc]
        with open(path, "w") as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    merge()
