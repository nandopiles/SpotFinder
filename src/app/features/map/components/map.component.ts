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

// Marcador numerado y coloreado (pin tipo gota) — el color coincide con el del tramo,
// así el ojo relaciona cada parada con la línea que sale de ella.
function pinIcon(order: number, color: string, active: boolean): L.DivIcon {
  const size = active ? 40 : 32;
  const fontSize = active ? 15 : 13;
  const html = `
    <div class="sf-pin ${active ? 'sf-pin-active' : ''}" style="--pin:${color}">
      <div class="sf-pin-body">
        <span class="sf-pin-num" style="font-size:${fontSize}px">${order}</span>
      </div>
    </div>`;
  return L.divIcon({
    html,
    className: 'sf-pin-wrap',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    tooltipAnchor: [0, -size + 6],
  });
}

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
  /** Segmentos de ruta con color por tramo; si está vacío se dibuja línea recta */
  readonly routeSegments = input<{ geometry: [number, number][]; color: string }[]>([]);

  readonly spotClick = output<string>();
  readonly spotHover = output<string | null>();
  readonly mapClick  = output<Coordinates>();

  private readonly theme = inject(ThemeService);

  private map!: L.Map;
  private markers = new Map<string, L.Marker>();
  private polylines: L.Polyline[] = [];
  private tileLayer?: L.TileLayer;

  constructor() {
    effect(() => {
      // Depende de spots y de los colores de tramo (para recolorear marcadores)
      this.routeSegments();
      this.syncMarkers(this.spots());
    });
    effect(() => this.highlightMarker(this.selectedSpotId(), 'selected'));
    effect(() => this.highlightMarker(this.hoveredSpotId(), 'hovered'));
    // Cambia los tiles del mapa al alternar el tema
    effect(() => this.applyTileTheme(this.theme.isDark()));
    // Redibuja las rutas cuando cambian los segmentos (coloreados por tramo)
    effect(() => {
      this.routeSegments();
      this.drawPolyline(this.spots());
    });
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

    // Click en zona vacía del mapa -> emitir coordenadas para añadir parada
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.mapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

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

    const selected = this.selectedSpotId();

    // Add/update markers
    spots.forEach((spot, i) => {
      const { lat, lng } = spot.coordinates;
      const color = this.spotColor(i, spots.length);
      const icon = pinIcon(spot.order + 1, color, spot.id === selected);

      if (this.markers.has(spot.id)) {
        const m = this.markers.get(spot.id)!;
        m.setLatLng([lat, lng]);
        m.setIcon(icon);
        return;
      }

      const marker = L.marker([lat, lng], { icon })
        .bindTooltip(`<strong>${spot.order + 1}. ${spot.name}</strong><br>${spot.startTime} · ${spot.duration}min`, {
          direction: 'top',
          offset: [0, 0],
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

  /** Color de una parada: el del tramo que sale de ella (o el de llegada si es la última) */
  private spotColor(index: number, total: number): string {
    const segments = this.routeSegments();
    if (!segments.length) return '#6366f1';
    if (index < segments.length) return segments[index].color;   // color de salida
    return segments[index - 1]?.color ?? '#6366f1';              // última parada: color de llegada
  }

  private drawPolyline(spots: ActivitySpot[]): void {
    // Limpiar segmentos previos
    this.polylines.forEach(p => p.remove());
    this.polylines = [];
    if (!this.map || spots.length < 2) return;

    const segments = this.routeSegments();

    if (segments.length) {
      // Cada tramo: halo blanco grueso debajo + línea de color gruesa encima,
      // para que el color destaque claramente sobre el mapa (claro u oscuro).
      segments.forEach(seg => {
        if (seg.geometry.length < 2) return;
        const latlngs = seg.geometry.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
        const halo = L.polyline(latlngs, {
          color: '#ffffff', weight: 9, opacity: 0.9, lineJoin: 'round', lineCap: 'round',
        }).addTo(this.map);
        const line = L.polyline(latlngs, {
          color: seg.color, weight: 5, opacity: 1, lineJoin: 'round', lineCap: 'round',
        }).addTo(this.map);
        this.polylines.push(halo, line);
      });
    } else {
      // Sin rutas calculadas: línea recta punteada entre paradas
      const latlngs = spots.map(s => [s.coordinates.lat, s.coordinates.lng] as L.LatLngTuple);
      const line = L.polyline(latlngs, {
        color: '#6366f1', weight: 2.5, opacity: 0.5, dashArray: '6, 8',
        lineJoin: 'round', lineCap: 'round',
      }).addTo(this.map);
      this.polylines.push(line);
    }
  }

  private fitBounds(spots: ActivitySpot[]): void {
    if (!spots.length) return;
    const bounds = L.latLngBounds(spots.map(s => [s.coordinates.lat, s.coordinates.lng]));
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }

  private highlightMarker(id: string | null, _type: 'selected' | 'hovered'): void {
    if (!this.map) return;
    const spots = this.spots();
    const total = spots.length;
    spots.forEach((spot, i) => {
      const marker = this.markers.get(spot.id);
      if (!marker) return;
      const active = spot.id === id;
      marker.setIcon(pinIcon(spot.order + 1, this.spotColor(i, total), active));
      if (active) {
        marker.setZIndexOffset(1000);
        marker.openTooltip();
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }
}
