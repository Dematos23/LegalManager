
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { EmailTemplate } from "@prisma/client";
import {
  createEmailTemplate,
  updateEmailTemplate,
  getTemplatePreviewData,
} from "@/app/templates/actions";
import { useLanguage } from "@/context/language-context";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { Eye, Code, Loader2 } from "lucide-react";
import * as Handlebars from "handlebars";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TemplateSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." }),
  subject: z
    .string()
    .min(3, { message: "Subject must be at least 3 characters long." }),
  body: z
    .string()
    .min(10, { message: "Body must be at least 10 characters long." }),
});

type TemplateFormValues = z.infer<typeof TemplateSchema>;
type AgentWithNestedData = Awaited<
  ReturnType<typeof getTemplatePreviewData>
>[0];

type TemplateFormProps = {
  template?: EmailTemplate | null;
};

const MERGE_FIELDS = [
  {
    group: "Agent",
    fields: [
      { name: "Agent Name", value: "{{agent.name}}" },
      { name: "Agent Country", value: "{{agent.country}}" },
      { name: "Agent Area", value: "{{agent.area}}" },
    ],
  },
  {
    group: "Contact",
    fields: [
      { name: "Contact Name", value: "{{contact.name}}" },
      { name: "Contact Email", value: "{{contact.email}}" },
    ],
  },
  {
    group: "Owner",
    fields: [
      { name: "Owner Name", value: "{{owner.name}}" },
      { name: "Owner Country", value: "{{owner.country}}" },
    ],
  },
  {
    group: "Trademarks (Loop)",
    fields: [
      { name: "Start Loop", value: "{{#each trademarks}}" },
      { name: "Denomination", value: "{{denomination}}" },
      { name: "Class", value: "{{class}}" },
      { name: "Certificate", value: "{{certificate}}" },
      { name: "Expiration Date", value: "{{expiration}}" },
      { name: "Products", value: "{{products}}" },
      { name: "End Loop", value: "{{/each}}" },
    ],
  },
];

const QuillEditor = ({
  field,
  quillRef,
}: {
  field: ControllerRenderProps<TemplateFormValues, "body">;
  quillRef: React.MutableRefObject<Quill | null>;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !editorRef.current) {
      return;
    }

    const editorNode = editorRef.current;
    
    const quill = new Quill(editorNode, {
      theme: "snow",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
          ["link"],
          ["clean"],
        ],
      },
    });
    quillRef.current = quill;

    if (field.value) {
      const delta = quill.clipboard.convert(field.value as any);
      quill.setContents(delta, "silent");
    }

    const handleChange = (delta: any, oldDelta: any, source: string) => {
      if (source === "user") {
        let content = quill.root.innerHTML;
        if (content === "<p><br></p>") {
          content = "";
        }
        field.onChange(content);
      }
    };

    quill.on("text-change", handleChange);

    return () => {
      quill.off("text-change", handleChange);
      quillRef.current = null;
      if (editorNode) {
        editorNode.innerHTML = "";
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleans up on unmount

  return <div ref={editorRef} />;
};


export function TemplateForm({ template }: TemplateFormProps) {
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const quillInstance = useRef<Quill | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [previewData, setPreviewData] = useState<AgentWithNestedData[]>([]);
  const [isLoadingPreviewData, setIsLoadingPreviewData] = useState(true);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedTrademarkId, setSelectedTrademarkId] = useState<string>("all");

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(TemplateSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      body: template?.body || "",
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTemplatePreviewData();
        setPreviewData(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load preview data.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPreviewData(false);
      }
    }
    fetchData();
  }, [toast]);

  const selectedAgent = previewData.find(
    (a) => a.id === Number(selectedAgentId)
  );
  const availableContacts = selectedAgent?.contacts || [];

  const selectedContact = availableContacts.find(
    (c) => c.id === Number(selectedContactId)
  );
  const availableOwners = selectedContact?.owners || [];

  const selectedOwner = availableOwners.find(
    (o) => o.id === Number(selectedOwnerId)
  );
  const availableTrademarks = selectedOwner?.trademarks || [];

  useEffect(() => {
    setSelectedContactId("");
  }, [selectedAgentId]);
  useEffect(() => {
    setSelectedOwnerId("");
  }, [selectedContactId]);
  useEffect(() => {
    setSelectedTrademarkId("all");
  }, [selectedOwnerId]);

  const templateBody = form.watch("body");
  const templateSubject = form.watch("subject");

  const renderedPreview = useMemo(() => {
    if (viewMode === 'edit' || !selectedAgent || !selectedContact || !selectedOwner) {
      return { subject: '', body: '' };
    }
    
    const trademarksForPreview = (selectedTrademarkId && selectedTrademarkId !== 'all')
      ? availableTrademarks.filter(tm => tm.id === Number(selectedTrademarkId))
      : availableTrademarks;

    const baseContext = {
      agent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        country: selectedAgent.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        area: selectedAgent.area,
      },
      owner: {
        id: selectedOwner.id,
        name: selectedOwner.name,
        country: selectedOwner.country.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
      },
      contact: {
        name: `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim(),
        email: selectedContact.email,
      },
    };
    
    const trademarksContextData = trademarksForPreview.map(tm => ({
        denomination: tm.denomination,
        class: String(tm.class),
        certificate: tm.certificate,
        expiration: format(new Date(tm.expiration), 'yyyy-MM-dd'),
        products: tm.products,
        type: tm.type
    }));

    let finalContext;

    if (trademarksContextData.length === 1) {
        finalContext = {
            ...baseContext,
            ...trademarksContextData[0],
            trademarks: trademarksContextData,
        };
    } else {
        finalContext = {
            ...baseContext,
            trademarks: trademarksContextData,
        };
    }

    try {
      const cleanSubject = (templateSubject || '').replace(/<span class="merge-tag" contenteditable="false">(.*?)<\/span>/g, '$1');
      const cleanBody = (templateBody || '').replace(/<span class="merge-tag" contenteditable="false">(.*?)<\/span>/g, '$1');

      const subjectTemplate = Handlebars.compile(cleanSubject);
      const bodyTemplate = Handlebars.compile(cleanBody);
      return {
        subject: subjectTemplate(finalContext),
        body: bodyTemplate(finalContext),
      };
    } catch (e) {
      console.error("Template rendering error:", e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error.';
      return {
        subject: 'Error rendering subject',
        body: `<p>Error rendering template. Check your merge field syntax.</p><p><b>Error:</b> ${errorMessage}</p>`,
      };
    }
  }, [
    viewMode,
    selectedAgent,
    selectedContact,
    selectedOwner,
    selectedTrademarkId,
    templateSubject,
    templateBody,
    availableTrademarks,
  ]);

  const onSubmit = async (data: TemplateFormValues) => {
    let result;
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("subject", data.subject);
    formData.append("body", data.body);

    if (template) {
      result = await updateEmailTemplate(template.id, formData);
    } else {
      result = await createEmailTemplate(formData);
    }

    if (result?.errors) {
      const { errors } = result;
      if (errors.name)
        form.setError("name", { type: "manual", message: errors.name[0] });
      if (errors.subject)
        form.setError("subject", {
          type: "manual",
          message: errors.subject[0],
        });
      if (errors.body)
        form.setError("body", { type: "manual", message: errors.body[0] });
      if (errors._form) {
        toast({
          title: "Error",
          description: errors._form[0],
          variant: "destructive",
        });
      }
    }
  };

  const handleInsertMergeField = (value: string) => {
    if (quillInstance.current) {
        const quill = quillInstance.current;
        const range = quill.getSelection(true);
        
        const htmlToInsert = `<span class="merge-tag" contenteditable="false">${value}</span>&nbsp;`;
        
        quill.clipboard.dangerouslyPasteHTML(range.index, htmlToInsert, 'user');
        
        quill.focus();
        
        const newIndex = range.index + quill.clipboard.convert(htmlToInsert).length()
        quill.setSelection(newIndex, 0, 'silent');
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card
        className={cn(
          "transition-all duration-300",
          viewMode === "edit" ? "lg:col-span-2" : "lg:col-span-3"
        )}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>
                {template
                  ? dictionary.templateForm.editTitle
                  : dictionary.templateForm.createTitle}
              </CardTitle>
              <CardDescription>
                {dictionary.templateForm.description}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setViewMode(viewMode === "edit" ? "preview" : "edit")
              }
            >
              {viewMode === "edit" ? (
                <>
                  <Eye className="mr-2" />
                  {dictionary.templateForm.previewButton}
                </>
              ) : (
                <>
                  <Code className="mr-2" />
                  {dictionary.templateForm.backToEditorButton}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "edit" ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.templateForm.nameLabel}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={dictionary.templateForm.namePlaceholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dictionary.templateForm.subjectLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            dictionary.templateForm.subjectPlaceholder
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dictionary.templateForm.bodyLabel}</FormLabel>
                      <FormControl>
                        <div className="min-h-[500px] w-full rounded-md border border-input bg-background">
                          <QuillEditor field={field} quillRef={quillInstance} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">
                  {template
                    ? dictionary.templateForm.updateButton
                    : dictionary.templateForm.createButton}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {dictionary.templateForm.previewDataTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingPreviewData ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading preview data...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        value={selectedAgentId}
                        onValueChange={setSelectedAgentId}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={dictionary.templateForm.selectAgent}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {previewData.map((agent) => (
                            <SelectItem key={agent.id} value={String(agent.id)}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedContactId}
                        onValueChange={setSelectedContactId}
                        disabled={!selectedAgentId}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={dictionary.templateForm.selectContact}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableContacts.map((contact) => (
                            <SelectItem
                              key={contact.id}
                              value={String(contact.id)}
                            >
                              {contact.firstName} {contact.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedOwnerId}
                        onValueChange={setSelectedOwnerId}
                        disabled={!selectedContactId}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={dictionary.templateForm.selectOwner}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOwners.map((owner) => (
                            <SelectItem key={owner.id} value={String(owner.id)}>
                              {owner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                       <Select
                        value={selectedTrademarkId}
                        onValueChange={setSelectedTrademarkId}
                        disabled={!selectedOwnerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={dictionary.templateForm.selectTrademark} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{dictionary.templateForm.allTrademarks}</SelectItem>
                            {availableTrademarks.map((trademark) => (
                            <SelectItem key={trademark.id} value={String(trademark.id)}>
                                {trademark.denomination}
                            </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Separator />
              {selectedOwnerId ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {dictionary.templateForm.renderedSubject}
                    </p>
                    <p className="font-semibold">{renderedPreview.subject}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {dictionary.templateForm.renderedPreview}
                    </p>
                    <div
                      className="w-full overflow-x-auto rounded-md border p-4 min-h-[400px] bg-white text-black"
                      dangerouslySetInnerHTML={{ __html: renderedPreview.body }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[400px] text-muted-foreground rounded-md border border-dashed">
                  <p>{dictionary.templateForm.selectDataForPreview}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <div
        className={cn(
          "lg:col-span-1",
          viewMode === "preview" && "hidden"
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.templateForm.mergeFieldsTitle}</CardTitle>
            <CardDescription>
              {dictionary.templateForm.mergeFieldsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MERGE_FIELDS.map((group) => (
              <div key={group.group}>
                <h4 className="font-semibold mb-2 text-sm">{group.group}</h4>
                <div className="space-y-2">
                  {group.fields.map((field) => (
                    <Button
                      key={field.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => handleInsertMergeField(field.value)}
                    >
                      <span>{field.name}</span>
                      <span className="font-code text-xs text-muted-foreground">
                        {field.value}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
