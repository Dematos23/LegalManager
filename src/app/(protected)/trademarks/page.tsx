
import { getTrademarks } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard-client";

export default async function TrademarksPage() {
  const trademarks = await getTrademarks();
  return (
      <DashboardClient trademarks={trademarks} />
  );
}
