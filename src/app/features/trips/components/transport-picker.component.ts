import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { TransportMode } from '../../../core/models/trip.model';
import { LegOptions } from '../../../core/services/routing.service';

const MODE_META: Record<TransportMode, { label: string; icon: string }> = {
  walking: { label: 'A pie',      icon: '🚶' },
  cycling: { label: 'Bici',       icon: '🚲' },
  transit: { label: 'Transporte', icon: '🚆' },
  driving: { label: 'Coche',      icon: '🚗' },
};

const MODE_ORDER: TransportMode[] = ['walking', 'cycling', 'transit', 'driving'];

@Component({
  selector: 'app-transport-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-xl border border-surface-border bg-surface-muted p-2">
      <!-- Opciones -->
      <div class="grid grid-cols-4 gap-1">
        @for (m of orderedModes(); track m.mode) {
          <button
            type="button"
            class="flex flex-col items-center gap-0.5 py-1.5 rounded-lg border transition-all duration-150"
            [class.border-transparent]="active() !== m.mode"
            [class.bg-transparent]="active() !== m.mode"
            [style.borderColor]="active() === m.mode ? color() : 'transparent'"
            [style.background]="active() === m.mode ? color() + '1a' : 'transparent'"
            (click)="select.emit(m.mode)"
            [title]="labelOf(m.mode)"
          >
            <span class="text-base leading-none relative">
              {{ iconOf(m.mode) }}
              @if (m.mode === recommended()) {
                <span class="absolute -top-1 -right-2 text-[8px]">⭐</span>
              }
            </span>
            <span class="text-2xs font-semibold tabular"
                  [style.color]="active() === m.mode ? color() : 'var(--color-ink-muted)'">
              {{ minutesOf(m.mode) }}′
            </span>
          </button>
        }
      </div>

      <!-- Motivo de la recomendación -->
      <p class="text-2xs text-ink-muted mt-1.5 px-0.5 flex items-center gap-1 leading-tight">
        <span class="shrink-0">⭐</span>
        <span>
          Recomendado: <strong class="text-ink-secondary">{{ labelOf(recommended()) }}</strong> · {{ reason() }}
        </span>
      </p>
    </div>
  `,
})
export class TransportPickerComponent {
  readonly leg     = input.required<LegOptions>();
  readonly active  = input.required<TransportMode>();
  readonly color   = input<string>('#6366f1');
  readonly select  = output<TransportMode>();

  readonly recommended = computed(() => this.leg().recommended);
  readonly reason      = computed(() => this.leg().reason);

  readonly orderedModes = computed(() => {
    const opts = this.leg().options;
    return MODE_ORDER
      .map(mode => opts.find(o => o.mode === mode))
      .filter((o): o is NonNullable<typeof o> => !!o);
  });

  labelOf(mode: TransportMode): string { return MODE_META[mode].label; }
  iconOf(mode: TransportMode): string { return MODE_META[mode].icon; }

  minutesOf(mode: TransportMode): number {
    const sec = this.leg().options.find(o => o.mode === mode)?.duration ?? 0;
    return Math.max(1, Math.round(sec / 60));
  }
}
