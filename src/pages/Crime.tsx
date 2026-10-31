import { useEffect, useMemo, useState } from 'react';
import { PageHead } from '../components/Chrome';
import { External } from '../components/Bits';
import { usePortal } from '../lib/portal-context';
import { periodDays, ratePer100k, toCrimeRows, type CrimeRow } from '../lib/crime';
import { count, date } from '../lib/format';
import { useTitle } from '../lib/use-title';
import { shortNameOf } from '../config';
import { THIS_REPO_URL } from '../lib/links';

type Load = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; rows: CrimeRow[] };

const FOI_TEXT = `Agency: Philippine National Police (PNP)
Title: Crime incidents by city/municipality, Police Regional Office 9 (Zamboanga Peninsula), 2020 to present

Request:
Monthly counts of crime incidents recorded in the PNP Crime Incident Reporting and Analysis System (CIRAS) for every city and municipality under PRO-9 (Zamboanga del Norte, Zamboanga del Sur, Zamboanga Sibugay, Zamboanga City and Isabela City), January 2020 to the latest month available, broken down by the eight focus crimes (murder, homicide, physical injury, rape, robbery, theft, carnapping of motor vehicles, carnapping of motorcycles) and total index and non-index crimes, with crime solution and clearance efficiency.

Format: CSV or Excel (machine-readable), not scanned PDF.
Purpose: Public-interest research for a citizen budget and safety transparency portal.`;

const fmtRate = (n: number | null) => (n == null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 }));

export default function Crime() {
  const { config } = usePortal();
  useTitle(`Crime · ${shortNameOf(config)}`);
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    let live = true;
    fetch('/data/crime.csv')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${r.statusText}`))))
      .then((t) => live && setLoad({ status: 'ready', rows: toCrimeRows(t) }))
      .catch((e: Error) => live && setLoad({ status: 'error', error: e.message }));
    return () => { live = false; };
  }, []);

  return (
    <main className="page main">
      <PageHead eyebrow="Peace and order · Reported to the PNP" title="Crime in Zamboanga Peninsula">
        Crime incidents reported to the Philippine National Police, per 100,000 people, for each province and city.
        Every figure links to its source. Read it beside the budget: where is money going, and where is help needed?
      </PageHead>

      <div className="callout">
        <p><strong>Read with care.</strong> These are crimes <em>reported to and recorded by</em> the PNP, not all
          crime that happens. More reports can mean more trust in police, not only more crime.</p>
        <p>Periods differ between rows. The annualised rate (rate × 365 ÷ days) lets you compare them roughly.</p>
      </div>

      {load.status === 'loading' && <p className="state" role="status"><span className="spinner" aria-hidden="true" /> Loading crime figures…</p>}
      {load.status === 'error' && <p className="state state-error" role="alert">Could not load public/data/crime.csv: {load.error}</p>}
      {load.status === 'ready' && <CrimeTable rows={load.rows} />}

      <section className="section">
        <h2 className="section-h">Get the full data: an FOI request</h2>
        <p className="section-lede">
          The PNP answers Freedom of Information requests for crime statistics. File this on{' '}
          <External href="https://www.foi.gov.ph/agencies/pnp/">foi.gov.ph</External>, then add the figures to{' '}
          <code>public/data/crime.csv</code>, one row per area, period and crime type.
        </p>
        <pre className="foi">{FOI_TEXT}</pre>
        <p className="fine">
          CSV columns: area, period_start, period_end (YYYY-MM-DD), crime_type, incidents, population,
          population_source, source_title, source_url, notes. Use PSA census population for the rate. Edit the file on{' '}
          <External href={`${THIS_REPO_URL}/blob/main/public/data/crime.csv`}>GitHub</External> and the site rebuilds.
        </p>
      </section>
    </main>
  );
}

function CrimeTable({ rows }: { rows: CrimeRow[] }) {
  const ranked = useMemo(
    () => rows.map((r) => {
      const rate = ratePer100k(r);
      const days = periodDays(r);
      return { r, rate, annual: rate != null && days ? (rate * 365) / days : null };
    }).sort((a, b) => (b.annual ?? -1) - (a.annual ?? -1)),
    [rows],
  );
  if (!rows.length) return <p className="state">No figures yet. File the FOI request below, then add rows to the CSV.</p>;
  const max = Math.max(1, ...ranked.map((x) => x.annual ?? 0));
  return (
    <section className="section">
      <h2 className="section-h">Reported incidents</h2>
      <div className="rtable-wrap">
        <table className="rtable rtable-cards">
          <thead>
            <tr>
              <th>Area</th>
              <th>Period</th>
              <th>Crime</th>
              <th className="r">Incidents</th>
              <th className="r">Per 100k (period)</th>
              <th className="r">Per 100k / year</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ r, rate, annual }, i) => (
              <tr key={i}>
                <td data-label="Area"><strong>{r.area}</strong></td>
                <td data-label="Period" className="small">{date(r.period_start)} – {date(r.period_end)}</td>
                <td data-label="Crime">{r.crime_type}</td>
                <td data-label="Incidents" className="r">{count(r.incidents)}</td>
                <td data-label="Per 100k (period)" className="r">{fmtRate(rate)}</td>
                <td data-label="Per 100k / year" className="r">
                  {fmtRate(annual)}
                  <div className="bar" aria-hidden="true"><span style={{ width: `${((annual ?? 0) / max) * 100}%` }} /></div>
                </td>
                <td data-label="Source" className="small">
                  {r.source_url ? <External href={r.source_url}>{r.source_title || 'Source'}</External> : r.source_title}
                  {r.population_source && <div className="muted">Population: {r.population_source}</div>}
                  {r.notes && <div className="muted">{r.notes}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
