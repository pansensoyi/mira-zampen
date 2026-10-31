/**
 * Mira ZamPen: the budget transparency portal for Zamboanga Peninsula (Region IX).
 * What each field means: src/config.ts. Check it against the live API with
 * `npm run check -- --verbose`: an office name that matches nothing shows 0 rows,
 * so fix it to the exact name the API uses (`npm run setup` lists them).
 *
 * Scope: every Region IX DPWH district engineering office, plus every project
 * in the four itemised programs whose title names a Region IX province or city.
 * Basilan (outside Isabela City) is in BARMM, so it is not here.
 */
import { defineConfig } from './src/config';

const ZDN = [
  'Zamboanga del Norte 1st District Engineering Office',
  'Zamboanga del Norte 2nd District Engineering Office',
  'Zamboanga del Norte 3rd District Engineering Office',
  'Zamboanga del Norte 4th District Engineering Office',
];
const ZDS = [
  'Zamboanga del Sur 1st District Engineering Office',
  'Zamboanga del Sur 2nd District Engineering Office',
];
const ZSP = [
  'Zamboanga Sibugay 1st District Engineering Office',
  'Zamboanga Sibugay 2nd District Engineering Office',
];
const ZC = [
  'Zamboanga City 1st District Engineering Office',
  'Zamboanga City 2nd District Engineering Office',
];
const ISA = ['Isabela City District Engineering Office'];

export default defineConfig({
  id: 'zamboanga-peninsula',
  kind: 'region',
  name: 'Zamboanga Peninsula (Region IX)',
  shortName: 'ZamPen',
  operator: { name: 'Mira ZamPen volunteers', url: 'https://github.com/pansensoyi' },
  logo: '/brand/mira-zampen.svg',
  // Set this to your Cloudflare URL or custom domain after the first deploy.
  siteUrl: 'https://portal.zampen-budget-ph.workers.dev',
  buildYourOwnStrip: false,
  brand: {
    title: 'Mira ZamPen',
    greeting: 'Bienvenidos, Zamboangueños!',
    tagline: 'Mira kita: where the 2027 budget goes in Zamboanga Peninsula, project by project.',
    stripe: true,
  },
  scope: {
    offices: [...ZDN, ...ZDS, ...ZSP, ...ZC, ...ISA],
    places: [
      { label: 'Zamboanga del Norte', region: 'IX' },
      { label: 'Zamboanga del Sur', region: 'IX' },
      { label: 'Zamboanga Sibugay', region: 'IX' },
      { label: 'Zamboanga City', region: 'IX' },
      { label: 'Isabela City', region: 'IX' },
      { label: 'Dipolog', region: 'IX' },
      { label: 'Dapitan', region: 'IX' },
      { label: 'Pagadian', region: 'IX' },
    ],
    // Legislative district cards. Run `npm run setup` to list the exact ids.
    districts: [],
    exclude: [],
  },
  rollup: [
    { label: 'Zamboanga del Norte', offices: ZDN, places: ['Zamboanga del Norte', 'Dipolog', 'Dapitan'] },
    { label: 'Zamboanga del Sur', offices: ZDS, places: ['Zamboanga del Sur', 'Pagadian'] },
    { label: 'Zamboanga Sibugay', offices: ZSP, places: ['Zamboanga Sibugay'] },
    { label: 'Zamboanga City', offices: ZC, places: ['Zamboanga City'] },
    { label: 'Isabela City', offices: ISA, places: ['Isabela City'] },
  ],
  crime: { enabled: true },
  reporting: { enabled: false },
});
