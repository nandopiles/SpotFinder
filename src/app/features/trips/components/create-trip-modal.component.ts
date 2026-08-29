import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CreateTripDto } from '../../../core/models/trip.model';

@Component({
  selector: 'app-create-trip-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4
             bg-ink/40 backdrop-blur-sm animate-fade-in"
      (click)="onBackdropClick($event)"
    >
      <!-- Sheet / Modal -->
      <div
        class="relative w-full sm:max-w-md bg-white
               rounded-t-3xl sm:rounded-3xl shadow-modal
               animate-fade-up overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Gradient top bar -->
        <div class="h-1 bg-gradient-primary"></div>

        <!-- Handle (mobile) -->
        <div class="flex justify-center pt-3 pb-1 sm:hidden">
          <div class="w-10 h-1 rounded-full bg-surface-border"></div>
        </div>

        <div class="px-6 pt-4 pb-6 sm:pt-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-6">
            <div>
              <h2 class="text-xl font-bold text-ink">Nuevo viaje</h2>
              <p class="text-sm text-ink-muted mt-0.5">Empieza a planificar tu día perfecto</p>
            </div>
            <button class="btn-icon -mr-1 -mt-1" (click)="cancel.emit()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- Title -->
            <div>
              <label class="input-label">Título del viaje</label>
              <input
                formControlName="title"
                class="input"
                placeholder="Ej: Barcelona en un día"
                autocomplete="off"
              />
              @if (form.controls.title.invalid && form.controls.title.touched) {
                <p class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  El título es obligatorio
                </p>
              }
            </div>

            <!-- City + Date row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="input-label">Ciudad</label>
                <input
                  formControlName="city"
                  class="input"
                  placeholder="Barcelona"
                  autocomplete="off"
                />
                @if (form.controls.city.invalid && form.controls.city.touched) {
                  <p class="text-xs text-red-500 mt-1.5">Obligatorio</p>
                }
              </div>
              <div>
                <label class="input-label">Fecha</label>
                <input
                  formControlName="date"
                  type="date"
                  class="input"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="button" class="btn-ghost flex-1" (click)="cancel.emit()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary flex-1"
                [disabled]="form.invalid"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                </svg>
                Crear viaje
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CreateTripModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly confirm = output<CreateTripDto>();
  readonly cancel = output<void>();

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    city:  ['', Validators.required],
    date:  [new Date().toISOString().split('T')[0]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { title, city, date } = this.form.getRawValue();
    this.confirm.emit({
      title, city, date,
      status: 'draft',
      centerCoordinates: { lat: 0, lng: 0 },
      spots: [],
      legs: [],
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
