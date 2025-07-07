
'use client';

import { TrademarkTable } from "@/components/trademark-table";
import { useLanguage } from "@/context/language-context";
import type { TrademarkWithDetails } from "@/types";

type DashboardClientProps = {
    trademarks: TrademarkWithDetails[];
}

export function DashboardClient({ trademarks }: DashboardClientProps) {
  const { dictionary } = useLanguage();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.dashboard.title}
        </h1>
      </div>
       {trademarks.length === 0 && (
         <p className="text-muted-foreground">
          {dictionary.dashboard.noTrademarks}
        </p>
       )}
      <TrademarkTable trademarks={trademarks} />
    </div>
  );
}
