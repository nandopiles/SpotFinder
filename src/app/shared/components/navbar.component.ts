import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 glass border-b border-surface-border/60 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        <!-- Logo -->
        <a routerLink="/trips" class="flex items-center gap-2.5 group shrink-0">
          <div class="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center
                      shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <span class="font-bold text-base text-ink tracking-tight">
            Spot<span class="text-primary-600">Finder</span>
          </span>
        </a>

        <!-- Nav links -->
        <nav class="flex items-center gap-1">
          <a
            routerLink="/trips"
            routerLinkActive="bg-primary-50 text-primary-700 font-semibold"
            [routerLinkActiveOptions]="{ exact: false }"
            class="px-3.5 py-1.5 rounded-xl text-sm font-medium text-ink-secondary
                   hover:bg-surface-subtle hover:text-ink transition-all duration-150"
          >
            Mis viajes
          </a>
        </nav>

        <!-- Right slot -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500
                      flex items-center justify-center text-white text-xs font-bold shadow-sm">
            U
          </div>
        </div>

      </div>
    </header>
  `,
})
export class NavbarComponent {}
