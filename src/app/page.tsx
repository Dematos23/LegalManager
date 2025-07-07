
'use client';

import { TrademarkTable } from "@/components/trademark-table";
import { getTrademarks } from "@/lib/data";
import { useLanguage } from "@/context/language-context";
import { useState, useEffect } from "react";
import type { TrademarkWithDetails } from "@/types";

export default function DashboardPage() {
  const { dictionary } = useLanguage();
  const [trademarks, setTrademarks] = useState<TrademarkWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrademarks = async () => {
      setLoading(true);
      const data = await getTrademarks();
      setTrademarks(data);
      setLoading(false);
    };
    fetchTrademarks();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
          {dictionary.dashboard.title}
        </h1>
      </div>
       {!loading && trademarks.length === 0 && (
         <p className="text-muted-foreground">
          {dictionary.dashboard.noTrademarks}
        </p>
       )}
      <TrademarkTable trademarks={trademarks} />
    </div>
  );
}
