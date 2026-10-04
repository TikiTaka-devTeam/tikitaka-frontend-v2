import { useLayoutEffect } from "react";

export default function usePageTransitionScrollLock(pathname, leaving) {
  useLayoutEffect(() => {
    const previousOverflowY = document.body.style.overflowY;
    document.body.style.overflowY = "hidden";
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.body.style.overflowY = previousOverflowY;
    };
    // Keep the lock through departure; release after the 160ms entrance.
    const timer = leaving ? null : window.setTimeout(restore, 180);
    return () => {
      window.clearTimeout(timer);
      restore();
    };
  }, [pathname, leaving]);
}
