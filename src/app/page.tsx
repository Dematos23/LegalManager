import { TrademarkTable } from "@/components/trademark-table";
import { getTrademarks } from "@/lib/data";

export default async function DashboardPage() {
  const trademarks = await getTrademarks();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
          Trademark Dashboard
        </h1>
      </div>
       {trademarks.length === 0 && (
         <p className="text-muted-foreground">
          Your trademarks will appear here once you connect to a database and import data via the Import page.
        </p>
       )}
      <TrademarkTable trademarks={trademarks} />
    </div>
  );
}
