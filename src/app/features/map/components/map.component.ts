import {
  Component, ChangeDetectionStrategy, OnDestroy,
  AfterViewInit, ElementRef, ViewChild, input, output, effect,
  inject,
} from '@angular/core';
import * as L from 'leaflet';
import { ActivitySpot, Coordinates } from '../../../core/models/trip.model';
import { ThemeService } from '../../../core/services/theme.service';

// Tiles estándar de OpenStreetMap (gratuitos, sin API key).
// El modo oscuro se consigue con un filtro CSS sobre estos mismos tiles.
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Filtro que transforma los tiles claros en una versión oscura agradable
const DARK_TILE_FILTER = 'invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.85)';

// Fix Leaflet default icon paths with Angular bundler
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconActive = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-active',
});

@Component({
  selector: 'app-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #mapContainer class="w-full h-full rounded-xl overflow-hidden"></div>`,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;

  readonly spots = input.required<ActivitySpot[]>();
  readonly center = input<Coordinates>({ lat: 40.4168, lng: -3.7038 });
  readonly selectedSpotId = input<string | null>(null);
  readonly hoveredSpotId = input<string | null>(null);

  readonly spotClick = output<string>();
  readonly spotHover = output<string | null>();

  private readonly theme = inject(ThemeService);

  private map!: L.Map;
  private markers = new Map<string, L.Marker>();
  private polyline?: L.Polyline;
  private tileLayer?: L.TileLayer;

  constructor() {
    effect(() => this.syncMarkers(this.spots()));
    effect(() => this.highlightMarker(this.selectedSpotId(), 'selected'));
    effect(() => this.highlightMarker(this.hoveredSpotId(), 'hovered'));
    // Cambia los tiles del mapa al alternar el tema
    effect(() => this.applyTileTheme(this.theme.isDark()));
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    const { lat, lng } = this.center();
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
    });

    // Tile layer estándar de OSM (se crea una sola vez)
    this.tileLayer = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(this.map);

    // Aplica el filtro de tema actual
    this.applyTileTheme(this.theme.isDark());

    // Render initial spots if already available
    if (this.spots().length) this.syncMarkers(this.spots());
  }

  private applyTileTheme(dark: boolean): void {
    const container = this.tileLayer?.getContainer();
    if (!container) return;
    container.style.filter = dark ? DARK_TILE_FILTER : '';
    // Transición suave al alternar el tema
    container.style.transition = 'filter 0.4s ease';
  }

  private syncMarkers(spots: ActivitySpot[]): void {
    if (!this.map) return;

    // Remove stale markers
    const currentIds = new Set(spots.map(s => s.id));
    for (const [id, marker] of this.markers) {
      if (!currentIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }

    // Add/update markers
    spots.forEach(spot => {
      const { lat, lng } = spot.coordinates;
      if (this.markers.has(spot.id)) {
        this.markers.get(spot.id)!.setLatLng([lat, lng]);
        return;
      }

      const marker = L.marker([lat, lng], { icon: iconDefault })
        .bindTooltip(`<strong>${spot.order + 1}. ${spot.name}</strong><br>${spot.startTime} · ${spot.duration}min`, {
          direction: 'top',
          offset: [0, -40],
        })
        .on('click', () => this.spotClick.emit(spot.id))
        .on('mouseover', () => this.spotHover.emit(spot.id))
        .on('mouseout', () => this.spotHover.emit(null))
        .addTo(this.map);

      this.markers.set(spot.id, marker);
    });

    this.drawPolyline(spots);
    this.fitBounds(spots);
  }

  private drawPolyline(spots: ActivitySpot[]): void {
    this.polyline?.remove();
    if (spots.length < 2) return;
    const latlngs = spots.map(s => [s.coordinates.lat, s.coordinates.lng] as L.LatLngTuple);
    this.polyline = L.polyline(latlngs, {
      color: '#3b82f6',
      weight: 2.5,
      opacity: 0.6,
      dashArray: '6, 8',
    }).addTo(this.map);
  }

  private fitBounds(spots: ActivitySpot[]): void {
    if (!spots.length) return;
    const bounds = L.latLngBounds(spots.map(s => [s.coordinates.lat, s.coordinates.lng]));
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }

  private highlightMarker(id: string | null, _type: 'selected' | 'hovered'): void {
    if (!this.map) return;
    this.markers.forEach((marker, markerId) => {
      marker.setIcon(markerId === id ? iconActive : iconDefault);
      if (markerId === id) {
        marker.openTooltip();
      }
    });
  }
}
