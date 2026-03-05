// lib/types.ts

export type RequirementType = "FR" | "AR";
export type CoverageStatus = "covered" | "partial" | "missing";
export type AnnotationType = "impl" | "test";
export type TaskStatus = "open" | "in_progress" | "done";

export type ApiErrorKind = "network" | "not_found" | "bad_response" | "unknown";

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

// OpenAPI schemas

export type Healthcheck = {
  status: "healthy" | "degraded";
  version: string;
  timestamp: string; // date-time
};

export type RequirementStats = {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
};

export type AnnotationStats = {
  total: number;
  impl: number;
  test: number;
  orphans: number;
};

export type TaskStats = {
  total: number;
  byStatus: Record<string, number>;
  orphans: number;
};

export type Stats = {
  requirements: RequirementStats;
  annotations: AnnotationStats;
  tasks: TaskStats;
  coverage: number;
  lastScanAt: string; // date-time
};

export type Requirement = {
  id: string;
  type: RequirementType;
  title: string;
  description: string;
  status: CoverageStatus;
  createdAt: string; // date-time
  updatedAt: string; // date-time
};

export type Annotation = {
  file: string;
  line: number;
  reqId: string;
  type: AnnotationType;
  snippet: string;
};

export type Task = {
  id: string;
  requirementId: string;
  title: string;
  status: TaskStatus;
  assignee?: string;
  createdAt: string; // date-time
  updatedAt: string; // date-time
};

export type RequirementDetail = Requirement & {
  annotations: Annotation[];
  tasks: Task[];
};



export type ScanStatus = {
  status: "idle" | "scanning" | "completed" | "failed";
  startedAt?: string; // date-time (может отсутствовать в idle)
  completedAt?: string; // date-time
  duration?: number; // ms
};

export type ErrorResponse = {
  error: string;
  message: string;
};

// Filters (UI can be multi; API supports single)
export type ListRequirementsFilters = {
  type?: RequirementType[]; // UI multi-select
  status?: CoverageStatus[]; // UI multi-select
  sort?: "id" | "updatedAt";
  order?: "asc" | "desc";
};

export type ListAnnotationsFilters = {
  type?: AnnotationType;
  orphans?: boolean;
};

export type ListTasksFilters = {
  status?: TaskStatus;
  orphans?: boolean;
  sort?: "id" | "updatedAt";
  order?: "asc" | "desc";
};