import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivitySpot, ReorderSpotsDto } from '../../../core/models/trip.model';
import { SpotCardComponent } from './spot-card.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [DragDropModule, SpotCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (spots().length) {
      <!-- Section header -->
      <div class="flex items-center justify-between mb-4 px-1">
        <p class="section-title">{{ spots().length }} parada{{ spots().length !== 1 ? 's' : '' }}</p>
        <p class="text-2xs text-ink-faint">Arrastra para reordenar</p>
      </div>
    }

    <div
      cdkDropList
      class="flex flex-col gap-0"
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (spot of spots(); track spot.id; let last = $last) {
        <div cdkDrag [cdkDragData]="spot">

          <div class="animate-slide-in-left"
               [style.animation-delay]="$index * 40 + 'ms'">

          <app-spot-card
            [spot]="spot"
            [isSelected]="selectedSpotId() === spot.id"
            [isHovered]="hoveredSpotId() === spot.id"
            (hover)="hover.emit($event)"
            (select)="select.emit($event)"
          />
          </div>

          <!-- Connector between spots -->
          @if (!last) {
            <div class="flex items-stretch ml-[22px] my-0.5 gap-3">
              <div class="flex flex-col items-center w-7">
                <div class="w-0.5 flex-1 bg-gradient-to-b from-surface-border-strong to-surface-border"></div>
              </div>
              <div class="flex items-center py-1">
                <span class="text-2xs text-ink-faint font-medium">↓</span>
              </div>
            </div>
          }

          <!-- CDK placeholder -->
          <ng-template cdkDragPlaceholder>
            <div class="h-[72px] rounded-2xl border-2 border-dashed border-primary-500/30
                        bg-primary-500/5 mx-0 my-0.5 flex items-center justify-center">
              <p class="text-xs text-primary-400 font-medium">Soltar aquí</p>
            </div>
          </ng-template>
        </div>

      } @empty {
        <div class="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
          <div class="w-16 h-16 rounded-2xl bg-surface-subtle flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-ink-secondary mb-1">Sin paradas</p>
          <p class="text-xs text-ink-muted">Añade lugares a tu itinerario</p>
        </div>
      }
    </div>
  `,
})
export class TimelineComponent {
  readonly spots = input.required<ActivitySpot[]>();
  readonly selectedSpotId = input<string | null>(null);
  readonly hoveredSpotId = input<string | null>(null);

  readonly reorder = output<ReorderSpotsDto>();
  readonly hover = output<string | null>();
  readonly select = output<string>();

  onDrop(event: CdkDragDrop<ActivitySpot[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const items = [...this.spots()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.reorder.emit(items.map((s, i) => ({ spotId: s.id, order: i })));
  }
}
