import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingStore {
  private count = signal(0);
  isLoading = computed(() => this.count() > 0);

  begin() {
    this.count.update((c) => c + 1);
  }
  end() {
    this.count.update((c) => Math.max(0, c - 1));
  }
}
