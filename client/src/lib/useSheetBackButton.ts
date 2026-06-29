import { useEffect, useRef } from "react";

/**
 * When the sheet opens, push a `{ sheet: tag }` entry onto history.
 * When the OS / hardware back button fires, the browser pops that
 * entry, popstate fires, and we close the sheet instead of
 * navigating tabs (Home.tsx popstate handler reads the tab from
 * location.hash and only acts on tab entries, so a `sheet:` state
 * deliberately has no tab key).
 *
 * On Android Capacitor, the hardware back gesture maps to the same
 * popstate flow because we are running inside a WebView; no special
 * Capacitor App.addListener call is needed.
 */
export function useSheetBackButton(isOpen: boolean, onClose: () => void, tag = "sheet") {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined") return;

    // Push a sentinel state so the next back press lands here.
    try {
      window.history.pushState({ sheet: tag }, "", window.location.href);
      pushedRef.current = true;
    } catch {}

    function onPop(e: PopStateEvent) {
      // If our sheet entry is being popped, close without recursing.
      // We don't push another entry; the user is mid-back-navigation.
      pushedRef.current = false;
      onClose();
    }

    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      // Sheet closed via X / overlay click while our entry is still on
      // the stack. Roll it back so the URL/state stays clean.
      if (pushedRef.current) {
        try {
          const st = window.history.state;
          if (st && st.sheet === tag) {
            window.history.back();
          }
        } catch {}
        pushedRef.current = false;
      }
    };
  }, [isOpen, onClose, tag]);
}
