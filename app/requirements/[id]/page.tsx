import Link from "next/link";
import RequirementDetail from "@/components/RequirementDetail";
import { getRequirement, listRequirements } from "@/lib/api";

export async function generateStaticParams() {
  const res = await listRequirements();

  if (!res.ok) return [];

  return res.data.map((r) => ({
    id: r.id
  }));
}

export default async function RequirementPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  // @req SCD-UI-005
  const res = await getRequirement(id);

  const backQuery = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") backQuery.set(k, v);
    else if (Array.isArray(v)) v.forEach((x) => backQuery.append(k, x));
  }

  return (
    <main>
      <p className="small">
        <Link href={`/?${backQuery.toString()}`}>← Back to dashboard</Link>
      </p>

      <RequirementDetail detailRes={res} />
    </main>
  );
}