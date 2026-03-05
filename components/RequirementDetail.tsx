import { type ApiResult, type RequirementDetail } from "@/lib/types";

function assessment(status: RequirementDetail["status"]): string {
  if (status === "covered") return "Fully covered";
  if (status === "partial") return "Needs tests";
  return "Not implemented";
}

// @req SCD-UI-005
// @req SCD-UI-008
export default function RequirementDetail({
  detailRes
}: {
  detailRes: ApiResult<RequirementDetail>;
}) {
  if (!detailRes.ok) {
    return (
      <section className="card" role="alert">
        <h2>Requirement</h2>
        <p className="warn">{detailRes.error.message}</p>
      </section>
    );
  }

  const r = detailRes.data;

  return (
    <section className="card" aria-label="Requirement detail">
      <h2 style={{ marginTop: 0 }}>{r.id}</h2>
      <div className="small">
        {r.type} · {assessment(r.status)}
      </div>

      <h3>Title</h3>
      <p>{r.title}</p>

      <h3>Description</h3>
      <p>{r.description}</p>

      <h3>Meta</h3>
      <p className="small">
        created {new Date(r.createdAt).toLocaleString()} · updated{" "}
        {new Date(r.updatedAt).toLocaleString()}
      </p>

      <h3>Annotations ({r.annotations.length})</h3>
      {r.annotations.length ? (
        <ul>
          {r.annotations.map((a) => (
            <li key={`${a.file}:${a.line}:${a.reqId}:${a.type}`}>
              <span className="badge">{a.type}</span>{" "}
              <span className="small">
                {a.file}:{a.line}
              </span>
              <div className="small">{a.snippet}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small">No annotations linked.</p>
      )}

      <h3>Tasks ({r.tasks.length})</h3>
      {r.tasks.length ? (
        <ul>
          {r.tasks.map((t) => (
            <li key={t.id}>
              <span className="badge">{t.status}</span> {t.title}{" "}
              {t.assignee ? (
                <span className="small">({t.assignee})</span>
              ) : null}
              <div className="small">
                updated {new Date(t.updatedAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small">No tasks linked.</p>
      )}
    </section>
  );
}