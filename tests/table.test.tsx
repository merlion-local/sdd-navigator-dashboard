// tests/table.test.tsx
import { render, screen } from "@testing-library/react";
import RequirementsTable from "../components/RequirementsTable";
import type { ApiResult, Requirement } from "../lib/types";
import { vi, test, expect } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/"
}));

test("renders requirements table", () => {
  const requirements: Requirement[] = [
    {
      id: "FR-REQ-001",
      type: "FR",
      title: "List requirements",
      description: "API provides list of requirements with type/status and timestamps.",
      status: "covered",
      createdAt: "2026-02-21T09:00:00Z",
      updatedAt: "2026-03-01T12:20:00Z"
    }
  ];

  const reqRes: ApiResult<Requirement[]> = {
    ok: true,
    data: requirements
  };

  render(<RequirementsTable reqRes={reqRes} />);

  expect(screen.getByText("Requirements")).toBeInTheDocument();
  expect(screen.getByText("FR-REQ-001")).toBeInTheDocument();
  expect(screen.getByText("List requirements")).toBeInTheDocument();
});