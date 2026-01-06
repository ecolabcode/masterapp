import { Injectable, signal } from '@angular/core';
import { ToastItem, ToastType } from './toast.model';

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

@Injectable({ providedIn: 'root' })
export class ToastStore {
  toasts = signal<ToastItem[]>([]);

  show(type: ToastType, message: string, ttlMs = 3500) {
    const id = uid();
    this.toasts.update((arr) => [...arr, { id, type, message }]);

    window.setTimeout(() => {
      this.toasts.update((arr) => arr.filter((t) => t.id !== id));
    }, ttlMs);
  }

  success(msg: string) {
    this.show('success', msg);
  }
  error(msg: string) {
    this.show('error', msg, 4500);
  }
  info(msg: string) {
    this.show('info', msg);
  }

  dismiss(id: string) {
    this.toasts.update((arr) => arr.filter((t) => t.id !== id));
  }
}
