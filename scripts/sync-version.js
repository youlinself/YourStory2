import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function readJson(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function writeJson(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function updateCargoToml(filePath, version) {
  let content = readFileSync(filePath, 'utf-8');
  content = content.replace(
    /^version\s*=\s*"[^"]*"/m,
    `version = "${version}"`
  );
  writeFileSync(filePath, content, 'utf-8');
}

function main() {
  const versionFile = join(rootDir, 'version.json');
  const versionData = readJson(versionFile);
  const { version, productName } = versionData;

  if (!version) {
    console.error('错误: version.json 中没有找到 version 字段');
    process.exit(1);
  }

  console.log(`正在同步版本号到: ${version}`);

  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = readJson(packageJsonPath);
  packageJson.version = version;
  writeJson(packageJsonPath, packageJson);
  console.log('  ✓ package.json 已更新');

  const tauriConfPath = join(rootDir, 'src-tauri', 'tauri.conf.json');
  const tauriConf = readJson(tauriConfPath);
  tauriConf.version = version;
  if (productName) {
    tauriConf.productName = productName;
  }
  writeJson(tauriConfPath, tauriConf);
  console.log('  ✓ src-tauri/tauri.conf.json 已更新');

  const cargoTomlPath = join(rootDir, 'src-tauri', 'Cargo.toml');
  updateCargoToml(cargoTomlPath, version);
  console.log('  ✓ src-tauri/Cargo.toml 已更新');

  console.log('\n版本同步完成！');
}

main();
