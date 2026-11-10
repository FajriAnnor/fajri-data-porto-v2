/*
 * Link URLs, stat-tile numbers and experience dates.
 * All visible copy is written in index.html so the page reads without JS;
 * main.js applies the values below on top of the HTML defaults.
 * Keep this file and index.html in sync.
 */
window.SITE = {
  links: {
    linkedin: 'https://www.linkedin.com/in/fajri-3367772bb/',
    github: 'https://github.com/FajriAnnor',
    email: 'mailto:fajriaanr@gmail.com',
    resume: '/resume/Fajri_Resume.pdf',
    tableau: 'https://public.tableau.com/app/profile/fajri.annor/viz/WEDISON_Synthetic_Portfolio/WEDISONEXECUTIVEDASHBOARD',
    salesReportingRepo: 'https://github.com/FajriAnnor/automated-sales-reporting',
    rtoDemo: 'https://rto-request-monitoring.vercel.app/'
  },

  // Stat-tile values. Projects = synthetic demo data. Experience = real work. Never mix.
  stats: {
    wedisonAnalytics: { units: '135', downPayment: 'Rp 56,4 jt', branches: '4' },
    salesReporting: { rawRows: '255', validationRate: '89,41%', sheets: '7' },
    rtoMonitoring: { requests: '623', approved: '88,8%', avgDays: '0,9' },
    wedison: { stnkBpkb: '~150', rto: 'up to 236', process: 'Paper → Web' },
    berkah: { records: '~3,000', products: '~200', branches: '2', report: 'Monthly' }
  },

  // About > "Currently learning" cards (rendered from here when JS runs; index.html has the same two as a no-JS copy).
  // `issuer` and `url` are optional: give an entry both and its card shows a footer row (issuer + "View" link).
  // Leave them empty for now.
  learning: [
    { status: 'In progress', title: 'Python for Data Cleaning & Automation', issuer: '', url: '' },
    { status: 'In progress', title: 'Advanced SQL & Analytical Workflows', issuer: '', url: '' }
  ],

  // Leave empty to hide. A date is only rendered when a value is provided.
  dates: {
    wedison: '',
    berkah: ''
  }
};
