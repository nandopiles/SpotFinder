import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MapSyncService {
  readonly hoveredSpotId = signal<string | null>(null);
  readonly selectedSpotId = signal<string | null>(null);

  hoverSpot(id: string | null): void {
    this.hoveredSpotId.set(id);
  }

  selectSpot(id: string | null): void {
    this.selectedSpotId.set(id);
  }
}
