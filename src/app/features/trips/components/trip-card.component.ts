import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Trip, TripStatus } from '../../../core/models/trip.model';

const STATUS_META: Record<TripStatus, { label: string; dot: string; badge: string }> = {
  draft:     { label: 'Borrador',    dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600' },
  planned:   { label: 'Planificado', dot: 'bg-primary-500', badge: 'bg-primary-50 text-primary-700' },
  completed: { label: 'Completado',  dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
};

// Gradiente determinista por ciudad (hash simple)
function cityGradient(city: string): string {
  const gradients = [
    'from-violet-500 via-purple-500 to-indigo-600',
    'from-rose-400 via-pink-500 to-purple-600',
    'from-amber-400 via-orange-500 to-rose-500',
    'from-teal-400 via-cyan-500 to-blue-600',
    'from-emerald-400 via-teal-500 to-cyan-600',
    'from-blue-500 via-indigo-500 to-violet-600',
  ];
  const hash = city.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="card-interactive group overflow-hidden flex flex-col"
      (click)="select.emit(trip().id)"
    >
      <!-- Card header with gradient -->
      <div class="relative h-28 bg-gradient-to-br {{ gradient() }} overflow-hidden">
        <!-- Noise texture overlay -->
        <div class="absolute inset-0 bg-noise opacity-30"></div>

        <!-- City initial -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-6xl font-black text-white/10 select-none tracking-tighter">
            {{ trip().city.slice(0, 2).toUpperCase() }}
          </span>
        </div>

        <!-- Top row -->
        <div class="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span class="badge bg-white/20 text-white backdrop-blur-sm border border-white/20">
            <span class="w-1.5 h-1.5 rounded-full {{ statusMeta().dot }}"></span>
            {{ statusMeta().label }}
          </span>
          <button
            class="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/80 backdrop-blur-sm
                   flex items-center justify-center text-white/60 hover:text-white
                   opacity-0 group-hover:opacity-100 transition-all duration-200"
            (click)="$event.stopPropagation(); delete.emit(trip().id)"
            title="Eliminar viaje"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <!-- City name -->
        <div class="absolute bottom-3 left-3">
          <p class="text-white/70 text-2xs font-semibold uppercase tracking-widest">
            {{ trip().date | date:'EEE, d MMM':'':'es' }}
          </p>
        </div>
      </div>

      <!-- Card body -->
      <div class="flex-1 p-4 flex flex-col gap-3">
        <div>
          <h3 class="font-bold text-ink text-base leading-snug group-hover:text-primary-700
                     transition-colors duration-150 line-clamp-1">
            {{ trip().title }}
          </h3>
          <p class="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
            <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            {{ trip().city }}
          </p>
        </div>

        <!-- Stats row -->
        <div class="flex items-center gap-3 pt-1 border-t border-surface-border">
          <div class="flex items-center gap-1.5 text-xs text-ink-muted">
            <div class="w-5 h-5 rounded-lg bg-primary-50 flex items-center justify-center">
              <svg class="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
            </div>
            <span><strong class="text-ink font-semibold">{{ trip().spots.length }}</strong> paradas</span>
          </div>

          @if (trip().legs.length) {
            <div class="flex items-center gap-1.5 text-xs text-ink-muted">
              <div class="w-5 h-5 rounded-lg bg-accent-50 flex items-center justify-center">
                <svg class="w-3 h-3 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
              <span><strong class="text-ink font-semibold">{{ trip().legs.length }}</strong> tramos</span>
            </div>
          }

          <div class="ml-auto">
            <span class="text-xs font-semibold text-primary-600 group-hover:gap-1.5
                         flex items-center gap-1 transition-all duration-150">
              Ver
              <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class TripCardComponent {
  readonly trip = input.required<Trip>();
  readonly select = output<string>();
  readonly delete = output<string>();

  readonly statusMeta = computed(() => STATUS_META[this.trip().status]);
  readonly gradient = computed(() => cityGradient(this.trip().city));
}
