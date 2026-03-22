#!/usr/bin/env node

import { spawn } from 'node:child_process';

const ANSI_REGEX = /\x1B\[[0-9;]*m/g;

const totals = {
  testFiles: { passed: 0, failed: 0, skipped: 0, total: 0 },
  tests: { passed: 0, failed: 0, skipped: 0, total: 0 },
};

function parseLine(rawLine) {
  const line = rawLine.replace(ANSI_REGEX, '');

  const files = line.match(
    /Test Files\s+(\d+)\s+passed(?:\s+\|\s+(\d+)\s+failed)?(?:\s+\|\s+(\d+)\s+skipped)?\s+\((\d+)\)/
  );
  if (files) {
    totals.testFiles.passed += Number(files[1] || 0);
    totals.testFiles.failed += Number(files[2] || 0);
    totals.testFiles.skipped += Number(files[3] || 0);
    totals.testFiles.total += Number(files[4] || 0);
    return;
  }

  const tests = line.match(
    /Tests\s+(\d+)\s+passed(?:\s+\|\s+(\d+)\s+failed)?(?:\s+\|\s+(\d+)\s+skipped)?\s+\((\d+)\)/
  );
  if (tests) {
    totals.tests.passed += Number(tests[1] || 0);
    totals.tests.failed += Number(tests[2] || 0);
    totals.tests.skipped += Number(tests[3] || 0);
    totals.tests.total += Number(tests[4] || 0);
  }
}

function formatSummaryRow(label, row) {
  const parts = [`${row.passed} passed`];
  if (row.failed > 0) {
    parts.push(`${row.failed} failed`);
  }
  if (row.skipped > 0) {
    parts.push(`${row.skipped} skipped`);
  }
  return `${label}: ${parts.join(' | ')} (${row.total})`;
}

const args = [
  '-r',
  '--stream',
  '--if-present',
  '--workspace-concurrency=1',
  '--filter',
  './apps/*',
  '--filter',
  '!./apps/frontend',
  '--filter',
  './packages/*',
  'test',
];

const env = {
  ...process.env,
  NODE_OPTIONS: `--max-old-space-size=${process.env.TEST_MAX_OLD_SPACE_SIZE || '4096'}`,
};

const child = spawn('pnpm', args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  env,
});

let stdoutBuffer = '';
let stderrBuffer = '';

child.stdout.on('data', chunk => {
  const text = chunk.toString();
  process.stdout.write(text);
  stdoutBuffer += text;

  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop() ?? '';
  for (const line of lines) {
    parseLine(line);
  }
});

child.stderr.on('data', chunk => {
  const text = chunk.toString();
  process.stderr.write(text);
  stderrBuffer += text;

  const lines = stderrBuffer.split('\n');
  stderrBuffer = lines.pop() ?? '';
  for (const line of lines) {
    parseLine(line);
  }
});

child.on('close', code => {
  if (stdoutBuffer) parseLine(stdoutBuffer);
  if (stderrBuffer) parseLine(stderrBuffer);

  process.stdout.write('\n=== Combined Vitest Summary ===\n');
  process.stdout.write(`${formatSummaryRow('Test Files', totals.testFiles)}\n`);
  process.stdout.write(`${formatSummaryRow('Tests', totals.tests)}\n`);

  process.exit(code ?? 1);
});
