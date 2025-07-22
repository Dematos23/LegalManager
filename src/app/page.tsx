
import { getTrademarks } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard-client";
import { MainLayout } from "@/components/main-layout";

export default async function DashboardPage() {
  const trademarks = await getTrademarks();
  return (
    <MainLayout>
      <DashboardClient trademarks={trademarks} />
    </MainLayout>
  );
}
