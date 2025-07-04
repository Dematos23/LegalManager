'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { generateEmailAction } from '@/app/actions';

type EmailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  contactEmail: string;
};

export function EmailModal({ isOpen, onClose, contactEmail }: EmailModalProps) {
  const [emailContent, setEmailContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setEmailContent('');
      startTransition(async () => {
        const result = await generateEmailAction({ contactEmail });
        if (result.error) {
          toast({
            title: 'Error',
            description: result.error,
            variant: 'destructive',
          });
          onClose();
        } else if (result.emailDraft) {
          setEmailContent(result.emailDraft);
        }
      });
    }
  }, [isOpen, contactEmail, toast, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent);
    toast({ title: 'Success', description: 'Email content copied to clipboard.' });
  };
  
  const handleSend = () => {
    toast({ title: 'Email Sent (Simulated)', description: `An email has been sent to ${contactEmail}.` });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generated Email Draft</DialogTitle>
          <DialogDescription>
            Review and edit the AI-generated email below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
                <Textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="min-h-[400px] font-code text-sm"
                    aria-label="Email Content"
                />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy} disabled={isPending || !emailContent}>
            Copy HTML
          </Button>
          <Button onClick={handleSend} disabled={isPending || !emailContent}>
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
