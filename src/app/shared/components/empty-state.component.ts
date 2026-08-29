import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-up">
      <!-- Illustration -->
      <div class="relative mb-8">
        <div class="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-100 to-accent-100
                    flex items-center justify-center shadow-sm">
          <span class="text-4xl">{{ emoji() }}</span>
        </div>
        <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-primary
                    flex items-center justify-center shadow-sm">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
      </div>

      <h3 class="text-xl font-bold text-ink mb-2">{{ title() }}</h3>
      <p class="text-sm text-ink-muted max-w-xs leading-relaxed mb-8">{{ description() }}</p>

      @if (actionLabel()) {
        <button class="btn-primary-lg" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly emoji = input('📭');
  readonly title = input('Sin resultados');
  readonly description = input('');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
