
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
    group: "Contact",
    fields: [
      { name: "Contact Name", value: "{{contact.name}}" },
      { name: "Contact Email", value: "{{contact.email}}" },
    ],
  },
  {
    group: "Trademarks (Loop)",
    fields: [
      { name: "Start Loop", value: "{{#each trademarks}}" },
      { name: "Trademark Name", value: "{{{denomination}}}" },
      { name: "Class", value: "{{{class}}}" },
      { name: "Certificate", value: "{{{certificate}}}" },
      { name: "Expiration Date", value: "{{{expiration}}}" },
      { name: "End Loop", value: "{{/each}}" },
    ],
  },
  {
    group: "Other",
    fields: [{ name: "CRM Data", value: "{{crmData}}" }],
  },
];

const QuillEditor = ({
  field,
}: {
  field: ControllerRenderProps<TemplateFormValues, "body">;
}) => {
  const quillInstance = useRef<Quill | null>(null);

  const editorRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof window === "undefined" || !node) return;

      if (!quillInstance.current) {
        quillInstance.current = new Quill(node, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike", "blockquote"],
              [
                { list: "ordered" },
                { list: "bullet" },
                { indent: "-1" },
                { indent: "+1" },
              ],
              ["link"],
              ["clean"],
            ],
          },
        });

        const quill = quillInstance.current;
        quill.root.innerHTML = field.value || "";

        quill.on("text-change", (delta, oldDelta, source) => {
          if (source === "user") {
            let content = quill.root.innerHTML;
            if (content === "<p><br></p>") {
              content = "";
            }
            field.onChange(content);
          }
        });
      }
    },
    [field]
  );

  useEffect(() => {
    if (
      quillInstance.current &&
      quillInstance.current.root.innerHTML !== field.value
    ) {
      const delta = quillInstance.current.clipboard.convert(field.value);
      quillInstance.current.setContents(delta, "silent");
    }
  }, [field.value]);

  return <div ref={editorRef} />;
};

export function TemplateForm({ template }: TemplateFormProps) {
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [previewData, setPreviewData] = useState<AgentWithNestedData[]>([]);
  const [isLoadingPreviewData, setIsLoadingPreviewData] = useState(true);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [selectedTrademarkId, setSelectedTrademarkId] = useState<string>("");

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

  const selectedTrademark = availableTrademarks.find(
    (t) => t.id === Number(selectedTrademarkId)
  );

  useEffect(() => {
    setSelectedContactId("");
  }, [selectedAgentId]);
  useEffect(() => {
    setSelectedOwnerId("");
  }, [selectedContactId]);
  useEffect(() => {
    setSelectedTrademarkId("");
  }, [selectedOwnerId]);

  const templateBody = form.watch("body");
  const templateSubject = form.watch("subject");

  const renderedPreview = useMemo(() => {
    if (viewMode === 'edit' || !selectedAgent || !selectedContact || !selectedTrademark) {
      return { subject: '', body: '' };
    }

    const context = {
      contact: {
        name: `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim(),
        email: selectedContact.email,
      },
      trademarks: [{
        ...selectedTrademark,
        class: String(selectedTrademark.class),
        expiration: format(new Date(selectedTrademark.expiration), 'yyyy-MM-dd'),
      }],
      crmData: `Contact since ${format(new Date(selectedContact.createdAt), 'yyyy-MM-dd')}. Associated with agent: ${selectedAgent.name}.`,
    };

    try {
      const subjectTemplate = Handlebars.compile(templateSubject || '');
      const bodyTemplate = Handlebars.compile(templateBody || '');
      return {
        subject: subjectTemplate(context),
        body: bodyTemplate(context),
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
    selectedTrademark,
    templateSubject,
    templateBody,
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

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: dictionary.templateForm.copied, description: value });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
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
                          <QuillEditor field={field} />
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
                          <SelectValue
                            placeholder={
                              dictionary.templateForm.selectTrademark
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTrademarks.map((tm) => (
                            <SelectItem key={tm.id} value={String(tm.id)}>
                              {tm.denomination}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Separator />
              {selectedTrademarkId ? (
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
                  <p>{dictionary.templateForm.selectTrademark}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="lg:col-span-1">
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
                      onClick={() => handleCopy(field.value)}
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
