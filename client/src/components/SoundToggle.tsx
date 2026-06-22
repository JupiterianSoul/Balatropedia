import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, setSoundEnabled, playSound } from "@/lib/sound";

export function SoundToggle() {
  const [on, setOn] = useState(isSoundEnabled());

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={() => on && playSound("hover")}
      className="balatro-sound-toggle"
      aria-label={on ? "Mute sounds" : "Enable sounds"}
      title={on ? "Mute sounds" : "Enable sounds"}
      data-testid="button-sound-toggle"
    >
      {on ? (
        <Volume2 className="h-4 w-4" strokeWidth={2.5} />
      ) : (
        <VolumeX className="h-4 w-4" strokeWidth={2.5} />
      )}
    </button>
  );
}

