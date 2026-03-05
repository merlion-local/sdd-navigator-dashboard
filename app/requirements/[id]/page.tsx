import { Suspense } from "react";
import RequirementDetail from "@/components/RequirementDetail";
import BackToDashboardLink from "@/components/BackToDashboardLink";
import { getRequirement } from "@/lib/api";
import requirements from "@/data/requirements.json";

export const dynamicParams = false;

export async function generateStaticParams() {
  return requirements.map((r) => ({ id: r.id }));
}

export default async function RequirementPage({
  params
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  // @req SCD-UI-005
  const res = await getRequirement(id);

  return (
    <main>
      <p className="small">
        <Suspense fallback={<span>← Back to dashboard</span>}>
          <BackToDashboardLink />
        </Suspense>
      </p>

      <RequirementDetail detailRes={res} />
    </main>
  );
}