"use client";

import { useMemo, useState } from "react";
import { type ApiResult, type Annotation, type Requirement, type Task } from "@/lib/types";

// @req SCD-UI-007
export default function OrphanPanel({
  reqRes,
  annRes,
  taskRes
}: {
  reqRes: ApiResult<Requirement[]>;
  annRes: ApiResult<Annotation[]>;
  taskRes: ApiResult<Task[]>;
}) {
  const [open, setOpen] = useState(false);

  const known = useMemo(() => {
    if (!reqRes.ok) return new Set<string>();
    return new Set(reqRes.data.map((r) => r.id));
  }, [reqRes]);

  const orphanAnnotations = useMemo(() => {
    if (!annRes.ok) return [];
    return annRes.data.filter((a) => !known.has(a.reqId));
  }, [annRes, known]);

  const orphanTasks = useMemo(() => {
    if (!taskRes.ok) return [];
    return taskRes.data.filter((t) => !known.has(t.requirementId));
  }, [taskRes, known]);

  const total = orphanAnnotations.length + orphanTasks.length;

  return (
    <section className="card" aria-label="Orphans panel">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Orphans</h2>
        <button className="chip" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"} ({total})
        </button>
      </div>

      {!open ? <p className="small">Orphans are annotations/tasks referencing unknown requirement IDs.</p> : null}

      {open ? (
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="col-6">
            <h3>Annotation orphans ({orphanAnnotations.length})</h3>
            {orphanAnnotations.length ? (
              <ul>
                {orphanAnnotations.map((a) => (
                  <li key={`${a.file}:${a.line}:${a.reqId}:${a.type}`}>
                    <span className="warn">{a.reqId}</span> · <span className="badge">{a.type}</span> ·{" "}
                    <span className="small">
                      {a.file}:{a.line}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small">No orphan annotations.</p>
            )}
          </div>

          <div className="col-6">
            <h3>Task orphans ({orphanTasks.length})</h3>
            {orphanTasks.length ? (
              <ul>
                {orphanTasks.map((t) => (
                  <li key={t.id}>
                    <span className="warn">{t.requirementId}</span> · {t.title} · <span className="badge">{t.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small">No orphan tasks.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}