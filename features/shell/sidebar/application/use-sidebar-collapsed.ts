import { useCallback, useSyncExternalStore } from "react";
import { SIDEBAR_COLLAPSED_KEY } from "../domain/nav-registry";

/*
 * Per-user preference that survives reloads → localStorage via a hook.
 * useSyncExternalStore renders `false` on the server and during hydration,
 * then the stored value, so there is no hydration mismatch.
 */

const CHANGE_EVENT = "shell:sidebar-collapsed";

function read(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false; // private browsing / blocked storage
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!read()));
    } catch {
      // ignore — the preference just won't persist
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { collapsed, toggle };
}
