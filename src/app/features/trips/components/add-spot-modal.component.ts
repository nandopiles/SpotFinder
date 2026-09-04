import { Component, ChangeDetectionStrategy, output, input, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { PhotonService, PlaceResult } from '../../../core/services/photon.service';
import { ActivityCategory, Coordinates, CreateSpotDto, CATEGORY_META } from '../../../core/models/trip.model';

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
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style="background: rgba(15,13,36,0.55); backdrop-filter: blur(6px)"
         (click)="onBackdropClick($event)">

      <div class="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl
                  flex flex-col max-h-[92vh] sm:max-h-[85vh]"
           style="box-shadow: 0 24px 64px -12px rgba(0,0,0,0.4), 0 0 0 1px var(--color-surface-border)"
           (click)="$event.stopPropagation()">

        <!-- Handle móvil -->
        <div class="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div class="w-10 h-1 rounded-full bg-surface-border"></div>
        </div>

        @if (!selectedPlace()) {

          <!-- ── FASE BÚSQUEDA ── -->

          <!-- Header búsqueda -->
          <div class="px-5 pt-4 pb-3 shrink-0">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-sm font-bold text-ink leading-tight">Nueva parada</h2>
                  <p class="text-2xs text-ink-muted">Busca un lugar en el mapa</p>
                </div>
              </div>
              <button class="btn-icon w-8 h-8" (click)="cancel.emit()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Search input -->
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                @if (searching()) {
                  <svg class="w-4 h-4 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                } @else {
                  <svg class="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                }
              </div>
              <input
                #searchInput
                class="input pl-10 pr-9 py-3 text-sm"
                placeholder="Restaurante, museo, parque..."
                autocomplete="off"
                [value]="query()"
                (input)="onQuery($event)"
              />
              @if (query()) {
                <button
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                         bg-surface-border hover:bg-surface-border-strong
                         flex items-center justify-center transition-colors"
                  (click)="clearSearch()">
                  <svg class="w-3 h-3 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
          </div>

          <!-- Results -->
          <div class="flex-1 overflow-y-auto min-h-0 pb-4">
            @if (results().length) {
              <div class="px-2">
                @for (place of results(); track place.name + place.address) {
                  <button
                    type="button"
                    class="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left
                           hover:bg-surface-subtle active:bg-surface-border
                           transition-colors duration-100 group"
                    (click)="selectPlace(place)"
                  >
                    <div class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center
                                bg-surface-subtle group-hover:bg-surface border border-surface-border
                                transition-colors">
                      <span class="text-base">{{ placeEmoji(place.type) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-ink truncate">{{ place.name }}</p>
                      <p class="text-xs text-ink-muted truncate mt-0.5">{{ place.address }}</p>
                    </div>
                    <svg class="w-4 h-4 text-ink-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                }
              </div>
            } @else if (query().length >= 2 && !searching()) {
              <div class="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div class="text-3xl mb-3">🔍</div>
                <p class="text-sm font-medium text-ink">Sin resultados</p>
                <p class="text-xs text-ink-muted mt-1">Prueba con otro nombre o dirección</p>
              </div>
            } @else if (!query()) {
              <div class="px-5 pt-1 pb-2">
                <p class="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2">Sugerencias</p>
                <div class="flex flex-wrap gap-2">
                  @for (s of suggestions; track s) {
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-full text-xs font-medium
                             bg-surface-subtle hover:bg-surface-border
                             text-ink-secondary border border-surface-border
                             transition-colors duration-100"
                      (click)="applySuggestion(s)"
                    >{{ s }}</button>
                  }
                </div>
              </div>
            }
          </div>

        } @else {

          <!-- ── FASE DETALLE ── -->

          <!-- Header detalle -->
          <div class="px-5 pt-4 pb-3 shrink-0 border-b border-surface-border">
            <div class="flex items-center justify-between">
              <button class="flex items-center gap-1.5 text-xs font-medium text-ink-muted
                             hover:text-ink transition-colors"
                      (click)="clearPlace()">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Cambiar lugar
              </button>
              <button class="btn-icon w-8 h-8" (click)="cancel.emit()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Place card -->
            <div class="flex items-center gap-3 mt-3 p-3 rounded-xl"
                 style="background: rgba(99,102,241,0.07); border: 1px solid rgba(99,102,241,0.2)">
              <div class="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
                <span class="text-base">{{ placeEmoji(selectedPlace()!.type) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-ink truncate">{{ selectedPlace()!.name }}</p>
                <p class="text-xs text-ink-muted truncate">{{ selectedPlace()!.address }}</p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <div class="flex-1 overflow-y-auto min-h-0">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="px-5 py-4 space-y-4">

              <!-- Nombre -->
              <div>
                <label class="input-label">Nombre</label>
                <input formControlName="name" class="input" autocomplete="off"/>
              </div>

              <!-- Categoría -->
              <div>
                <label class="input-label">Categoría</label>
                <div class="grid grid-cols-5 gap-1.5 mt-1">
                  @for (cat of categoryOptions; track cat.value) {
                    <button
                      type="button"
                      class="flex flex-col items-center gap-1 py-2.5 rounded-xl border
                             transition-all duration-150"
                      [style.borderColor]="formValue().category === cat.value ? '#6366f1' : 'var(--color-surface-border)'"
                      [style.background]="formValue().category === cat.value ? 'rgba(99,102,241,0.1)' : 'var(--color-surface-subtle)'"
                      (click)="form.controls.category.setValue(cat.value)"
                    >
                      <span class="text-xl leading-none">{{ cat.emoji }}</span>
                      <span class="text-2xs font-medium leading-tight"
                            [style.color]="formValue().category === cat.value ? '#6366f1' : 'var(--color-ink-muted)'">
                        {{ cat.label }}
                      </span>
                    </button>
                  }
                </div>
              </div>

              <!-- Hora + Duración -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="input-label">Hora</label>
                  <input formControlName="startTime" type="time" class="input"/>
                </div>
                <div>
                  <label class="input-label">Duración (min)</label>
                  <input formControlName="duration" type="number" min="5" step="5" class="input"/>
                </div>
              </div>

              <!-- Notas -->
              <div>
                <label class="input-label">
                  Notas
                  <span class="normal-case font-normal text-ink-faint ml-1">(opcional)</span>
                </label>
                <textarea formControlName="notes" class="input resize-none" rows="2"
                          placeholder="Reserva necesaria, mejor por la mañana..."></textarea>
              </div>

              <!-- Actions -->
              <div class="flex gap-2.5 pt-1 pb-2">
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
  `,
})
export class AddSpotModalComponent {
  readonly confirm = output<CreateSpotDto>();
  readonly cancel  = output<void>();
  readonly bias    = input<Coordinates>();

  private readonly fb      = inject(FormBuilder);
  private readonly photon  = inject(PhotonService);

  readonly saving        = signal(false);
  readonly query         = signal('');
  readonly selectedPlace = signal<PlaceResult | null>(null);

  private readonly query$   = new Subject<string>();
  private readonly results$ = this.photon.search(this.query$.asObservable(), this.bias);

  readonly searching = signal(false);
  readonly results   = toSignal(this.results$, { initialValue: [] as PlaceResult[] });

  readonly categoryOptions = CATEGORY_OPTIONS;

  readonly suggestions = ['Restaurante', 'Museo', 'Parque', 'Hotel', 'Playa', 'Mercado'];

  readonly form = this.fb.nonNullable.group({
    name:      ['', Validators.required],
    category:  ['culture' as ActivityCategory, Validators.required],
    startTime: ['10:00', Validators.required],
    duration:  [60, [Validators.required, Validators.min(5)]],
    notes:     [''],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  private readonly TYPE_EMOJI: Record<string, string> = {
    restaurant: '🍽️', cafe: '☕', bar: '🍺', bakery: '🥐',
    museum: '🏛️', artwork: '🎨', monument: '🗿', castle: '🏰', theatre: '🎭',
    park: '🌿', nature_reserve: '🌲', beach: '🏖️', viewpoint: '🌅',
    hotel: '🏨', hostel: '🛏️',
    mall: '🛍️', supermarket: '🛒',
    attraction: '⭐', place_of_worship: '⛪',
  };

  placeEmoji(type: string): string {
    return this.TYPE_EMOJI[type] ?? '📍';
  }

  applySuggestion(s: string): void {
    this.query.set(s);
    this.searching.set(true);
    this.query$.next(s);
    this.results$.subscribe(() => this.searching.set(false));
  }

  onQuery(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.query.set(q);
    this.searching.set(q.trim().length >= 2);
    this.query$.next(q);
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
