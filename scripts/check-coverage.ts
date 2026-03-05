import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

// @req SCD-UI-010
type Req = { id: string; title: string; description: string };
type ReqFile = { requirements: Req[] };

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".js") || p.endsWith(".mjs")) out.push(p);
  }
  return out;
}

async function main() {
  const root = process.cwd();
  const yamlPath = path.join(root, "requirements.yaml");
  const yamlText = await readFile(yamlPath, "utf-8");
  const parsed = YAML.parse(yamlText) as ReqFile;

  const reqIds = parsed.requirements.map((r) => r.id);
  const files = await walk(root);

  const found = new Set<string>();
  const pattern = /@req\s+(SCD-UI-\d{3})/g;

  for (const f of files) {
    const txt = await readFile(f, "utf-8");
    for (const m of txt.matchAll(pattern)) {
      found.add(m[1]!);
    }
  }

  const missing = reqIds.filter((id) => !found.has(id));
  const coverage = Math.round((found.size / reqIds.length) * 1000) / 10;

  console.log(`Traceability coverage: ${found.size}/${reqIds.length} (${coverage}%)`);
  if (missing.length) {
    console.log("Missing @req for:");
    for (const id of missing) console.log(`- ${id}`);
    process.exit(1);
  }
  console.log("All requirements have at least one @req annotation.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
