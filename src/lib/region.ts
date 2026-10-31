/**
 * Regional rollup: which province or city each project belongs to.
 *
 * A project goes to the first area whose DPWH office lists it; failing that,
 * the first area whose place name its title carries. Anything left (a Central
 * Office line naming the whole region, say) is "Region-wide or unassigned".
 */
import type { PortalConfig } from '../config';
import type { ScopedProject } from './scope';
import { summarise, type Summary } from './scope';

export const UNASSIGNED = 'Region-wide or unassigned';

export function areaOf(config: PortalConfig, p: ScopedProject): string {
  const areas = config.rollup ?? [];
  const office = areas.find((a) => p.office && a.offices?.includes(p.office))
    ?? areas.find((a) => p.reasons.some((r) => r.kind === 'office' && a.offices?.includes(r.label)));
  if (office) return office.label;
  const place = areas.find((a) => p.reasons.some((r) => r.kind === 'place' && a.places?.includes(r.label)));
  return place?.label ?? UNASSIGNED;
}

export interface AreaRow {
  label: string;
  summary: Summary;
}

export function rollup(config: PortalConfig, projects: readonly ScopedProject[]): AreaRow[] {
  const labels = [...(config.rollup ?? []).map((a) => a.label), UNASSIGNED];
  const buckets = new Map<string, ScopedProject[]>(labels.map((l) => [l, []]));
  for (const p of projects) buckets.get(areaOf(config, p))!.push(p);
  return labels
    .map((label) => ({ label, summary: summarise(buckets.get(label)!) }))
    .filter((r) => r.label !== UNASSIGNED || r.summary.rows > 0);
}
