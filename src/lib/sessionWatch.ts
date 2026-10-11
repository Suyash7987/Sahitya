const WATCH_KEY = "__sahityaSessionWatch";

function watchStore(): { count: number } | null {
  if (typeof window === "undefined") return null;
  const target = window as Window & { [WATCH_KEY]?: { count: number } };
  target[WATCH_KEY] ??= { count: 0 };
  return target[WATCH_KEY];
}

export function pauseSessionWatch() {
  const store = watchStore();
  if (store) store.count += 1;
}

export function sessionWatchGeneration() {
  return watchStore()?.count ?? 0;
}
