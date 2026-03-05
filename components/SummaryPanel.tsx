import { type ApiResult, type Stats } from "@/lib/types";

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// @req SCD-UI-001
// @req SCD-UI-008
export default function SummaryPanel({ statsRes }: { statsRes: ApiResult<Stats> }) {
  if (!statsRes.ok) {
    return (
      <section className="card" role="alert">
        <h2>Summary</h2>
        <p className="warn">Failed to load stats: {statsRes.error.message}</p>
      </section>
    );
  }

  const s = statsRes.data;
  return (
    <section className="card" aria-label="Summary panel">
      <h2 style={{ marginTop: 0 }}>Summary</h2>

      <div className="grid">
        <div className="col-4">
          <div className="small">Total requirements</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{s.requirements.total}</div>
          <div className="small">
            FR: {s.requirements.byType.FR ?? 0} · AR: {s.requirements.byType.AR ?? 0}
          </div>
        </div>

        <div className="col-4">
          <div className="small">Coverage</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{s.coverage}%</div>
          <div className="progress" aria-label="Coverage progress">
            <div style={{ width: `${s.coverage}%` }} />
          </div>
          <div className="small">
            covered {s.requirements.byStatus.covered ?? 0} · partial {s.requirements.byStatus.partial ?? 0} · missing{" "}
            {s.requirements.byStatus.missing ?? 0}
          </div>
        </div>

        <div className="col-4">
          <div className="small">Orphans</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{(s.annotations.orphans ?? 0) + (s.tasks.orphans ?? 0)}</div>
          <div className="small">
            annotations: {s.annotations.orphans} · tasks: {s.tasks.orphans}
            {(s.annotations.orphans > 0 || s.tasks.orphans > 0) && <span className="warn"> · needs attention</span>}
          </div>
        </div>

        <div className="col-12">
          <div className="small">Last scan</div>
          <div>{fmtDate(s.lastScanAt)}</div>
          <div className="small">
            annotations total {s.annotations.total} (impl {s.annotations.impl}, test {s.annotations.test}) · tasks total {s.tasks.total}
          </div>
        </div>
      </div>
    </section>
  );
}