// lib/api.ts
import { z } from "zod";
import {
  type Annotation,
  type ApiError,
  type ApiResult,
  type ListAnnotationsFilters,
  type ListRequirementsFilters,
  type ListTasksFilters,
  type Requirement,
  type RequirementDetail,
  type ScanStatus,
  type Stats,
  type Task
} from "@/lib/types";

import {
  AnnotationsSchema,
  ErrorResponseSchema,
  RequirementDetailSchema,
  RequirementsSchema,
  ScanStatusSchema,
  StatsSchema,
  TasksSchema
} from "@/lib/schemas";

type Schema<T> = z.ZodType<T, z.ZodTypeDef, unknown>;

/**
 * ✅ ВАЖНО:
 * - Для GitHub Pages (static export) API-mode должен быть выключен, чтобы не было fetch на build/runtime.
 * - API-mode включается ТОЛЬКО если явно выставлен NEXT_PUBLIC_API_MODE=true
 *   и задан NEXT_PUBLIC_API_URL.
 *
 * Локально (Prism):
 *   NEXT_PUBLIC_API_MODE=true
 *   NEXT_PUBLIC_API_URL=http://localhost:4010
 *
 * GitHub Pages:
 *   (ничего не задаём) -> читаем данные из /data/*.json
 */
const isApiMode = (): boolean => {
  const enabled = process.env.NEXT_PUBLIC_API_MODE === "true";
  const url = process.env.NEXT_PUBLIC_API_URL;
  return enabled && typeof url === "string" && url.trim().length > 0;
};

const apiBaseUrl = (): string => (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function err(kind: ApiError["kind"], message: string, status?: number): ApiResult<never> {
  return { ok: false, error: { kind, message, status } };
}

function formatZodError(e: z.ZodError): string {
  // компактно, но информативно: "path: message"
  return e.issues
    .map((iss) => {
      const path = iss.path.length ? iss.path.join(".") : "(root)";
      return `${path}: ${iss.message}`;
    })
    .join("; ");
}

function extractErrorMessage(json: unknown, fallback: string): string {
  const parsed = ErrorResponseSchema.safeParse(json);
  return parsed.success ? parsed.data.message : fallback;
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function httpRequest<T>(
  method: "GET" | "POST",
  path: string,
  schema: Schema<T>,
  opts?: {
    expectedStatus?: number | number[];
  }
): Promise<ApiResult<T>> {
  const url = `${apiBaseUrl()}${path}`;
  const expected = opts?.expectedStatus;

  try {
    const res = await fetch(url, { method, cache: "no-store" });
    const json = await parseJsonSafe(res);

    // strict expected status (например POST /scan -> 202)
    if (typeof expected === "number" && res.status !== expected) {
      const msg = extractErrorMessage(json, `HTTP ${res.status}`);
      return err("unknown", msg, res.status);
    }
    if (Array.isArray(expected) && !expected.includes(res.status)) {
      const msg = extractErrorMessage(json, `HTTP ${res.status}`);
      return err("unknown", msg, res.status);
    }

    if (res.status === 404) {
      return err("not_found", extractErrorMessage(json, "Not found"), 404);
    }

    if (!res.ok) {
      return err("unknown", extractErrorMessage(json, `HTTP ${res.status}`), res.status);
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      const details = formatZodError(parsed.error);
      return err("bad_response", `Malformed response for ${path}: ${details}`, res.status);
    }

    return ok(parsed.data);
  } catch (e) {
    return err("network", e instanceof Error ? e.message : "Network error");
  }
}

async function httpGet<T>(path: string, schema: Schema<T>): Promise<ApiResult<T>> {
  return httpRequest("GET", path, schema);
}

async function httpPost<T>(
  path: string,
  schema: Schema<T>,
  opts?: { expectedStatus?: number | number[] }
): Promise<ApiResult<T>> {
  return httpRequest("POST", path, schema, opts);
}

async function readLocalJson<T>(file: string, schema: Schema<T>): Promise<ApiResult<T>> {
  try {
    // mock mode: import json from /data
    const mod = (await import(`../data/${file}.json`)) as { default: unknown };
    const parsed = schema.safeParse(mod.default);

    if (!parsed.success) {
      const details = formatZodError(parsed.error);
      return err("bad_response", `Malformed mock ${file}.json: ${details}`);
    }

    return ok(parsed.data);
  } catch (e) {
    return err("bad_response", e instanceof Error ? e.message : `Failed to load mock ${file}.json`);
  }
}

function propagateError<T>(res: ApiResult<unknown>): ApiResult<T> {
  return res.ok ? err("bad_response", "Unexpected ok result while propagating error") : (res as ApiResult<T>);
}

// --- Public API ---

export async function getStats(): Promise<ApiResult<Stats>> {
  if (!isApiMode()) return readLocalJson("stats", StatsSchema);
  return httpGet("/stats", StatsSchema);
}

export async function listRequirements(filters?: ListRequirementsFilters): Promise<ApiResult<Requirement[]>> {
  if (!isApiMode()) return readLocalJson("requirements", RequirementsSchema);

  const p = new URLSearchParams();

  // OpenAPI supports single type/status. Preserve UI multi-select:
  const type = filters?.type && filters.type.length === 1 ? filters.type[0] : undefined;
  const status = filters?.status && filters.status.length === 1 ? filters.status[0] : undefined;

  if (type) p.set("type", type);
  if (status) p.set("status", status);

  p.set("sort", filters?.sort ?? "id");
  p.set("order", filters?.order ?? "asc");

  const res = await httpGet(`/requirements?${p.toString()}`, RequirementsSchema);
  if (!res.ok) return res;

  let items = res.data;

  // If multi-selected, additionally filter client-side:
  if (filters?.type && filters.type.length > 1) {
    items = items.filter((r) => filters.type?.includes(r.type) ?? true);
  }
  if (filters?.status && filters.status.length > 1) {
    items = items.filter((r) => filters.status?.includes(r.status) ?? true);
  }

  return ok(items);
}

export async function getRequirement(requirementId: string): Promise<ApiResult<RequirementDetail>> {
  if (!isApiMode()) {
    const reqs = await readLocalJson("requirements", RequirementsSchema);
    if (!reqs.ok) return propagateError<RequirementDetail>(reqs);

    const anns = await readLocalJson("annotations", AnnotationsSchema);
    if (!anns.ok) return propagateError<RequirementDetail>(anns);

    const tasks = await readLocalJson("tasks", TasksSchema);
    if (!tasks.ok) return propagateError<RequirementDetail>(tasks);

    const r = reqs.data.find((x) => x.id === requirementId);
    if (!r) return err("not_found", `Requirement '${requirementId}' not found`, 404);

    const detailCandidate: RequirementDetail = {
      ...r,
      annotations: (anns.data as Annotation[]).filter((a) => a.reqId === requirementId),
      tasks: (tasks.data as Task[]).filter((t) => t.requirementId === requirementId)
    };

    const parsed = RequirementDetailSchema.safeParse(detailCandidate);
    if (!parsed.success) {
      const details = formatZodError(parsed.error);
      return err("bad_response", `Malformed composed requirement detail (mock): ${details}`);
    }

    return ok(parsed.data);
  }

  return httpGet(`/requirements/${encodeURIComponent(requirementId)}`, RequirementDetailSchema);
}

export async function listAnnotations(filters?: ListAnnotationsFilters): Promise<ApiResult<Annotation[]>> {
  if (!isApiMode()) return readLocalJson("annotations", AnnotationsSchema);

  const p = new URLSearchParams();
  if (filters?.type) p.set("type", filters.type);
  if (typeof filters?.orphans === "boolean") p.set("orphans", String(filters.orphans));

  const qs = p.toString();
  return httpGet(`/annotations${qs ? `?${qs}` : ""}`, AnnotationsSchema);
}

export async function listTasks(filters?: ListTasksFilters): Promise<ApiResult<Task[]>> {
  if (!isApiMode()) return readLocalJson("tasks", TasksSchema);

  const p = new URLSearchParams();
  if (filters?.status) p.set("status", filters.status);
  if (typeof filters?.orphans === "boolean") p.set("orphans", String(filters.orphans));
  p.set("sort", filters?.sort ?? "id");
  p.set("order", filters?.order ?? "asc");

  return httpGet(`/tasks?${p.toString()}`, TasksSchema);
}

export async function triggerScan(): Promise<ApiResult<ScanStatus>> {
  if (!isApiMode()) return readLocalJson("scan", ScanStatusSchema);
  // строго: POST /scan -> 202
  return httpPost("/scan", ScanStatusSchema, { expectedStatus: 202 });
}

export async function getScanStatus(): Promise<ApiResult<ScanStatus>> {
  if (!isApiMode()) return readLocalJson("scan", ScanStatusSchema);
  // GET /scan -> 200
  return httpGet("/scan", ScanStatusSchema);
}