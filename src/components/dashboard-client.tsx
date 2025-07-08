
'use client';

import * as React from 'react';
import { TrademarkTable } from "@/components/trademark-table";
import { useLanguage } from "@/context/language-context";
import type { TrademarkWithDetails } from "@/types";
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteAllDataAction } from '@/app/actions';

type DashboardClientProps = {
    trademarks: TrademarkWithDetails[];
}

export function DashboardClient({ trademarks }: DashboardClientProps) {
  const { dictionary } = useLanguage();
  const [isDeleting, startDeleteTransition] = React.useTransition();
  const { toast } = useToast();

  const handleDeleteAllData = async () => {
    startDeleteTransition(async () => {
        const result = await deleteAllDataAction();
        if (result.success) {
            toast({
                title: dictionary.dashboard.deleteAll.successTitle,
                description: dictionary.dashboard.deleteAll.successDescription,
            });
            window.location.reload();
        } else {
            toast({
                title: dictionary.dashboard.deleteAll.errorTitle,
                description: result.error,
                variant: "destructive",
            });
        }
    });
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {dictionary.dashboard.title}
        </h1>
        {trademarks.length > 0 && (
          <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      {dictionary.dashboard.deleteAll.button}
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>{dictionary.dashboard.deleteAll.confirmTitle}</AlertDialogTitle>
                      <AlertDialogDescription>
                          {dictionary.dashboard.deleteAll.confirmDescription}
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>{dictionary.dashboard.deleteAll.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllData} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {dictionary.dashboard.deleteAll.continue}
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        )}
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
