import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

async function collectJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectJsFiles(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      return [fullPath];
    }
    return [];
  }));

  return files.flat();
}

function checkFile(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--check', filePath], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Syntax check failed for ${filePath}`));
    });

    child.on('error', reject);
  });
}

try {
  const files = await collectJsFiles(srcDir);
  for (const filePath of files) {
    await checkFile(filePath);
  }
  console.log(`Frontend syntax OK (${files.length} files checked).`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
