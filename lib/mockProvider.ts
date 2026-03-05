import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  type Annotation,
  type ApiResult,
  type Requirement,
  type RequirementDetail,
  type ScanStatus,
  type Stats,
  type Task
} from "./types";
import { AnnotationSchema, RequirementSchema, StatsSchema, TaskSchema, ScanStatusSchema } from "./schemas";

export interface MockProviderOptions {
  dataDir?: string;
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}
function fail(message: string, kind: "bad_response" | "unknown" = "bad_response"): ApiResult<never> {
  return { ok: false, error: { kind, message } };
}

async function loadJson<T>(filePath: string, schema: { parse: (v: unknown) => T }): Promise<ApiResult<T>> {
  try {
    const raw = await readFile(filePath, "utf-8");
    if (!raw.trim()) return fail(`Empty file: ${path.basename(filePath)}`);
    const parsed = JSON.parse(raw) as unknown;
    const data = schema.parse(parsed);
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return fail(`Failed to load ${path.basename(filePath)}: ${msg}`);
  }
}

export function createMockProvider(opts: MockProviderOptions = {}) {
  const dataDir = opts.dataDir ?? path.join(process.cwd(), "data");

  return {
    // @req SCD-UI-010 (enables deterministic tests via stable fixtures)
    async getStats(): Promise<ApiResult<Stats>> {
      return loadJson(path.join(dataDir, "stats.json"), StatsSchema);
    },

    async listRequirements(): Promise<ApiResult<Requirement[]>> {
      return loadJson(path.join(dataDir, "requirements.json"), { parse: (v) => RequirementSchema.array().parse(v) });
    },

    async listAnnotations(): Promise<ApiResult<Annotation[]>> {
      return loadJson(path.join(dataDir, "annotations.json"), { parse: (v) => AnnotationSchema.array().parse(v) });
    },

    async listTasks(): Promise<ApiResult<Task[]>> {
      return loadJson(path.join(dataDir, "tasks.json"), { parse: (v) => TaskSchema.array().parse(v) });
    },

    async getRequirement(id: string): Promise<ApiResult<RequirementDetail>> {
      const reqRes = await this.listRequirements();
      if (!reqRes.ok) return reqRes as ApiResult<never>;

      const annRes = await this.listAnnotations();
      if (!annRes.ok) return annRes as ApiResult<never>;

      const taskRes = await this.listTasks();
      if (!taskRes.ok) return taskRes as ApiResult<never>;

      const req = reqRes.data.find((r) => r.id === id);
      if (!req) {
        return { ok: false, error: { kind: "not_found", status: 404, message: `Requirement not found: ${id}` } };
      }

      const annotations = annRes.data.filter((a) => a.reqId === id);
      const tasks = taskRes.data.filter((t) => t.requirementId === id);

      return ok({ ...req, annotations, tasks });
    },

    async triggerScan(): Promise<ApiResult<ScanStatus>> {
      // mock: scan started (OpenAPI says /scan POST returns ScanStatus)
      return ok(ScanStatusSchema.parse({ status: "scanning", startedAt: new Date().toISOString() }));
    },

    async getScanStatus(): Promise<ApiResult<ScanStatus>> {
      return ok(ScanStatusSchema.parse({ status: "idle", startedAt: new Date().toISOString() }));
    }
  };
}