export function closeWithModalTransition(event, callback) {
  const backdrop = event?.currentTarget?.closest?.("[class*='backdrop']");
  if (!backdrop || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    callback?.(event);
    return;
  }

  if (backdrop.classList.contains("is-closing")) return;
  backdrop.classList.add("is-closing");
  window.setTimeout(() => callback?.(event), 160);
}
