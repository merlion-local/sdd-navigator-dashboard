import DashboardClient from "@/components/DashboardClient";
import { getStats, listAnnotations, listRequirements, listTasks } from "@/lib/api";

export default async function HomePage() {
  const statsRes = await getStats();
  const reqRes = await listRequirements();
  const taskRes = await listTasks();
  const annRes = await listAnnotations();

  return (
    <main>
      <DashboardClient statsRes={statsRes} reqRes={reqRes} taskRes={taskRes} annRes={annRes} />
      <div className="footer-space" />
    </main>
  );
}