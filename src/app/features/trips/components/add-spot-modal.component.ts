import { Component, ChangeDetectionStrategy, output, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { PhotonService, PlaceResult } from '../../../core/services/photon.service';
import { ActivityCategory, CreateSpotDto, CATEGORY_META } from '../../../core/models/trip.model';

const CATEGORY_OPTIONS: { value: ActivityCategory; label: string; emoji: string }[] = [
  { value: 'culture',  label: 'Cultura',     emoji: '🏛️' },
  { value: 'food',     label: 'Gastronomía', emoji: '🍽️' },
  { value: 'nature',   label: 'Naturaleza',  emoji: '🌿' },
  { value: 'leisure',  label: 'Ocio',        emoji: '🎭' },
  { value: 'shopping', label: 'Compras',     emoji: '🛍️' },
];

@Component({
  selector: 'app-add-spot-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style="background: rgba(15,13,36,0.6)"
         (click)="onBackdropClick($event)">

      <div class="relative w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl shadow-modal
                  flex flex-col max-h-[90vh] animate-fade-up"
           (click)="$event.stopPropagation()">

        <!-- Handle móvil -->
        <div class="flex justify-center pt-3 sm:hidden shrink-0">
          <div class="w-8 h-1 rounded-full bg-surface-border"></div>
        </div>

        <!-- Header -->
        <div class="px-6 pt-5 pb-4 shrink-0 flex items-center justify-between border-b border-surface-border">
          <div>
            <h2 class="text-base font-bold text-ink">Añadir parada</h2>
            <p class="text-xs text-ink-muted mt-0.5">Busca un lugar para añadir al itinerario</p>
          </div>
          <button class="btn-icon" (click)="cancel.emit()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="px-6 pt-4 shrink-0">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              class="input pl-9"
              placeholder="Buscar lugar, restaurante, museo..."
              autocomplete="off"
              [value]="query()"
              (input)="onQuery($event)"
            />
            @if (query()) {
              <button class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                      (click)="clearSearch()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto px-6 pb-6 min-h-0">

          <!-- Search results -->
          @if (!selectedPlace()) {
            <div class="mt-3">
              @if (searching()) {
                <div class="flex items-center justify-center py-8 gap-2 text-ink-muted">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span class="text-sm">Buscando...</span>
                </div>
              } @else if (results().length) {
                <div class="flex flex-col gap-1">
                  @for (place of results(); track place.name + place.address) {
                    <button
                      type="button"
                      class="flex items-start gap-3 px-3 py-3 rounded-xl text-left
                             hover:bg-surface-subtle transition-colors duration-150 w-full"
                      (click)="selectPlace(place)"
                    >
                      <div class="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-ink truncate">{{ place.name }}</p>
                        <p class="text-xs text-ink-muted truncate mt-0.5">{{ place.address }}</p>
                      </div>
                    </button>
                  }
                </div>
              } @else if (query().length >= 2) {
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <p class="text-sm text-ink-muted">Sin resultados para "{{ query() }}"</p>
                  <p class="text-xs text-ink-faint mt-1">Prueba con otro término</p>
                </div>
              } @else {
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <div class="w-12 h-12 rounded-2xl bg-surface-subtle flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <p class="text-sm text-ink-muted">Escribe al menos 2 caracteres</p>
                </div>
              }
            </div>
          }

          <!-- Spot detail form -->
          @if (selectedPlace()) {
            <div class="mt-4">

              <!-- Place preview -->
              <div class="flex items-start gap-3 p-3 rounded-xl bg-primary-500/8 border border-primary-500/20 mb-5">
                <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-ink truncate">{{ selectedPlace()!.name }}</p>
                  <p class="text-xs text-ink-muted truncate mt-0.5">{{ selectedPlace()!.address }}</p>
                </div>
                <button class="text-ink-faint hover:text-ink-muted transition-colors shrink-0"
                        (click)="clearPlace()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

                <!-- Nombre -->
                <div>
                  <label class="input-label">Nombre</label>
                  <input formControlName="name" class="input" autocomplete="off"/>
                </div>

                <!-- Categoría -->
                <div>
                  <label class="input-label">Categoría</label>
                  <div class="grid grid-cols-5 gap-2 mt-1">
                    @for (cat of categoryOptions; track cat.value) {
                      <button
                        type="button"
                        class="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2
                               transition-all duration-150 text-center"
                        [style.borderColor]="form.controls.category.value === cat.value ? '#6366f1' : 'var(--color-surface-border)'"
                        [style.background]="form.controls.category.value === cat.value ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-subtle)'"
                        (click)="form.controls.category.setValue(cat.value)"
                      >
                        <span class="text-lg">{{ cat.emoji }}</span>
                        <span class="text-2xs font-medium text-ink-muted leading-tight">{{ cat.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Hora + Duración -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="input-label">Hora de llegada</label>
                    <input formControlName="startTime" type="time" class="input"/>
                  </div>
                  <div>
                    <label class="input-label">Duración (min)</label>
                    <input formControlName="duration" type="number" min="5" step="5" class="input"/>
                  </div>
                </div>

                <!-- Notas -->
                <div>
                  <label class="input-label">Notas <span class="text-ink-faint normal-case font-normal">(opcional)</span></label>
                  <textarea formControlName="notes" class="input resize-none" rows="2"
                            placeholder="Reserva necesaria, mejor por la mañana..."></textarea>
                </div>

                <div class="flex gap-3 pt-1">
                  <button type="button" class="btn-ghost flex-1" (click)="cancel.emit()">Cancelar</button>
                  <button type="submit" class="btn-primary flex-1" [disabled]="form.invalid || saving()">
                    @if (saving()) {
                      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Añadiendo...
                    } @else {
                      Añadir parada
                    }
                  </button>
                </div>
              </form>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AddSpotModalComponent {
  readonly confirm = output<CreateSpotDto>();
  readonly cancel  = output<void>();

  private readonly fb      = inject(FormBuilder);
  private readonly photon  = inject(PhotonService);

  readonly saving  = signal(false);
  readonly query   = signal('');
  readonly selectedPlace = signal<PlaceResult | null>(null);

  private readonly query$ = new Subject<string>();
  private readonly results$ = this.photon.search(this.query$.asObservable());

  readonly searching = signal(false);
  readonly results   = toSignal(this.results$, { initialValue: [] as PlaceResult[] });

  readonly categoryOptions = CATEGORY_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    name:      ['', Validators.required],
    category:  ['culture' as ActivityCategory, Validators.required],
    startTime: ['10:00', Validators.required],
    duration:  [60, [Validators.required, Validators.min(5)]],
    notes:     [''],
  });

  onQuery(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.query.set(q);
    this.searching.set(q.trim().length >= 2);
    this.query$.next(q);
    // Turn off searching indicator once results arrive
    this.results$.subscribe(() => this.searching.set(false));
  }

  clearSearch(): void {
    this.query.set('');
    this.query$.next('');
  }

  selectPlace(place: PlaceResult): void {
    this.selectedPlace.set(place);
    this.form.controls.name.setValue(place.name);
  }

  clearPlace(): void {
    this.selectedPlace.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedPlace()) return;
    const place = this.selectedPlace()!;
    const { name, category, startTime, duration, notes } = this.form.getRawValue();
    this.saving.set(true);
    this.confirm.emit({
      name,
      description: '',
      category,
      coordinates: place.coordinates,
      address: place.address,
      startTime,
      duration,
      notes: notes || undefined,
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
