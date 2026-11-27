import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const build = join(root, ".build");
const app = join(build, "app");
const manifest = await Bun.file(join(root, "package.json")).json() as { version: string; dependencies: Record<string, string> };

await rm(app, { recursive: true, force: true });
await mkdir(app, { recursive: true });
for (const part of ["main", "preload", "renderer"])
{
    await cp(join(build, part), join(app, part), { recursive: true });
}
await writeFile(join(app, "package.json"), JSON.stringify({
    name: "hara",
    productName: "HARA",
    version: manifest.version,
    private: true,
    main: "main/index.js",
    dependencies: { serialport: manifest.dependencies.serialport },
}, null, 4));
