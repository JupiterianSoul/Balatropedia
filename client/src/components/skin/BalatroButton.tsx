/**
 * BalatroButton — chunky pill button with 5px solid drop shadow,
 * shimmer-sweep hover, press-down on active.
 *
 * Variants: red, blue, gold, holo.
 * Plays a `uiTap()` synth blip on click (respects user sound toggle).
 */
import * as React from "react";
import { uiTap, haptic } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export type BalatroButtonVariant = "red" | "blue" | "gold" | "holo";

export interface BalatroButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BalatroButtonVariant;
  size?: "sm" | "md" | "lg";
}

export const BalatroButton = React.forwardRef<HTMLButtonElement, BalatroButtonProps>(
  ({ variant = "red", size = "md", className, onClick, children, ...rest }, ref) => {
    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
      uiTap();
      haptic(8);
      onClick?.(e);
    }
    return (
      <button
        ref={ref}
        className={cn(
          "balatro-btn",
          `balatro-btn-${variant}`,
          `balatro-btn-${size}`,
          className,
        )}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
BalatroButton.displayName = "BalatroButton";
