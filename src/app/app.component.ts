import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { EditTripPanelComponent } from './features/trips/components/edit-trip-panel.component';
import { UiStateService } from './core/services/ui-state.service';
import { UpdateTripDto } from './core/models/trip.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, EditTripPanelComponent],
  template: `
    <!-- Blurred shell -->
    <div class="min-h-screen flex flex-col"
         style="transition: filter 0.3s ease"
         [style.filter]="isOpen() ? 'blur(4px)' : 'blur(0px)'">
      <app-navbar />
      <main class="flex-1 flex flex-col">
        <router-outlet />
      </main>
    </div>

    <!-- Panel rendered outside blurred wrapper -->
    @if (ui.editPanelState() !== 'closed' && ui.editPanelTrip()) {
      <app-edit-trip-panel
        [trip]="ui.editPanelTrip()!"
        [closing]="ui.editPanelState() === 'closing'"
        (confirm)="onSave($event)"
        (cancel)="close()"
      />
    }
  `,
})
export class AppComponent {
  protected readonly ui = inject(UiStateService);

  protected isOpen(): boolean {
    return this.ui.editPanelState() !== 'closed';
  }

  protected async onSave(dto: UpdateTripDto): Promise<void> {
    this.ui.editPanelSaving.set(true);
    await this.ui.editPanelSave()?.call(null, dto);
    this.ui.editPanelSaving.set(false);
    this.close();
  }

  protected close(): void {
    this.ui.editPanelState.set('closing');
    setTimeout(() => this.ui.editPanelState.set('closed'), 300);
  }
}
