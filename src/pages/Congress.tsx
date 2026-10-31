/**
 * By congressman: each legislative district in the portal, its representative,
 * and the House-only lines (insertion candidates) of the DPWH offices serving it.
 *
 * Nothing here says who asked for a line. No official record does. A district
 * served by a shared (Tier B) office carries that office's whole figure, never
 * a split, and says so; such figures must not be added across districts.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { DistrictCard, Envelope } from '../api/types';
import { PageHead } from '../components/Chrome';
import { Await, External } from '../components/Bits';
import { usePortal } from '../lib/portal-context';
import { summarise, type ScopeResult } from '../lib/scope';
import { count, php, phpDelta } from '../lib/format';
import { useTitle } from '../lib/use-title';
import { shortNameOf } from '../config';

export default function Congress() {
  const { config, scope, districts } = usePortal();
  useTitle(`By congressman · ${shortNameOf(config)}`);
  return (
    <main className="page main">
      <PageHead eyebrow="FY 2027 · House Bill 10858 · by legislative district" title="By congressman">
        Each congressional district in {config.name}, its representative, and the House-only lines in the DPWH
        offices that serve it: projects in the House bill that were not in the President's NEP.
      </PageHead>
      <div className="callout">
        <p><strong>In the district, not "by" the congressman.</strong> No official record shows which legislator asked
          for a line. These figures say what was added to projects <em>in</em> a district, not who added them.</p>
        <p><strong>Tier A</strong>: the DPWH office serves only this district, so its lines are this district's.{' '}
          <strong>Tier B</strong>: the office is shared with other districts; its whole figure is shown for each of
          them and is never split, so do not add Tier B rows together.</p>
      </div>
      <Await state={scope} what="the region's projects">
        {(s) => (
          <Await state={districts} what="districts and representatives">
            {(list) => <Table scope={s} cards={list} />}
          </Await>
        )}
      </Await>
    </main>
  );
}

function Table({ scope, cards }: { scope: ScopeResult; cards: Envelope<DistrictCard>[] }) {
  const { config } = usePortal();
  const rows = useMemo(() => {
    // Office id (the API's) → the office name as printed on project rows.
    const printed = new Map<string, string>();
    for (const q of scope.queries) for (const o of q.officeLens?.offices ?? []) printed.set(o.id, q.officeLens?.printed_office ?? q.label);
    const region = config.scope.places?.find((p) => p.region)?.region;
    return cards
      .map((e) => e.data)
      .filter((c) => !region || c.region_key == null || c.region_key === region)
      .map((card) => {
        const names = new Set(card.offices.map((o) => printed.get(o.id) ?? o.name));
        const lines = scope.projects.filter((p) => p.office && names.has(p.office));
        const s = summarise(lines);
        const shared = card.offices.some((o) => o.tier === 'B');
        return { card, s, shared, officeNames: [...names] };
      })
      .sort((a, b) => b.s.groups.house_only.house_php - a.s.groups.house_only.house_php || a.card.label.localeCompare(b.card.label));
  }, [scope, cards, config]);

  if (!rows.length) {
    return <p className="state">No districts found. Check the DPWH office names in portal.config.ts with <code>npm run check</code>.</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.s.groups.house_only.house_php));
  return (
    <>
      <div className="rtable-wrap">
        <table className="rtable rtable-cards">
          <thead>
            <tr>
              <th>District</th>
              <th>Representative</th>
              <th>Tier</th>
              <th className="r">NEP</th>
              <th className="r">House bill</th>
              <th className="r">Change</th>
              <th className="r">House only (insertions)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ card, s, shared, officeNames }) => {
              const ins = s.groups.house_only;
              const rep = card.representative;
              const office = officeNames.length === 1 ? `&office=${encodeURIComponent(officeNames[0])}` : '';
              return (
                <tr key={card.id}>
                  <td data-label="District">
                    <span>
                      <strong>{card.label}</strong>
                      <div className="muted small">{officeNames.join(' · ')}</div>
                    </span>
                  </td>
                  <td data-label="Representative">
                    {rep ? (
                      <span>
                        {rep.profile_url ? <External href={rep.profile_url}>{rep.name}</External> : rep.name}
                        {rep.status_note && <div className="muted small">{rep.status_note}</div>}
                      </span>
                    ) : '—'}
                  </td>
                  <td data-label="Tier">
                    <span className={`tag ${shared ? 'tag-warn' : 'tag-office'}`} title={card.attribution.meaning}>
                      {shared ? 'B · shared office' : 'A'}
                    </span>
                  </td>
                  <td data-label="NEP" className="r">{php(s.nep.php)}</td>
                  <td data-label="House bill" className="r">{php(s.house.php)}</td>
                  <td data-label="Change" className="r">{phpDelta(s.house.php - s.nep.php)}</td>
                  <td data-label="House only (insertions)" className="r">
                    {ins.rows && office ? (
                      <Link to={`/?status=house_only${office}`}>{count(ins.rows)} · {php(ins.house_php)}</Link>
                    ) : (
                      <>{count(ins.rows)} · {php(ins.house_php)}</>
                    )}
                    <div className="bar" aria-hidden="true"><span style={{ width: `${(ins.house_php / max) * 100}%` }} /></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="fine">
        Figures are the lines the budget documents list under each district's DPWH offices (DPWH program only:
        farm-to-market roads, health facilities and irrigation have no office). Lines found only because their title
        names a place are on the province page, not here. Representatives and tiers come from the BetterGov.ph Budget API.
      </p>
    </>
  );
}
