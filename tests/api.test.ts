import { describe, expect, test } from "vitest";
import path from "node:path";
import { createMockProvider } from "../lib/mockProvider";

// @req SCD-UI-010
describe("mock provider", () => {
  test("loads valid stats and lists", async () => {
    // @req SCD-UI-001
    const api = createMockProvider({ dataDir: path.join(process.cwd(), "data") });
    const stats = await api.getStats();
    expect(stats.ok).toBe(true);
    if (stats.ok) expect(stats.data.coverage).toBe(62.5);

    // @req SCD-UI-002
    const reqs = await api.listRequirements();
    expect(reqs.ok).toBe(true);
    if (reqs.ok) expect(reqs.data).toHaveLength(8);
  });

  test("detects empty file as bad_response", async () => {
    // @req SCD-UI-008
    const tmp = path.join(process.cwd(), ".tmp-test-data");
    await (await import("node:fs/promises")).mkdir(tmp, { recursive: true });
    await (await import("node:fs/promises")).writeFile(path.join(tmp, "stats.json"), "");
    const api = createMockProvider({ dataDir: tmp });
    const res = await api.getStats();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.kind).toBe("bad_response");
  });
});
