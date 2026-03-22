const fs = require('fs');
const path = require('path');

const packages = [
  { name: 'apps/frontend', coveragePath: 'apps/frontend/coverage/unit' },
  { name: 'apps/s3-gateway', coveragePath: 'apps/s3-gateway/coverage' },
  { name: 'apps/backend', coveragePath: 'apps/backend/coverage' },
  { name: 'packages/cache', coveragePath: 'packages/cache/coverage' },
  { name: 'packages/core-client', coveragePath: 'packages/core-client/coverage' },
  { name: 'packages/core-shared', coveragePath: 'packages/core-shared/coverage' },
  { name: 'packages/db', coveragePath: 'packages/db/coverage' },
  { name: 'packages/graphql', coveragePath: 'packages/graphql/coverage' },
  { name: 'packages/media', coveragePath: 'packages/media/coverage' },
];

console.log('| Package | Statements | Branches | Functions | Lines |');
console.log('|---|---|---|---|---|');

packages.forEach(pkg => {
  const indexPath = path.join(process.cwd(), pkg.coveragePath, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');

    const extractMetric = metricName => {
      const metricRegex = new RegExp(
        `<span class="strong">([\\d\\.]+)% <\\/span>[\\s\\n]*<span class="quiet">${metricName}<\\/span>`,
        'm'
      );
      const match = content.match(metricRegex);
      return match ? match[1] + '%' : 'N/A';
    };

    const statements = extractMetric('Statements');
    const branches = extractMetric('Branches');
    const functions = extractMetric('Functions');
    const lines = extractMetric('Lines');

    console.log(`| ${pkg.name} | ${statements} | ${branches} | ${functions} | ${lines} |`);
  } else {
    // Check if json summary exists just in case
    const jsonSummaryPath = path.join(process.cwd(), pkg.coveragePath, 'coverage-summary.json');
    if (fs.existsSync(jsonSummaryPath)) {
      try {
        const summary = JSON.parse(fs.readFileSync(jsonSummaryPath, 'utf8'));
        const statements = summary.total.statements.pct + '%';
        const branches = summary.total.branches.pct + '%';
        const functions = summary.total.functions.pct + '%';
        const lines = summary.total.lines.pct + '%';
        console.log(`| ${pkg.name} | ${statements} | ${branches} | ${functions} | ${lines} |`);
      } catch {
        console.log(`| ${pkg.name} | Error parsing JSON | - | - | - |`);
      }
    } else {
      console.log(`| ${pkg.name} | Not Found | - | - | - |`);
    }
  }
});
