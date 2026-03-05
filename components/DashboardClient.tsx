"use client";

import dynamic from "next/dynamic";
import type { ApiResult, Annotation, Requirement, Stats, Task } from "@/lib/types";

const RequirementsTable = dynamic(() => import("@/components/RequirementsTable"), {
  ssr: false,
  loading: () => <section className="card">Loading requirements…</section>
});

const TasksPanel = dynamic(() => import("@/components/TasksPanel"), {
  ssr: false,
  loading: () => <section className="card">Loading tasks…</section>
});

import SummaryPanel from "@/components/SummaryPanel";
import OrphanPanel from "@/components/OrphanPanel";

export default function DashboardClient({
  statsRes,
  reqRes,
  taskRes,
  annRes
}: {
  statsRes: ApiResult<Stats>;
  reqRes: ApiResult<Requirement[]>;
  taskRes: ApiResult<Task[]>;
  annRes: ApiResult<Annotation[]>;
}) {
  return (
    <div className="grid">
      <div className="col-12">
        <SummaryPanel statsRes={statsRes} />
      </div>

      <div className="col-12">
        <RequirementsTable reqRes={reqRes} />
      </div>

      <div className="col-12">
        <TasksPanel reqRes={reqRes} taskRes={taskRes} />
      </div>

      <div className="col-12">
        <OrphanPanel reqRes={reqRes} annRes={annRes} taskRes={taskRes} />
      </div>
    </div>
  );
}