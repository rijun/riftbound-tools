export type Toast = { id: number; kind: 'info' | 'error'; message: string };

let nextId = 1;
const toasts = $state<Toast[]>([]);

export function getToasts(): Toast[] {
  return toasts;
}

export function addToast(t: Omit<Toast, 'id'>): void {
  const id = nextId++;
  toasts.push({ ...t, id });
  setTimeout(() => {
    const i = toasts.findIndex((x) => x.id === id);
    if (i >= 0) toasts.splice(i, 1);
  }, 5000);
}
