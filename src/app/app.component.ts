import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { EditTripPanelComponent } from './features/trips/components/edit-trip-panel.component';
import { EditSpotPanelComponent } from './features/trips/components/edit-spot-panel.component';
import { AddSpotModalComponent } from './features/trips/components/add-spot-modal.component';
import { ConfirmModalComponent } from './shared/components/confirm-modal.component';
import { UiStateService } from './core/services/ui-state.service';
import { UpdateTripDto, UpdateSpotDto } from './core/models/trip.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, EditTripPanelComponent, EditSpotPanelComponent, AddSpotModalComponent, ConfirmModalComponent],
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

    <!-- Edit panel rendered outside blurred wrapper -->
    @if (ui.editPanelState() !== 'closed' && ui.editPanelTrip()) {
      <app-edit-trip-panel
        [trip]="ui.editPanelTrip()!"
        [closing]="ui.editPanelState() === 'closing'"
        (confirm)="onSave($event)"
        (cancel)="close()"
      />
    }

    <!-- Add spot modal rendered outside blurred wrapper -->
    @if (ui.addSpotOpen()) {
      <app-add-spot-modal
        [bias]="ui.addSpotBias()"
        (confirm)="onAddSpot($event)"
        (cancel)="closeAddSpot()"
      />
    }

    <!-- Edit spot panel rendered outside blurred wrapper -->
    @if (ui.editSpotState() !== 'closed' && ui.editSpotSpot()) {
      <app-edit-spot-panel
        [spot]="ui.editSpotSpot()!"
        [closing]="ui.editSpotState() === 'closing'"
        (confirm)="onSaveSpot($event)"
        (cancel)="closeEditSpot()"
      />
    }

    <!-- Confirm delete spot rendered outside blurred wrapper -->
    @if (ui.confirmSpotDeleteOpen()) {
      <app-confirm-modal
        title="Eliminar parada"
        [description]="spotDeleteDescription()"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        (confirm)="onConfirmSpotDelete()"
        (cancel)="closeConfirmSpotDelete()"
      />
    }
  `,
})
export class AppComponent {
  protected readonly ui = inject(UiStateService);

  protected isOpen(): boolean {
    return this.ui.editPanelState() !== 'closed'
        || this.ui.addSpotOpen()
        || this.ui.editSpotState() !== 'closed'
        || this.ui.confirmSpotDeleteOpen();
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

  protected onAddSpot(dto: import('./core/models/trip.model').CreateSpotDto): void {
    this.ui.addSpotConfirm()?.call(null, dto);
    this.closeAddSpot();
  }

  protected closeAddSpot(): void {
    this.ui.addSpotOpen.set(false);
  }

  protected async onSaveSpot(dto: UpdateSpotDto): Promise<void> {
    this.ui.editSpotSaving.set(true);
    await this.ui.editSpotSave()?.call(null, dto);
    this.ui.editSpotSaving.set(false);
    this.closeEditSpot();
  }

  protected closeEditSpot(): void {
    this.ui.editSpotState.set('closing');
    setTimeout(() => this.ui.editSpotState.set('closed'), 300);
  }

  protected spotDeleteDescription(): string {
    const name = this.ui.confirmSpotDeleteName();
    return `¿Seguro que quieres eliminar "${name}"? Esta acción no se puede deshacer.`;
  }

  protected onConfirmSpotDelete(): void {
    this.ui.confirmSpotDelete()?.call(null);
    this.closeConfirmSpotDelete();
  }

  protected closeConfirmSpotDelete(): void {
    this.ui.confirmSpotDeleteOpen.set(false);
    this.ui.confirmSpotDelete.set(null);
  }
}
