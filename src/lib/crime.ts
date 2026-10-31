/**
 * Crime figures for the /crimen page, from public/data/crime.csv.
 * The PNP publishes no open API, so this file is kept by hand: one row per
 * area, period and crime type, each with its source. Nothing is estimated.
 */
export interface CrimeRow {
  area: string;
  period_start: string;
  period_end: string;
  crime_type: string;
  incidents: number;
  population: number | null;
  population_source: string;
  source_title: string;
  source_url: string;
  notes: string;
}

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

export function toCrimeRows(text: string): CrimeRow[] {
  const [head, ...body] = parseCsv(text);
  if (!head) return [];
  const idx = (k: string) => head.indexOf(k);
  const get = (r: string[], k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? '').trim() : '');
  return body.map((r) => {
    const pop = Number(get(r, 'population').replace(/,/g, ''));
    return {
      area: get(r, 'area'),
      period_start: get(r, 'period_start'),
      period_end: get(r, 'period_end'),
      crime_type: get(r, 'crime_type') || 'All reported crimes',
      incidents: Number(get(r, 'incidents').replace(/,/g, '')) || 0,
      population: Number.isFinite(pop) && pop > 0 ? pop : null,
      population_source: get(r, 'population_source'),
      source_title: get(r, 'source_title'),
      source_url: get(r, 'source_url'),
      notes: get(r, 'notes'),
    };
  });
}

/** Incidents per 100,000 people for the row's period (not annualised). */
export function ratePer100k(r: CrimeRow): number | null {
  return r.population ? (r.incidents / r.population) * 100_000 : null;
}

/** Days in the period, inclusive; null if a date is missing. */
export function periodDays(r: CrimeRow): number | null {
  const a = Date.parse(r.period_start);
  const b = Date.parse(r.period_end);
  return Number.isFinite(a) && Number.isFinite(b) && b >= a ? Math.round((b - a) / 86_400_000) + 1 : null;
}
