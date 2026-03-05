"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ApiResult, type Requirement, type Task, type TaskStatus } from "@/lib/types";

// @req SCD-UI-006
// @req SCD-UI-008
export default function TasksPanel({
  reqRes,
  taskRes
}: {
  reqRes: ApiResult<Requirement[]>;
  taskRes: ApiResult<Task[]>;
}) {
  const spRaw = useSearchParams();
  const sp = spRaw ?? new URLSearchParams(); // ✅ fix: sp may be null

  const router = useRouter();
  const pathname = usePathname();

  const status = (sp.get("taskStatus") ?? "") as "" | TaskStatus;

  const setTaskStatus = (next: "" | TaskStatus) => {
    const p = new URLSearchParams(sp.toString());
    if (next) p.set("taskStatus", next);
    else p.delete("taskStatus");
    router.push(`${pathname}?${p.toString()}`);
  };

  const known = useMemo(() => {
    if (!reqRes.ok) return new Set<string>();
    return new Set(reqRes.data.map((r) => r.id));
  }, [reqRes]);

  const rows = useMemo(() => {
    if (!taskRes.ok) return null;

    let items = [...taskRes.data];
    if (status) items = items.filter((t) => t.status === status);

    return items.map((t) => ({ t, orphan: !known.has(t.requirementId) }));
  }, [taskRes, status, known]);

  if (!taskRes.ok) {
    return (
      <section className="card" role="alert">
        <h2>Tasks</h2>
        <p className="warn">Failed to load tasks: {taskRes.error.message}</p>
      </section>
    );
  }

  return (
    <section className="card" aria-label="Tasks panel">
      <h2 style={{ marginTop: 0 }}>Tasks</h2>

      <div className="toolbar" aria-label="Task filters">
        <label className="small" htmlFor="taskStatus">
          Status:
        </label>
        <select
          id="taskStatus"
          className="select"
          value={status}
          onChange={(e) => setTaskStatus((e.target.value as TaskStatus) || "")}
        >
          <option value="">all</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
        </select>
      </div>

      {!rows?.length ? (
        <p className="small">No tasks match the current filter.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirement</th>
              <th>Title</th>
              <th>Status</th>
              <th>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, orphan }) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  {t.requirementId} {orphan ? <span className="warn">· orphan</span> : null}
                </td>
                <td>{t.title}</td>
                <td>
                  <span className="badge">{t.status}</span>
                </td>
                <td>{t.assignee ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="small">Orphan tasks are highlighted.</p>
    </section>
  );
}