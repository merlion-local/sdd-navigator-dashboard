"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type ApiResult,
  type CoverageStatus,
  type Requirement,
  type RequirementType
} from "@/lib/types";

// @req SCD-UI-002
// @req SCD-UI-003
// @req SCD-UI-004
// @req SCD-UI-008
export default function RequirementsTable({
  reqRes
}: {
  reqRes: ApiResult<Requirement[]>;
}) {
  const spRaw = useSearchParams();
  const sp = spRaw ?? new URLSearchParams(); // ✅ fix: sp may be null

  const router = useRouter();
  const pathname = usePathname();

  const typeFilters = sp.getAll("type") as RequirementType[];
  const statusFilters = sp.getAll("status") as CoverageStatus[];
  const sort = (sp.get("sort") ?? "id") as "id" | "updatedAt";
  const order = (sp.get("order") ?? "asc") as "asc" | "desc";

  const setParams = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp.toString());
    mutate(next);
    router.push(`${pathname}?${next.toString()}`);
  };

  const toggleMulti = (key: "type" | "status", value: string) => {
    setParams((p) => {
      const values = p.getAll(key);
      p.delete(key);

      const has = values.includes(value);
      const next = has ? values.filter((v) => v !== value) : [...values, value];

      next.forEach((v) => p.append(key, v));
    });
  };

  const setSort = (nextSort: "id" | "updatedAt") => {
    setParams((p) => {
      const currentSort = (p.get("sort") ?? "id") as "id" | "updatedAt";
      const currentOrder = (p.get("order") ?? "asc") as "asc" | "desc";

      const nextOrder =
        currentSort === nextSort ? (currentOrder === "asc" ? "desc" : "asc") : "asc";

      p.set("sort", nextSort);
      p.set("order", nextOrder);
    });
  };

  const data = useMemo(() => {
  if (!reqRes.ok) return null;

  let items = [...reqRes.data];

  if (typeFilters.length)
    items = items.filter((r) => typeFilters.includes(r.type));

  if (statusFilters.length)
    items = items.filter((r) => statusFilters.includes(r.status));

  items.sort((a, b) => {
    const av = sort === "id" ? a.id : a.updatedAt;
    const bv = sort === "id" ? b.id : b.updatedAt;

    if (av === bv) return 0;

    const cmp = av < bv ? -1 : 1;
    return order === "asc" ? cmp : -cmp;
  });

  return items;
}, [reqRes, typeFilters, statusFilters, sort, order]);

  const ariaSortFor = (col: "id" | "updatedAt") => {
    if (sort !== col) return "none";
    return order === "asc" ? "ascending" : "descending";
  };

  if (!reqRes.ok) {
    return (
      <section className="card" role="alert">
        <h2>Requirements</h2>
        <p className="warn">Failed to load requirements: {reqRes.error.message}</p>
      </section>
    );
  }

  return (
    <section className="card" aria-label="Requirements table">
      <h2 style={{ marginTop: 0 }}>Requirements</h2>

      <div className="toolbar" aria-label="Requirements filters">
        <span className="small">Type:</span>

        {(["FR", "AR"] as const).map((t) => (
          <button
            key={t}
            className="chip"
            aria-pressed={typeFilters.includes(t)}
            onClick={() => toggleMulti("type", t)}
          >
            {t}
          </button>
        ))}

        <span className="small" style={{ marginLeft: 8 }}>
          Status:
        </span>

        {(["covered", "partial", "missing"] as const).map((s) => (
          <button
            key={s}
            className="chip"
            aria-pressed={statusFilters.includes(s)}
            onClick={() => toggleMulti("status", s)}
          >
            {s}
          </button>
        ))}
      </div>

      {!data?.length ? (
        <p className="small">No requirements match the current filters.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th aria-sort={ariaSortFor("id")}>
                <button onClick={() => setSort("id")}>ID</button>
              </th>
              <th>Type</th>
              <th>Title</th>
              <th>Status</th>
              <th aria-sort={ariaSortFor("updatedAt")}>
                <button onClick={() => setSort("updatedAt")}>Updated</button>
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((r) => (
              <Row key={r.id} r={r} currentQuery={sp.toString()} />
            ))}
          </tbody>
        </table>
      )}

      <p className="small">Tip: filters and sort are shareable via the URL.</p>
    </section>
  );
}

function Row({ r, currentQuery }: { r: Requirement; currentQuery: string }) {
  const badgeClass =
    r.status === "covered"
      ? "badge badge--covered"
      : r.status === "partial"
      ? "badge badge--partial"
      : "badge badge--missing";

  return (
    <tr>
      <td>
        <Link href={`/requirements/${encodeURIComponent(r.id)}?${currentQuery}`}>{r.id}</Link>
      </td>
      <td>{r.type}</td>
      <td>{r.title}</td>
      <td>
        <span className={badgeClass}>{r.status}</span>
      </td>
      <td className="small">{new Date(r.updatedAt).toLocaleString()}</td>
    </tr>
  );
}