// lib/httpProvider.ts
import { z } from "zod";

import {
  type ApiResult,
  type Annotation,
  type Requirement,
  type RequirementDetail,
  type ScanStatus,
  type Stats,
  type Task,
} from "./types";

import {
  AnnotationsSchema,
  RequirementsSchema,
  TasksSchema,
  RequirementDetailSchema,
  ScanStatusSchema,
  StatsSchema,
} from "./schemas";

/**
 * Helper types: строгие Zod схемы без any
 */
type ZodSchema<T> = z.ZodType<T>;

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function err(
  message: string,
  kind: "network" | "not_found" | "bad_response" | "unknown",
  status?: number,
): ApiResult<never> {
  return { ok: false, error: { kind, status, message } };
}

/**
 * Форматируем ZodError в информативный текст:
 * - path: message (expected X, received Y)
 */
function formatZodError(e: z.ZodError): string {
  return e.issues
    .map((iss) => {
      const path = iss.path.length ? iss.path.join(".") : "<root>";
      const details =
        iss.code === "invalid_type"
          ? ` (expected ${iss.expected}, received ${iss.received})`
          : "";
      return `${path}: ${iss.message}${details}`;
    })
    .join("; ");
}

async function readBody(
  res: Response,
): Promise<
  | { kind: "empty" }
  | { kind: "json"; value: unknown }
  | { kind: "text"; value: string }
> {
  const text = await res.text();
  if (!text.trim()) return { kind: "empty" };

  try {
    return { kind: "json", value: JSON.parse(text) as unknown };
  } catch {
    return { kind: "text", value: text };
  }
}

/**
 * Пытаемся вытащить message/error из ErrorResponse-like объектов.
 */
function extractErrorMessageFromJson(json: unknown): string | null {
  if (typeof json !== "object" || json === null) return null;

  const msg = (json as Record<string, unknown>)["message"];
  if (typeof msg === "string" && msg.trim()) return msg;

  const errField = (json as Record<string, unknown>)["error"];
  if (typeof errField === "string" && errField.trim()) return errField;

  return null;
}

/**
 * Унифицированная строгая обработка ответа:
 * - 404 => not_found
 * - !ok => network (с message из JSON если возможно)
 * - ok + body must be JSON + пройти schema => ok(data)
 * - ok + empty/text/невалидный json/не проходит schema => bad_response (с zod error)
 */
async function fetchStrict<T>(
  url: string,
  schema: ZodSchema<T>,
  init: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });

    if (res.status === 404) return err(`Not found: ${url}`, "not_found", 404);

    const body = await readBody(res);

    if (!res.ok) {
      if (body.kind === "json") {
        const m = extractErrorMessageFromJson(body.value);
        if (m) return err(m, "network", res.status);
      }
      return err(`HTTP ${res.status} for ${url}`, "network", res.status);
    }

    // res.ok === true
    if (body.kind === "empty") {
      return err(`Empty response body for ${url}`, "bad_response", res.status);
    }

    if (body.kind === "text") {
      return err(
        `Expected JSON but got text for ${url}`,
        "bad_response",
        res.status,
      );
    }

    const parsed = schema.safeParse(body.value);
    if (!parsed.success) {
      return err(
        `Malformed response for ${url}: ${formatZodError(parsed.error)}`,
        "bad_response",
        res.status,
      );
    }

    return ok(parsed.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return err(msg, "network");
  }
}

function get(base: string) {
  return <T>(path: string, schema: ZodSchema<T>) =>
    fetchStrict(`${base}${path}`, schema, { method: "GET" });
}

/**
 * Строгий POST /scan (202):
 * - если вернул валидный ScanStatus JSON -> ok
 * - если тело пустое/не JSON/невалидно -> fallback GET /scan
 * - если POST не ok -> network error (с message если есть)
 */
async function triggerScanStrict(base: string): Promise<ApiResult<ScanStatus>> {
  const postUrl = `${base}/scan`;

  try {
    const res = await fetch(postUrl, { method: "POST", cache: "no-store" });

    if (res.status === 404)
      return err(`Not found: ${postUrl}`, "not_found", 404);

    const body = await readBody(res);

    if (!res.ok) {
      if (body.kind === "json") {
        const m = extractErrorMessageFromJson(body.value);
        if (m) return err(m, "network", res.status);
      }
      return err(`HTTP ${res.status} for ${postUrl}`, "network", res.status);
    }

    // POST ok — пытаемся распарсить тело если оно JSON
    if (body.kind === "json") {
      const parsed = ScanStatusSchema.safeParse(body.value);
      if (parsed.success) return ok(parsed.data);

      // JSON есть, но невалидный: делаем fallback GET /scan,
      // чтобы UI всё равно получил актуальный статус.
    }

    // empty/text/invalid json -> fallback GET /scan
    return fetchStrict(`${base}/scan`, ScanStatusSchema, { method: "GET" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return err(msg, "network");
  }
}

export function createHttpProvider(apiUrl: string) {
  const base = apiUrl.replace(/\/$/, "");

  const httpGet = get(base);

  return {
    async getStats(): Promise<ApiResult<Stats>> {
      return httpGet("/stats", StatsSchema);
    },

    async listRequirements(query?: string): Promise<ApiResult<Requirement[]>> {
      const q = query ? `?${query}` : "";
      return httpGet(`/requirements${q}`, RequirementsSchema);
    },

    async getRequirement(id: string): Promise<ApiResult<RequirementDetail>> {
      return httpGet(
        `/requirements/${encodeURIComponent(id)}`,
        RequirementDetailSchema,
      );
    },

    async listAnnotations(query?: string): Promise<ApiResult<Annotation[]>> {
      const q = query ? `?${query}` : "";
      return httpGet(`/annotations${q}`, AnnotationsSchema);
    },

    async listTasks(query?: string): Promise<ApiResult<Task[]>> {
      const q = query ? `?${query}` : "";
      return httpGet(`/tasks${q}`, TasksSchema);
    },

    // ✅ строго: POST /scan (+ fallback GET)
    async triggerScan(): Promise<ApiResult<ScanStatus>> {
      return triggerScanStrict(base);
    },

    // ✅ строго: GET /scan
    async getScanStatus(): Promise<ApiResult<ScanStatus>> {
      return httpGet("/scan", ScanStatusSchema);
    },
  };
}
