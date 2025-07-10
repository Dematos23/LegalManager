
"use client";

import React, { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  body: z.string().min(1, "Body cannot be empty."),
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
    group: "Owners (Loop)",
    fields: [
        { name: "Start Owners Loop", value: "{{#each owners}}" },
        { name: "Owner Name", value: "{{name}}" },
        { name: "Owner Country", value: "{{country}}" },
        { name: "Start Trademarks Loop", value: "{{#each trademarks}}" },
        { name: "Denomination", value: "{{denomination}}" },
        { name: "Class", value: "{{class}}" },
        { name: "Expiration", value: "{{expiration}}" },
        { name: "End Trademarks Loop", value: "{{/each}}" },
        { name: "End Owners Loop", value: "{{/each}}" },
    ],
  },
  {
    group: "Trademarks (Loop - Single Owner)",
    fields: [
      { name: "Owner Name", value: "{{owner.name}}" },
      { name: "Owner Country", value: "{{owner.country}}" },
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


type QuillEditorHandle = {
  insert: (html: string) => void;
};

const QuillEditor = React.forwardRef<
  QuillEditorHandle,
  { value: string; onChange: (value: string) => void }
>(({ value, onChange }, ref) => {
  const quillInstanceRef = React.useRef<Quill | null>(null);
  const editorContainerRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    insert: (html: string) => {
      const quill = quillInstanceRef.current;
      if (quill) {
        let range = quill.getSelection();
        let index = range ? range.index : quill.getLength();
        quill.clipboard.dangerouslyPasteHTML(index, html, 'user');
        quill.focus();
      }
    },
  }));

  useEffect(() => {
    if (!editorContainerRef.current || !toolbarRef.current || quillInstanceRef.current) return;

    const quill = new Quill(editorContainerRef.current, {
      theme: 'snow',
      modules: {
        toolbar: toolbarRef.current,
      },
    });

    quillInstanceRef.current = quill;

    // Set initial content
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(0, value);
    }
    
    const handler = (delta: any, oldDelta: any, source: string) => {
      if (source === 'user') {
        const currentContent = quill.root.innerHTML;
        onChange(currentContent === '<p><br></p>' ? '' : currentContent);
      }
    };
    
    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
      const editorElement = editorContainerRef.current;
      if (editorElement) {
        editorElement.innerHTML = '';
      }
      quillInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // This effect ensures that if the `value` prop changes from outside (e.g., form.reset),
  // the editor updates its content, but only if it doesn't currently have focus.
  // This prevents losing the user's cursor position during typing.
  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (quill && value !== quill.root.innerHTML && !quill.hasFocus()) {
      quill.clipboard.dangerouslyPasteHTML(0, value || '');
    }
  }, [value]);


  return (
    <>
      <div id="custom-quill-toolbar" ref={toolbarRef}>
        <span className="ql-formats">
          <select className="ql-header">
            <option value="1"></option>
            <option value="2"></option>
            <option value="3"></option>
            <option value=""></option>
          </select>
        </span>
        <span className="ql-formats">
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <button className="ql-underline"></button>
          <button className="ql-strike"></button>
          <button className="ql-blockquote"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-list" value="ordered"></button>
          <button className="ql-list" value="bullet"></button>
          <button className="ql-indent" value="-1"></button>
          <button className="ql-indent" value="+1"></button>
        </span>
        <span className="ql-formats">
          <button className="ql-link"></button>
          <button className="ql-clean"></button>
        </span>
      </div>
      <div ref={editorContainerRef} />
    </>
  );
});
QuillEditor.displayName = "QuillEditor";

export function TemplateForm({ template }: TemplateFormProps) {
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const quillEditorRef = React.useRef<QuillEditorHandle>(null);
  const [viewMode, setViewMode] = React.useState<"edit" | "preview">("edit");
  const [previewData, setPreviewData] = React.useState<AgentWithNestedData[]>(
    []
  );
  const [isLoadingPreviewData, setIsLoadingPreviewData] = React.useState(true);

  const [selectedAgentId, setSelectedAgentId] = React.useState<string>("");
  const [selectedContactId, setSelectedContactId] = React.useState<string>("");
  const [selectedOwnerId, setSelectedOwnerId] = React.useState<string>("all");
  const [selectedTrademarkId, setSelectedTrademarkId] =
    React.useState<string>("all");

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(TemplateSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      body: template?.body || "",
    },
    mode: 'onChange'
  });

  React.useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
    }
  }, [template, form]);

  React.useEffect(() => {
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
  
  const ownersForPreview = selectedOwnerId !== "all"
    ? availableOwners.filter(o => o.id === Number(selectedOwnerId))
    : availableOwners;

  const selectedOwner = ownersForPreview.length === 1 ? ownersForPreview[0] : null;

  const availableTrademarks = selectedOwner?.trademarks || [];

  React.useEffect(() => {
    setSelectedContactId("");
  }, [selectedAgentId]);
  React.useEffect(() => {
    setSelectedOwnerId("all");
  }, [selectedContactId]);
  React.useEffect(() => {
    setSelectedTrademarkId("all");
  }, [selectedOwnerId]);

  const templateBody = form.watch("body");
  const templateSubject = form.watch("subject");

  const renderedPreview = React.useMemo(() => {
    if (viewMode === "edit" || !selectedAgent || !selectedContact) {
      return { subject: "", body: "" };
    }

    const trademarksForSingleOwnerPreview =
      selectedTrademarkId !== "all" && selectedOwner
        ? selectedOwner.trademarks.filter(
            (tm) => tm.id === Number(selectedTrademarkId)
          )
        : selectedOwner?.trademarks || [];

    const ownersContext = ownersForPreview.map(owner => ({
        ...owner,
        country: owner.country.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        trademarks: owner.trademarks.map(tm => ({
            denomination: tm.denomination,
            class: String(tm.class),
            certificate: tm.certificate,
            expiration: format(new Date(tm.expiration), "yyyy-MM-dd"),
            products: tm.products,
            type: tm.type,
        }))
    }));

    const allTrademarksContext = (selectedOwner?.trademarks || []).map(tm => ({
        denomination: tm.denomination,
        class: String(tm.class),
        certificate: tm.certificate,
        expiration: format(new Date(tm.expiration), "yyyy-MM-dd"),
        products: tm.products,
        type: tm.type,
    }));

    let finalContext: any = {
      agent: {
        name: selectedAgent.name,
        country: selectedAgent.country.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        area: selectedAgent.area,
      },
      contact: {
        name: `${selectedContact.firstName || ""} ${selectedContact.lastName || ""}`.trim(),
        email: selectedContact.email,
      },
      owners: ownersContext,
      trademarks: allTrademarksContext
    };
    
    if (ownersContext.length === 1) {
        finalContext.owner = ownersContext[0];
    }
    
    if (allTrademarksContext.length === 1) {
        finalContext = {
            ...finalContext,
            ...allTrademarksContext[0],
        };
    }

    try {
      const cleanTemplate = (templateString: string) => 
        (templateString || '').replace(/<span class="merge-tag" contenteditable="false">({{[^}]+}})<\/span>/g, '$1').replace(/&nbsp;/g, ' ');

      const subjectTemplate = Handlebars.compile(cleanTemplate(templateSubject));
      const bodyTemplate = Handlebars.compile(cleanTemplate(templateBody));
      return {
        subject: subjectTemplate(finalContext),
        body: bodyTemplate(finalContext),
      };
    } catch (e) {
      console.error("Template rendering error:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error.";
      return {
        subject: "Error rendering subject",
        body: `<p>Error rendering template. Check your merge field syntax.</p><p><b>Error:</b> ${errorMessage}</p>`,
      };
    }
  }, [
    viewMode,
    selectedAgent,
    selectedContact,
    ownersForPreview,
    selectedOwner,
    selectedTrademarkId,
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
      if ("name" in errors && errors.name) {
        form.setError("name", { type: "manual", message: errors.name[0] });
      }
      if ("subject" in errors && errors.subject) {
        form.setError("subject", {
          type: "manual",
          message: errors.subject[0],
        });
      }
      if ("body" in errors && errors.body) {
        form.setError("body", { type: "manual", message: errors.body[0] });
      }
      if ("_form" in errors && errors._form) {
        toast({
          title: "Error",
          description: errors._form[0],
          variant: "destructive",
        });
      }
    }
  };

  const handleInsertMergeField = (value: string) => {
    if (quillEditorRef.current) {
      const htmlToInsert = `<span class="merge-tag" contenteditable="false">${value}</span>`;
      quillEditorRef.current.insert(htmlToInsert);
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
                        <div className="w-full rounded-md border border-input bg-background">
                          <QuillEditor
                            ref={quillEditorRef}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : template ? (
                    dictionary.templateForm.updateButton
                  ) : (
                    dictionary.templateForm.createButton
                  )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                          <SelectValue placeholder={dictionary.templateForm.selectOwner} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Owners</SelectItem>
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
                        disabled={!selectedOwnerId || selectedOwnerId === 'all'}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              dictionary.templateForm.selectTrademark
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {dictionary.templateForm.allTrademarks}
                          </SelectItem>
                          {availableTrademarks.map((trademark) => (
                            <SelectItem
                              key={trademark.id}
                              value={String(trademark.id)}
                            >
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
              {selectedContactId ? (
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
      <div className={cn("lg:col-span-1", viewMode === "preview" && "hidden")}>
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
