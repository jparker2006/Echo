import type { Header, Seat } from "./types";

// Distinct token colors that read on the dark cream/rust theme (not the UI accent).
export const SEAT_COLORS: Record<Seat, string> = {
  0: "#5aa9e6", // GPT-5.2 — blue
  1: "#d98695", // Claude — rose
  2: "#7cc96b", // Kimi — green (the winner)
  3: "#b69ce6", // MiMo — violet
};

export const SEAT_INITIALS: Record<Seat, string> = { 0: "G", 1: "C", 2: "K", 3: "M" };

export function seatName(header: Header, seat: number): string {
  return header.display?.[String(seat)]?.name ?? header.seats?.[String(seat)] ?? `P${seat}`;
}

export function seatLab(header: Header, seat: number): string {
  return header.display?.[String(seat)]?.lab ?? "";
}
