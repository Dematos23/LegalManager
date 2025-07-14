
'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { Loader2, Send } from 'lucide-react';
import { getEmailTemplates } from '../templates/actions';
import type { EmailTemplate, Campaign } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { sendCampaignAction, getCampaigns, getContactDataForPreview } from '../campaigns/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as Handlebars from 'handlebars';

type PreviewDataContext = any;

export default function SendEmailPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId');
  const trademarkId = searchParams.get('trademarkId');
  const contactName = searchParams.get('contactName');
  
  const { dictionary } = useLanguage();
  const { toast } = useToast();

  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [selectedCampaignId, setSelectedCampaignId] = React.useState('new');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, startSendingTransition] = React.useTransition();
  const [campaignName, setCampaignName] = React.useState('');
  const [customSubject, setCustomSubject] = React.useState('');
  const [customBody, setCustomBody] = React.useState('');

  const [previewContext, setPreviewContext] = React.useState<PreviewDataContext | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      if (!contactId) return;
      setIsLoading(true);
      const [fetchedTemplates, fetchedCampaigns, previewData] = await Promise.all([
        getEmailTemplates(),
        getCampaigns(),
        getContactDataForPreview(Number(contactId), trademarkId ? Number(trademarkId) : undefined),
      ]);
      setTemplates(fetchedTemplates);
      setCampaigns(fetchedCampaigns as Campaign[]);
      if (previewData) {
        setPreviewContext(previewData);
      }
      setIsLoading(false);
    }
    fetchData();
  }, [contactId, trademarkId]);

  React.useEffect(() => {
    if (contactName) {
        setCampaignName(`Single email for ${contactName}`);
    }
  }, [contactName]);
  
  const handleSendTemplate = () => {
    if (!contactId || !selectedTemplateId || (selectedCampaignId === 'new' && campaignName.trim().length < 10)) return;

    const payload = {
        sendMode: 'contact' as const,
        templateId: Number(selectedTemplateId),
        campaignName: campaignName,
        contactIds: [Number(contactId)],
        trademarkId: trademarkId ? Number(trademarkId) : undefined,
        campaignId: selectedCampaignId !== 'new' ? selectedCampaignId : undefined,
    };

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
  
  const handleSendCustom = () => {
    if (!contactId || customSubject.trim() === '' || customBody.trim() === '') return;

     const payload = {
        sendMode: 'custom' as const,
        subject: customSubject,
        body: customBody,
        contactIds: [Number(contactId)],
        campaignName: `Custom email to ${contactName}: ${customSubject}`.substring(0, 100),
        campaignId: undefined // Custom emails always create new campaigns for simplicity
    };
    
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
            setCustomSubject('');
            setCustomBody('');
        }
    });
  };

  const selectedTemplate = templates.find(t => t.id === Number(selectedTemplateId));
  const isSendTemplateDisabled = !selectedTemplateId || !contactId || isSending || (selectedCampaignId === 'new' && campaignName.trim().length < 10);
  const isSendCustomDisabled = isSending || !contactId || customSubject.trim() === '' || customBody.trim() === '';
  
  const renderedPreview = React.useMemo(() => {
    if (!selectedTemplate || !previewContext) {
      return { subject: '', body: '' };
    }
    try {
        const cleanTemplate = (str: string) => (str || '').replace(/<span class="merge-tag" contenteditable="false">({{[^}]+}})<\/span>/g, '$1');
        const compiledSubject = Handlebars.compile(cleanTemplate(selectedTemplate.subject), { noEscape: true });
        const compiledBody = Handlebars.compile(cleanTemplate(selectedTemplate.body), { noEscape: true });
        return {
            subject: compiledSubject(previewContext),
            body: compiledBody(previewContext)
        };
    } catch (e) {
        console.error("Preview rendering error:", e);
        return { subject: "Error rendering subject", body: "Error rendering body. Check template syntax." };
    }
  }, [selectedTemplate, previewContext]);


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
            <Tabs defaultValue="custom" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="template">{dictionary.sendEmail.useTemplateTab}</TabsTrigger>
                    <TabsTrigger value="custom">{dictionary.sendEmail.writeCustomTab}</TabsTrigger>
                </TabsList>
                <TabsContent value="template" className="space-y-6 pt-4">
                     <div className="space-y-2">
                        <Label htmlFor="campaign-select">{dictionary.sendEmail.campaignLabel}</Label>
                        <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId} disabled={isSending}>
                            <SelectTrigger id="campaign-select">
                                <SelectValue placeholder={dictionary.sendEmail.selectCampaignPlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">{dictionary.sendEmail.newCampaignOption}</SelectItem>
                                {campaigns.map(campaign => (
                                    <SelectItem key={campaign.id} value={String(campaign.id)}>{campaign.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCampaignId === 'new' && (
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
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="template-select">{dictionary.sendEmail.selectTemplate}</Label>
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>{dictionary.sendEmail.loadingTemplates}</span>
                            </div>
                        ) : (
                            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={isSending}>
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
                                <p>{renderedPreview.subject}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground">{dictionary.templateForm.bodyLabel}</p>
                                <div 
                                    className="mt-2 w-full max-h-60 overflow-y-auto rounded-md border p-4 bg-white text-black"
                                    dangerouslySetInnerHTML={{ __html: renderedPreview.body }}
                                />
                            </div>
                        </div>
                    )}
                    
                    <Button onClick={handleSendTemplate} disabled={isSendTemplateDisabled} className="w-full">
                        {isSending ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Send className="mr-2 h-4 w-4" /> )}
                        {dictionary.sendEmail.sendButton}
                    </Button>
                </TabsContent>
                <TabsContent value="custom" className="space-y-6 pt-4">
                     <div className="space-y-2">
                        <Label htmlFor="customSubject">{dictionary.sendEmail.customSubjectLabel}</Label>
                        <Input 
                            id="customSubject"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            placeholder={dictionary.sendEmail.customSubjectPlaceholder}
                            disabled={isSending}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="customBody">{dictionary.sendEmail.customBodyLabel}</Label>
                        <Textarea 
                            id="customBody"
                            value={customBody}
                            onChange={(e) => setCustomBody(e.target.value)}
                            placeholder={dictionary.sendEmail.customBodyPlaceholder}
                            disabled={isSending}
                            rows={10}
                        />
                    </div>
                     <Button onClick={handleSendCustom} disabled={isSendCustomDisabled} className="w-full">
                        {isSending ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <Send className="mr-2 h-4 w-4" /> )}
                        {dictionary.sendEmail.sendButton}
                    </Button>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
