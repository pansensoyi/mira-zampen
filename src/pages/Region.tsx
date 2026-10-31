import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHead } from '../components/Chrome';
import { Await } from '../components/Bits';
import { usePortal } from '../lib/portal-context';
import { rollup } from '../lib/region';
import { summarise, type ScopedProject } from '../lib/scope';
import { count, php, phpDelta } from '../lib/format';
import { useTitle } from '../lib/use-title';
import { shortNameOf } from '../config';

/** NEP vs House bill, and insertion candidates, province by province. */
export default function Region() {
  const { config, scope } = usePortal();
  useTitle(`By province · ${shortNameOf(config)}`);
  return (
    <main className="page main">
      <PageHead eyebrow="FY 2027 · NEP vs House Bill 10858" title="Province by province">
        The President's budget (NEP) and the House version of the same budget, totalled for each province and
        city of {config.name}. <strong>House only</strong> lines are in the House bill but not in the NEP: these are
        the <em>insertion candidates</em>. <strong>NEP only</strong> lines were proposed by the President and are not
        in the House bill.
      </PageHead>
      <Await state={scope} what="the region's projects">
        {(s) => <RollupTable projects={s.projects} />}
      </Await>
    </main>
  );
}

function RollupTable({ projects }: { projects: ScopedProject[] }) {
  const { config } = usePortal();
  const rows = useMemo(() => rollup(config, projects), [config, projects]);
  const total = useMemo(() => summarise(projects), [projects]);
  const maxIns = Math.max(1, ...rows.map((r) => r.summary.groups.house_only.house_php));
  return (
    <>
      <div className="rtable-wrap">
        <table className="rtable rtable-cards">
          <thead>
            <tr>
              <th>Province / city</th>
              <th className="r">Projects</th>
              <th className="r">NEP</th>
              <th className="r">House bill</th>
              <th className="r">Change</th>
              <th className="r">House only (insertions)</th>
              <th className="r">NEP only (dropped)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, summary: s }) => {
              const ins = s.groups.house_only;
              const link = `/?area=${encodeURIComponent(label)}`;
              return (
                <tr key={label}>
                  <td data-label="Province / city"><Link to={link}><strong>{label}</strong></Link></td>
                  <td data-label="Projects" className="r">{count(s.rows)}</td>
                  <td data-label="NEP" className="r">{php(s.nep.php)}</td>
                  <td data-label="House bill" className="r">{php(s.house.php)}</td>
                  <td data-label="Change" className="r">{phpDelta(s.house.php - s.nep.php)}</td>
                  <td data-label="House only (insertions)" className="r">
                    <Link to={`${link}&status=house_only`}>{count(ins.rows)} · {php(ins.house_php)}</Link>
                    <div className="bar" aria-hidden="true"><span style={{ width: `${(ins.house_php / maxIns) * 100}%` }} /></div>
                  </td>
                  <td data-label="NEP only (dropped)" className="r">
                    <Link to={`${link}&status=nep_only`}>{count(s.groups.nep_only.rows)} · {php(s.groups.nep_only.nep_php)}</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td data-label="Province / city">All of {shortNameOf(config)}</td>
              <td data-label="Projects" className="r">{count(total.rows)}</td>
              <td data-label="NEP" className="r">{php(total.nep.php)}</td>
              <td data-label="House bill" className="r">{php(total.house.php)}</td>
              <td data-label="Change" className="r">{phpDelta(total.house.php - total.nep.php)}</td>
              <td data-label="House only (insertions)" className="r">{count(total.groups.house_only.rows)} · {php(total.groups.house_only.house_php)}</td>
              <td data-label="NEP only (dropped)" className="r">{count(total.groups.nep_only.rows)} · {php(total.groups.nep_only.nep_php)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="fine">
        Covers the four programs the bills list project by project: DPWH, farm-to-market roads, health facilities and
        irrigation. The NEP and the House bill are two versions of one budget, so their totals are compared, never
        added. A "House only" line is a candidate, not proof of wrongdoing: open it to see both source pages. A
        project is counted under the province of its DPWH office, or else the place its title names.
      </p>
    </>
  );
}
