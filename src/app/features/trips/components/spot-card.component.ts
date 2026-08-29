import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ActivitySpot, CATEGORY_META } from '../../../core/models/trip.model';

const ORDER_COLORS = [
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500',
  'bg-cyan-500',   'bg-teal-500',   'bg-emerald-500',
  'bg-amber-500',  'bg-orange-500', 'bg-rose-500',
];

@Component({
  selector: 'app-spot-card',
  standalone: true,
  imports: [DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="group relative bg-white rounded-2xl border transition-all duration-200 ease-smooth
             cursor-pointer select-none overflow-hidden"
      [class.border-surface-border]="!isSelected() && !isHovered()"
      [class.border-primary-300]="isHovered() && !isSelected()"
      [class.border-primary-500]="isSelected()"
      [class.shadow-card]="!isHovered() && !isSelected()"
      [class.shadow-card-hover]="isHovered() || isSelected()"
      [class.ring-2]="isSelected()"
      [class.ring-primary-500]="isSelected()"
      [class.ring-offset-2]="isSelected()"
      [class.-translate-y-px]="isHovered() && !isSelected()"
      (mouseenter)="hover.emit(spot().id)"
      (mouseleave)="hover.emit(null)"
      (click)="select.emit(spot().id)"
    >
      <!-- Category color strip -->
      <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl {{ categoryColor() }}"></div>

      <div class="pl-4 pr-3 py-3.5 flex items-start gap-3">

        <!-- Order number -->
        <div class="shrink-0 flex flex-col items-center gap-1 mt-0.5">
          <div class="w-7 h-7 rounded-xl {{ orderColor() }} text-white text-xs font-bold
                      flex items-center justify-center shadow-sm
                      group-hover:scale-110 transition-transform duration-200 ease-spring">
            {{ spot().order + 1 }}
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <h4 class="font-semibold text-ink text-sm leading-snug line-clamp-1">
              {{ spot().name }}
            </h4>
            <span class="badge shrink-0 {{ categoryMeta().color }} text-2xs">
              {{ categoryMeta().emoji }}
            </span>
          </div>

          <p class="text-2xs text-ink-muted truncate mb-2 flex items-center gap-1">
            <svg class="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            {{ spot().address }}
          </p>

          <!-- Time chips -->
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg
                         bg-surface-subtle text-2xs font-semibold text-ink-secondary">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ spot().startTime }}
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg
                         bg-surface-subtle text-2xs font-medium text-ink-muted">
              {{ durationLabel() }}
            </span>
          </div>

          @if (spot().notes) {
            <p class="text-2xs text-ink-faint mt-2 italic line-clamp-1">{{ spot().notes }}</p>
          }
        </div>

        <!-- Drag handle -->
        <div
          class="shrink-0 flex items-center self-stretch px-0.5
                 text-ink-faint hover:text-ink-muted cursor-grab active:cursor-grabbing
                 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          cdkDragHandle
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
          </svg>
        </div>
      </div>
    </div>
  `,
})
export class SpotCardComponent {
  readonly spot = input.required<ActivitySpot>();
  readonly isSelected = input(false);
  readonly isHovered = input(false);

  readonly hover = output<string | null>();
  readonly select = output<string>();

  readonly categoryMeta = computed(() => CATEGORY_META[this.spot().category]);

  readonly categoryColor = computed(() => ({
    food:     'bg-amber-400',
    culture:  'bg-violet-500',
    nature:   'bg-emerald-500',
    leisure:  'bg-blue-500',
    shopping: 'bg-pink-500',
  }[this.spot().category]));

  readonly orderColor = computed(() =>
    ORDER_COLORS[this.spot().order % ORDER_COLORS.length]
  );

  readonly durationLabel = computed(() => {
    const d = this.spot().duration;
    return d >= 60
      ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ''}`
      : `${d}min`;
  });
}
