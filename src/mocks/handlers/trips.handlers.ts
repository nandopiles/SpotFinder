import { http, HttpResponse, delay } from 'msw';
import { Trip, CreateTripDto, UpdateTripDto, ReorderSpotsDto, ActivitySpot, CreateSpotDto, UpdateSpotDto } from '../../app/core/models/trip.model';
import { SEED_TRIPS } from '../data/seed';

const STORAGE_KEY = 'msw_trips';
const LATENCY = 600;

function getTrips(): Trip[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRIPS));
    return structuredClone(SEED_TRIPS);
  }
  const trips = JSON.parse(raw) as Trip[];
  // Reset if cached data is missing new fields
  const needsMigration = trips.some(t => !t.icon || !t.color);
  if (needsMigration) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRIPS));
    return structuredClone(SEED_TRIPS);
  }
  return trips;
}

function saveTrips(trips: Trip[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

function now(): string {
  return new Date().toISOString();
}

export const tripHandlers = [
  http.get('/api/trips', async () => {
    await delay(LATENCY);
    return HttpResponse.json(getTrips());
  }),

  http.get('/api/trips/:id', async ({ params }) => {
    await delay(LATENCY);
    const trip = getTrips().find(t => t.id === params['id']);
    if (!trip) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(trip);
  }),

  http.post('/api/trips', async ({ request }) => {
    await delay(LATENCY);
    const dto = await request.json() as CreateTripDto;
    const newTrip: Trip = {
      ...dto,
      id: `trip-${crypto.randomUUID()}`,
      createdAt: now(),
      updatedAt: now(),
    };
    const trips = getTrips();
    saveTrips([...trips, newTrip]);
    return HttpResponse.json(newTrip, { status: 201 });
  }),

  http.patch('/api/trips/:id', async ({ params, request }) => {
    await delay(LATENCY);
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === params['id']);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const dto = await request.json() as UpdateTripDto;
    const updated: Trip = { ...trips[idx], ...dto, updatedAt: now() };
    trips[idx] = updated;
    saveTrips(trips);
    return HttpResponse.json(updated);
  }),

  http.delete('/api/trips/:id', async ({ params }) => {
    await delay(LATENCY);
    const trips = getTrips();
    const filtered = trips.filter(t => t.id !== params['id']);
    if (filtered.length === trips.length) return new HttpResponse(null, { status: 404 });
    saveTrips(filtered);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/trips/:id/spots', async ({ params, request }) => {
    await delay(LATENCY);
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === params['id']);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const dto = await request.json() as CreateSpotDto;
    const newSpot: ActivitySpot = {
      ...dto,
      id: `spot-${crypto.randomUUID()}`,
      order: trips[idx].spots.length,
    };
    trips[idx] = { ...trips[idx], spots: [...trips[idx].spots, newSpot], updatedAt: now() };
    saveTrips(trips);
    return HttpResponse.json(newSpot, { status: 201 });
  }),

  // ⚠️ /spots/reorder debe ir ANTES que /spots/:spotId — si no, ":spotId" capturaría "reorder"
  http.patch('/api/trips/:id/spots/reorder', async ({ params, request }) => {
    await delay(LATENCY);
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === params['id']);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const dto = await request.json() as ReorderSpotsDto;
    const orderMap = new Map(dto.map(r => [r.spotId, r.order]));
    trips[idx] = {
      ...trips[idx],
      spots: trips[idx].spots
        .map(s => ({ ...s, order: orderMap.get(s.id) ?? s.order }))
        .sort((a, b) => a.order - b.order),
      updatedAt: now(),
    };
    saveTrips(trips);
    return HttpResponse.json(trips[idx]);
  }),

  http.patch('/api/trips/:id/spots/:spotId', async ({ params, request }) => {
    await delay(LATENCY);
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === params['id']);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const spotIdx = trips[idx].spots.findIndex(s => s.id === params['spotId']);
    if (spotIdx === -1) return new HttpResponse(null, { status: 404 });
    const dto = await request.json() as UpdateSpotDto;
    const updatedSpot: ActivitySpot = { ...trips[idx].spots[spotIdx], ...dto };
    trips[idx] = {
      ...trips[idx],
      spots: trips[idx].spots.with(spotIdx, updatedSpot),
      updatedAt: now(),
    };
    saveTrips(trips);
    return HttpResponse.json(updatedSpot);
  }),

  http.delete('/api/trips/:id/spots/:spotId', async ({ params }) => {
    await delay(LATENCY);
    const trips = getTrips();
    const idx = trips.findIndex(t => t.id === params['id']);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const remaining = trips[idx].spots.filter(s => s.id !== params['spotId']);
    if (remaining.length === trips[idx].spots.length) return new HttpResponse(null, { status: 404 });
    // Re-normalizar el order para no dejar huecos
    const spots = remaining
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({ ...s, order: i }));
    trips[idx] = { ...trips[idx], spots, updatedAt: now() };
    saveTrips(trips);
    return new HttpResponse(null, { status: 204 });
  }),
];
