import { Component, ChangeDetectionStrategy, input, output, inject, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivitySpot, ActivityCategory, UpdateSpotDto } from '../../../core/models/trip.model';
import { UiStateService } from '../../../core/services/ui-state.service';

const CATEGORY_OPTIONS: { value: ActivityCategory; label: string; emoji: string; color: string }[] = [
  { value: 'culture',  label: 'Cultura',     emoji: '🏛️', color: '#8b5cf6' },
  { value: 'food',     label: 'Gastronomía', emoji: '🍽️', color: '#f59e0b' },
  { value: 'nature',   label: 'Naturaleza',  emoji: '🌿', color: '#10b981' },
  { value: 'leisure',  label: 'Ocio',        emoji: '🎭', color: '#3b82f6' },
  { value: 'shopping', label: 'Compras',     emoji: '🛍️', color: '#ec4899' },
];

function colorSecondary(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.4).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

@Component({
  selector: 'app-edit-spot-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
      [style.opacity]="closing() ? '0' : '1'"
      (click)="cancel.emit()"
    ></div>

    <!-- Panel -->
    <aside class="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col bg-surface shadow-modal
                  border-l border-surface-border"
           [class.animate-slide-in-right]="!closing()"
           [class.animate-slide-out-right]="closing()">

      <!-- Header con gradiente de categoría -->
      <div class="relative h-28 shrink-0 overflow-hidden"
           [style.background]="'linear-gradient(135deg, ' + catColor() + ' 0%, ' + catColor2() + ' 100%)'">
        <div class="absolute inset-0 opacity-20"
             style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 18px 18px;"></div>
        <div class="absolute inset-x-0 top-0 h-14"
             style="background: linear-gradient(180deg, rgba(255,255,255,0.2), transparent)"></div>
        <div class="absolute inset-0 flex flex-col justify-end p-5">
          <p class="text-white/70 text-xs font-medium mb-1">Editando parada</p>
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ selectedCategory().emoji }}</span>
            <h2 class="text-white font-bold text-lg leading-tight truncate">
              {{ formValue().name || 'Sin nombre' }}
            </h2>
          </div>
        </div>
        <button class="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center
                       transition-colors duration-150"
                style="background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.9)"
                (click)="cancel.emit()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()"
            class="flex-1 overflow-y-auto flex flex-col">
        <div class="flex-1 p-5 space-y-5">

          <!-- Dirección (solo lectura) -->
          <div class="flex items-start gap-2 p-3 rounded-xl bg-surface-subtle border border-surface-border">
            <svg class="w-4 h-4 text-ink-muted shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <p class="text-xs text-ink-secondary leading-relaxed">{{ spot().address }}</p>
          </div>

          <!-- Nombre -->
          <div>
            <label class="input-label">Nombre</label>
            <input formControlName="name" class="input" placeholder="Nombre de la parada" autocomplete="off"/>
            @if (form.controls.name.invalid && form.controls.name.touched) {
              <p class="text-xs mt-1.5 text-red-500">El nombre es obligatorio</p>
            }
          </div>

          <!-- Categoría -->
          <div>
            <label class="input-label">Categoría</label>
            <div class="grid grid-cols-5 gap-1.5 mt-1">
              @for (cat of categoryOptions; track cat.value) {
                <button
                  type="button"
                  class="flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all duration-150"
                  [style.borderColor]="formValue().category === cat.value ? cat.color : 'var(--color-surface-border)'"
                  [style.background]="formValue().category === cat.value ? cat.color + '1a' : 'var(--color-surface-subtle)'"
                  (click)="form.controls.category.setValue(cat.value)"
                >
                  <span class="text-xl leading-none">{{ cat.emoji }}</span>
                  <span class="text-2xs font-medium leading-tight"
                        [style.color]="formValue().category === cat.value ? cat.color : 'var(--color-ink-muted)'">
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
              <span class="font-normal text-ink-faint ml-1">(opcional)</span>
            </label>
            <textarea formControlName="notes" class="input resize-none" rows="3"
                      placeholder="Reserva necesaria, mejor por la mañana..."></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 p-5 border-t border-surface-border flex gap-3">
          <button type="button" class="btn-ghost flex-1" [disabled]="saving()" (click)="cancel.emit()">Cancelar</button>
          <button type="submit" class="btn-primary flex-1" [disabled]="form.invalid || !isDirty() || saving()">
            @if (saving()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Guardando...
            } @else {
              Guardar cambios
            }
          </button>
        </div>
      </form>
    </aside>
  `,
})
export class EditSpotPanelComponent implements OnInit {
  readonly spot    = input.required<ActivitySpot>();
  readonly closing = input(false);
  readonly confirm = output<UpdateSpotDto>();
  readonly cancel  = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly ui = inject(UiStateService);

  readonly saving = this.ui.editSpotSaving;

  readonly categoryOptions = CATEGORY_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    name:      ['', Validators.required],
    category:  ['culture' as ActivityCategory, Validators.required],
    startTime: ['10:00', Validators.required],
    duration:  [60, [Validators.required, Validators.min(5)]],
    notes:     [''],
  });

  readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly selectedCategory = computed(() =>
    CATEGORY_OPTIONS.find(c => c.value === this.formValue().category) ?? CATEGORY_OPTIONS[0]
  );

  readonly catColor  = computed(() => this.selectedCategory().color);
  readonly catColor2 = computed(() => colorSecondary(this.selectedCategory().color));

  readonly isDirty = computed(() => {
    const s = this.spot();
    const v = this.formValue();
    return v.name !== s.name || v.category !== s.category || v.startTime !== s.startTime
        || v.duration !== s.duration || (v.notes || '') !== (s.notes || '');
  });

  ngOnInit(): void {
    const s = this.spot();
    this.form.setValue({
      name:      s.name,
      category:  s.category,
      startTime: s.startTime,
      duration:  s.duration,
      notes:     s.notes ?? '',
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { name, category, startTime, duration, notes } = this.form.getRawValue();
    this.confirm.emit({ name, category, startTime, duration, notes: notes || undefined });
  }
}
