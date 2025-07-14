
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { Loader2, Send } from 'lucide-react';
import { getEmailTemplates } from '../templates/actions';
import type { EmailTemplate } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { sendCampaignAction } from '../campaigns/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function SendEmailPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId');
  const contactName = searchParams.get('contactName');
  
  const { dictionary } = useLanguage();
  const { toast } = useToast();

  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, startSendingTransition] = React.useTransition();
  const [campaignName, setCampaignName] = React.useState('');
  
  React.useEffect(() => {
    async function fetchTemplates() {
      setIsLoading(true);
      const fetchedTemplates = await getEmailTemplates();
      setTemplates(fetchedTemplates);
      setIsLoading(false);
    }
    fetchTemplates();
  }, []);

  React.useEffect(() => {
    if (contactName) {
        setCampaignName(`Single email for ${contactName}`);
    }
  }, [contactName]);
  
  const handleSend = () => {
    if (!contactId || !selectedTemplateId) return;

    const payload = {
        sendMode: 'contact' as const,
        templateId: Number(selectedTemplateId),
        campaignName: campaignName,
        contactIds: [Number(contactId)],
    }

    startSendingTransition(async () => {
        const result = await sendCampaignAction(payload);
        if (result.error) {
            toast({
                title: dictionary.sendTemplate.campaignErrorTitle,
                description: result.error,
                variant: 'destructive',
                duration: 8000
            });
        } else {
            toast({
                title: dictionary.sendTemplate.campaignSentTitle,
                description: result.success,
            });
            setCampaignName('');
            setSelectedTemplateId('');
        }
    });
  };

  const selectedTemplate = templates.find(t => t.id === Number(selectedTemplateId));
  const isSendDisabled = !selectedTemplateId || !contactId || isSending || campaignName.trim().length < 10;
  
  if (!contactId || !contactName) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.sendEmail.errorTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{dictionary.sendEmail.errorNoContact}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{dictionary.sendEmail.title}</CardTitle>
          <CardDescription>
            {dictionary.sendEmail.description} <strong>{contactName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="campaignName">{dictionary.sendTemplate.campaignNameLabel}</Label>
                <Input 
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={dictionary.sendTemplate.campaignNamePlaceholder}
                    disabled={isSending}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-select">{dictionary.sendEmail.selectTemplate}</Label>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{dictionary.sendEmail.loadingTemplates}</span>
                </div>
              ) : (
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                  disabled={isSending}
                >
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder={dictionary.sendEmail.selectTemplatePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedTemplate && (
                <div className="space-y-4 rounded-md border p-4">
                     <div>
                        <p className="text-sm font-semibold text-muted-foreground">{dictionary.templates.table.subject}</p>
                        <p>{selectedTemplate.subject}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">{dictionary.templateForm.bodyLabel}</p>
                        <div 
                            className="mt-2 w-full max-h-60 overflow-y-auto rounded-md border p-4 bg-white text-black"
                            dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                        />
                    </div>
                </div>
            )}
            
            <Button onClick={handleSend} disabled={isSendDisabled} className="w-full">
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {dictionary.sendEmail.sendButton}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
