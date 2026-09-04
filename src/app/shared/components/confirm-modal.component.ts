import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(15,13,36,0.6); backdrop-filter: blur(6px)"
      (click)="onBackdropClick($event)"
    >
      <div
        class="relative w-full max-w-xs bg-surface rounded-3xl shadow-modal animate-scale-in
               border border-surface-border"
        (click)="$event.stopPropagation()"
      >
        <div class="px-7 pt-8 pb-6 text-center">

          <!-- Icono -->
          <div class="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center
                      bg-red-500/10 ring-8 ring-red-500/5">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>

          <!-- Texto -->
          <h3 class="text-base font-bold mb-1.5 text-ink">{{ title() }}</h3>
          <p class="text-sm leading-relaxed mb-6 text-ink-muted">{{ description() }}</p>

          <!-- Acciones -->
          <div class="flex flex-col gap-2">
            <button class="btn-danger w-full" (click)="confirm.emit()">
              {{ confirmLabel() }}
            </button>
            <button class="btn-ghost w-full" (click)="cancel.emit()">
              {{ cancelLabel() }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  readonly title        = input('Eliminar viaje');
  readonly description  = input('Esta acción no se puede deshacer.');
  readonly confirmLabel = input('Eliminar');
  readonly cancelLabel  = input('Cancelar');

  readonly confirm = output<void>();
  readonly cancel  = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
