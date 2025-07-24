
import { getTrademarks } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const trademarks = await getTrademarks();
  return (
      <DashboardClient trademarks={trademarks} />
  );
}
