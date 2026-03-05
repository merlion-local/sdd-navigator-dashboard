// lib/schemas.ts
import { z } from "zod";

/**
 * Helpers
 * - OpenAPI date-time: ISO 8601 with timezone offset (e.g. "2026-03-01T10:15:00Z")
 */
const DateTimeSchema = z.string().datetime({ offset: true });

/**
 * Primitives / enums
 */
export const RequirementTypeSchema = z.union([z.literal("FR"), z.literal("AR")]);
export const CoverageStatusSchema = z.union([z.literal("covered"), z.literal("partial"), z.literal("missing")]);
export const AnnotationTypeSchema = z.union([z.literal("impl"), z.literal("test")]);
export const TaskStatusSchema = z.union([z.literal("open"), z.literal("in_progress"), z.literal("done")]);

export const ApiErrorKindSchema = z.union([
  z.literal("network"),
  z.literal("not_found"),
  z.literal("bad_response"),
  z.literal("unknown")
]);

/**
 * ApiResult
 */
export const ApiErrorSchema = z.object({
  kind: ApiErrorKindSchema,
  message: z.string(),
  status: z.number().int().optional()
});

/**
 * Requirement / Annotation / Task
 */
export const RequirementSchema = z.object({
  id: z.string(),
  type: RequirementTypeSchema,
  title: z.string(),
  description: z.string(),
  status: CoverageStatusSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema
});

export const AnnotationSchema = z.object({
  file: z.string(),
  line: z.number().int().nonnegative(),
  reqId: z.string(),
  type: AnnotationTypeSchema,
  snippet: z.string()
});

export const TaskSchema = z.object({
  id: z.string(),
  requirementId: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  assignee: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema
});

/**
 * RequirementDetail = Requirement + annotations + tasks
 */
export const RequirementDetailSchema = RequirementSchema.extend({
  annotations: z.array(AnnotationSchema),
  tasks: z.array(TaskSchema)
});

/**
 * Lists (API returns arrays)
 */
export const RequirementsSchema = z.array(RequirementSchema);
export const AnnotationsSchema = z.array(AnnotationSchema);
export const TasksSchema = z.array(TaskSchema);

/**
 * Stats (соответствует lib/types.ts)
 */
export const RequirementStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  byType: z.record(z.string(), z.number().int().nonnegative()),
  byStatus: z.record(z.string(), z.number().int().nonnegative())
});

export const AnnotationStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  impl: z.number().int().nonnegative(),
  test: z.number().int().nonnegative(),
  orphans: z.number().int().nonnegative()
});

export const TaskStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.record(z.string(), z.number().int().nonnegative()),
  orphans: z.number().int().nonnegative()
});

export const StatsSchema = z.object({
  requirements: RequirementStatsSchema,
  annotations: AnnotationStatsSchema,
  tasks: TaskStatsSchema,
  coverage: z.number().min(0).max(100),
  lastScanAt: DateTimeSchema
});

/**
 * ScanStatus (как в lib/types.ts и OpenAPI)
 */
export const ScanStatusSchema = z.object({
  status: z.union([z.literal("idle"), z.literal("scanning"), z.literal("completed"), z.literal("failed")]),
  startedAt: DateTimeSchema,
  completedAt: DateTimeSchema.optional(),
  duration: z.number().int().nonnegative().optional()
});

/**
 * ErrorResponse (OpenAPI components/schemas/Error)
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string()
});