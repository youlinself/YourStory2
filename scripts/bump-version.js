import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function bumpVersion(currentVersion, type) {
  const parts = currentVersion.split('.').map(Number);

  while (parts.length < 3) {
    parts.push(0);
  }

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
      parts[2]++;
      break;
    default:
      console.error(`错误: 不支持的版本递增类型 "${type}"`);
      console.error('支持的类型: major, minor, patch');
      process.exit(1);
  }

  return parts.join('.');
}

function main() {
  const type = process.argv[2];

  if (!type) {
    console.error('用法: node scripts/bump-version.js <major|minor|patch>');
    process.exit(1);
  }

  const versionFile = join(rootDir, 'version.json');
  const versionData = JSON.parse(readFileSync(versionFile, 'utf-8'));

  const oldVersion = versionData.version;
  const newVersion = bumpVersion(oldVersion, type);

  versionData.version = newVersion;
  versionData.releaseDate = new Date().toISOString().split('T')[0];

  writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n', 'utf-8');

  console.log(`版本号已更新: ${oldVersion} → ${newVersion} (${type})`);
}

main();
