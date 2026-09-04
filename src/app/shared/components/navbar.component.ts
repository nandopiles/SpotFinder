import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-50 glass border-b border-surface-border/70">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        <!-- Logo -->
        <a routerLink="/trips" class="flex items-center gap-2.5 group shrink-0 rounded-xl -m-1 p-1">
          <div class="relative w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center
                      transition-all duration-300 ease-spring
                      group-hover:scale-105 group-active:scale-95"
               style="box-shadow: 0 4px 12px -2px rgba(79,70,229,0.5), inset 0 1px 0 rgba(255,255,255,0.25)">
            <svg class="w-4.5 h-4.5 text-white" style="width:18px;height:18px" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex flex-col leading-none">
            <span class="font-extrabold text-[15px] text-ink tracking-tight">
              Spot<span class="text-primary-600">Finder</span>
            </span>
            <span class="text-[10px] font-medium text-ink-muted tracking-wide mt-0.5">Planificador express</span>
          </div>
        </a>

<!-- Right slot -->
        <div class="flex items-center gap-2 shrink-0">

          <!-- Theme toggle -->
          <button
            #toggleBtn
            class="relative overflow-hidden w-9 h-9 rounded-xl flex items-center justify-center
                   text-ink-secondary bg-surface-subtle border border-surface-border
                   hover:text-ink hover:border-surface-border-strong active:scale-95
                   transition-all duration-150 ease-smooth"
            [title]="theme.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            (click)="onToggle(toggleBtn)"
          >
            <!-- Sol -->
            <svg
              class="w-5 h-5 absolute transition-all duration-300"
              [style.opacity]="theme.isDark() ? '1' : '0'"
              [style.transform]="theme.isDark() ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)'"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
            <!-- Luna -->
            <svg
              class="w-5 h-5 absolute transition-all duration-300"
              [style.opacity]="theme.isDark() ? '0' : '1'"
              [style.transform]="theme.isDark() ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)'"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>
        </div>

      </div>
    </header>
  `,
})
export class NavbarComponent {
  protected readonly theme = inject(ThemeService);

  onToggle(btn: HTMLButtonElement): void {
    this.theme.toggle(btn.getBoundingClientRect());
  }
}
