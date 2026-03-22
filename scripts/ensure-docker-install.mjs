const isDocker = process.env.DOCKER_CONTAINER === 'true';
const isCi = process.env.CI === 'true';
const isCodespaces = process.env.CODESPACES === 'true';
const bypass = process.env.LIBARK_ALLOW_HOST_PNPM === '1';

if (isDocker || isCi || isCodespaces || bypass) {
  process.exit(0);
}

console.error('ERROR: Host pnpm install is blocked to keep workspace artifacts consistent.');
console.error('Run this instead: docker-compose exec dev pnpm install');
console.error('If you really need host install, set LIBARK_ALLOW_HOST_PNPM=1 for that command.');
process.exit(1);
