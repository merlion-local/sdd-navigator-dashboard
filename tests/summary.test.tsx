// tests/summary.test.tsx
import { render, screen } from "@testing-library/react";
import SummaryPanel from "../components/SummaryPanel";
import type { ApiResult, Stats } from "../lib/types";

test("renders summary stats", () => {
  const stats: Stats = {
    requirements: {
      total: 8,
      byType: { FR: 6, AR: 2 },
      byStatus: { covered: 5, partial: 1, missing: 2 }
    },
    annotations: {
      total: 16,
      impl: 10,
      test: 6,
      orphans: 2
    },
    tasks: {
      total: 6,
      byStatus: { done: 2, in_progress: 1, open: 3 },
      orphans: 1
    },
    coverage: 62.5,
    lastScanAt: "2026-03-01T13:05:00Z"
  };

  const statsRes: ApiResult<Stats> = { ok: true, data: stats };

  render(<SummaryPanel statsRes={statsRes} />);

  expect(screen.getByText("Summary")).toBeInTheDocument();
  expect(screen.getByText("Total requirements")).toBeInTheDocument();
  expect(screen.getByText("8")).toBeInTheDocument();
  expect(screen.getByText(/FR:\s*6/i)).toBeInTheDocument();
  expect(screen.getByText(/AR:\s*2/i)).toBeInTheDocument();

  expect(screen.getByText("Coverage")).toBeInTheDocument();
  expect(screen.getByText("62.5%")).toBeInTheDocument();
});