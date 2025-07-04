import { TrademarkTable } from "@/components/trademark-table";
import { getTrademarksWithDetails } from "@/lib/data";

export default function DashboardPage() {
  const trademarks = getTrademarksWithDetails();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
          Trademark Dashboard
        </h1>
      </div>
      <TrademarkTable trademarks={trademarks} />
    </div>
  );
}
