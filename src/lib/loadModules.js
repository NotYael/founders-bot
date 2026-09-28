import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Recursively imports every .js file in a directory and returns their default exports.
 * Lets you organize commands into subfolders (e.g. commands/utility, commands/fun).
 */
export async function loadModules(dir) {
  const modules = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);

    if (statSync(fullPath).isDirectory()) {
      modules.push(...(await loadModules(fullPath)));
    } else if (entry.endsWith('.js')) {
      const mod = await import(pathToFileURL(fullPath).href);
      modules.push({ file: fullPath, module: mod.default });
    }
  }

  return modules;
}
