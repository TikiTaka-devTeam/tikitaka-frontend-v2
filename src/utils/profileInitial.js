export function getProfileInitial(name) {
  return String(name ?? "").trim().slice(0, 1).toUpperCase();
}
