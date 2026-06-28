/**
 * BevelCard — beveled white card with 4px black border + 2px inset
 * white + 6px solid drop shadow. Optional edition overlay that is
 * masked to the card-art alpha (foil/holo/negative/poly).
 *
 * Use:
 *   <BevelCard art="/sprites/Joker__e_ef.png" name="JOKER" edition="holo" rarity="legendary" />
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export type BevelEdition = "foil" | "holo" | "negative" | "poly" | null;
export type BevelRarity = "common" | "uncommon" | "rare" | "legendary";

export interface BevelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  art: string;
  name: string;
  edition?: BevelEdition;
  rarity?: BevelRarity;
  dealIndex?: number;
}

export const BevelCard = React.forwardRef<HTMLDivElement, BevelCardProps>(
  ({ art, name, edition = null, rarity = "common", dealIndex, className, style, ...rest }, ref) => {
    const editionClass = edition ? `bal-card-edition-${edition}` : "";
    const rarityClass = `bal-card-rarity-${rarity}`;
    const dealStyle: React.CSSProperties | undefined =
      typeof dealIndex === "number"
        ? {
            // Stagger deal-in animation by index
            animationDelay: `${0.05 + dealIndex * 0.08}s, ${0.6 + dealIndex * 0.15}s`,
          }
        : undefined;
    return (
      <div
        ref={ref}
        className={cn("bal-card", rarityClass, editionClass, className)}
        style={{ ...dealStyle, ...style }}
        {...rest}
      >
        <div className="bal-card-art-wrap">
          <div
            className="bal-card-art"
            style={{ backgroundImage: `url('${art}')` }}
          />
          {edition && (
            <div
              className="bal-card-edition-overlay"
              style={{ ["--mask" as any]: `url('${art}')` }}
              aria-hidden="true"
            />
          )}
        </div>
        <div className="bal-card-name">{name}</div>
      </div>
    );
  },
);
BevelCard.displayName = "BevelCard";
