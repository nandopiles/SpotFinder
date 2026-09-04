import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

export interface PdfStop {
  order: number;
  name: string;
  address: string;
  startTime: string;
  endTime: string;
  durationLabel: string;
  categoryLabel: string;
  color: string;          // hex del tramo/parada
  notes?: string;
  travel?: string | null; // texto del trayecto desde la parada anterior
}

export interface PdfTripData {
  title: string;
  city: string;
  dateLabel: string;
  stopsCount: number;
  totalTravelLabel: string;
  accent: string;         // color de marca del viaje (hex)
  stops: PdfStop[];
}

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

// Paleta neutra del documento (tinta minimalista)
const INK: RGB       = [26, 24, 48];
const INK_SOFT: RGB  = [90, 88, 120];
const INK_FAINT: RGB = [150, 148, 170];
const HAIRLINE: RGB  = [230, 229, 240];

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private readonly M = 56;          // margen lateral (pt)
  private readonly W = 595.28;      // A4 ancho (pt)
  private readonly H = 841.89;      // A4 alto (pt)

  export(data: PdfTripData): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'normal');

    let y = this.header(doc, data);
    y += 18;

    for (const stop of data.stops) {
      y = this.stopBlock(doc, stop, y);
    }

    this.footer(doc);

    const safe = data.title.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase();
    doc.save(`itinerario-${safe || 'viaje'}.pdf`);
  }

  // ── Cabecera ──────────────────────────────────────────────────────────────
  private header(doc: jsPDF, data: PdfTripData): number {
    const [ar, ag, ab] = hexToRgb(data.accent);

    // Barra de acento fina en la parte superior
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 0, this.W, 6, 'F');

    // Etiqueta discreta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(ar, ag, ab);
    doc.text('ITINERARIO', this.M, 64);

    // Título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...INK);
    const titleLines = doc.splitTextToSize(data.title, this.W - this.M * 2);
    doc.text(titleLines, this.M, 92);
    let y = 92 + (titleLines.length - 1) * 30;

    // Subtítulo: ciudad · fecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...INK_SOFT);
    doc.text(`${data.city}  ·  ${data.dateLabel}`, this.M, y + 20);

    // Resumen (paradas · trayecto)
    doc.setFontSize(9.5);
    doc.setTextColor(...INK_FAINT);
    doc.text(`${data.stopsCount} paradas   ·   ${data.totalTravelLabel} en trayectos`, this.M, y + 38);

    // Hairline separadora
    y += 54;
    this.hairline(doc, y);
    return y;
  }

  // ── Bloque de una parada ────────────────────────────────────────────────────
  private stopBlock(doc: jsPDF, stop: PdfStop, yStart: number): number {
    const contentW = this.W - this.M * 2;
    const textX = this.M + 46;
    const textW = contentW - 46;

    // Estimar alto del bloque para decidir salto de página
    doc.setFontSize(13);
    const nameLines = doc.splitTextToSize(stop.name, textW);
    doc.setFontSize(9.5);
    const addrLines = doc.splitTextToSize(stop.address, textW);
    const notesLines = stop.notes ? doc.splitTextToSize(stop.notes, textW) : [];
    const blockH = 20 + nameLines.length * 16 + 14 + addrLines.length * 13
                 + (notesLines.length ? notesLines.length * 12 + 6 : 0) + 22;

    let y = yStart;
    // Etiqueta de trayecto (entre paradas) antes del bloque
    if (stop.travel) {
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...INK_FAINT);
      doc.text(`↓  ${stop.travel}`, textX, y);
      y += 8;
    }

    // Salto de página si no cabe
    if (y + blockH > this.H - 60) {
      doc.addPage();
      y = 64;
    }

    const top = y + 14;
    const [cr, cg, cb] = hexToRgb(stop.color);

    // Círculo numerado con el color del tramo
    doc.setFillColor(cr, cg, cb);
    doc.circle(this.M + 12, top + 6, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(String(stop.order), this.M + 12, top + 10, { align: 'center' });

    // Hora (encima del nombre, en el color de acento suave)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(cr, cg, cb);
    doc.text(`${stop.startTime} – ${stop.endTime}`, textX, top);

    // Nombre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(nameLines, textX, top + 18);
    let cursor = top + 18 + (nameLines.length - 1) * 16;

    // Categoría · duración
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK_SOFT);
    doc.text(`${stop.categoryLabel}  ·  ${stop.durationLabel}`, textX, cursor + 15);
    cursor += 15;

    // Dirección
    doc.setFontSize(9.5);
    doc.setTextColor(...INK_FAINT);
    doc.text(addrLines, textX, cursor + 15);
    cursor += 15 + (addrLines.length - 1) * 13;

    // Notas (opcional, en itálica)
    if (notesLines.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...INK_SOFT);
      doc.text(notesLines, textX, cursor + 15);
      cursor += 15 + (notesLines.length - 1) * 12;
    }

    // Hairline al final del bloque
    const end = cursor + 18;
    this.hairline(doc, end);
    return end;
  }

  private hairline(doc: jsPDF, y: number): void {
    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.75);
    doc.line(this.M, y, this.W - this.M, y);
  }

  private footer(doc: jsPDF): void {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...INK_FAINT);
      doc.text('Generado con SpotFinder', this.M, this.H - 28);
      doc.text(`${i} / ${pages}`, this.W - this.M, this.H - 28, { align: 'right' });
    }
  }
}
