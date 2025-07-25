
"use client";

import React from "react";
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
} from "@/app/(protected)/templates/actions";
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

const MERGE_FIELDS = (dictionary: any) => [
    {
        group: dictionary.templateForm.mergeFields.agent.group,
        fields: [
            { name: dictionary.templateForm.mergeFields.agent.name, value: "{{agent.name}}" },
            { name: dictionary.templateForm.mergeFields.agent.country, value: "{{agent.country}}" },
            { name: dictionary.templateForm.mergeFields.agent.area, value: "{{agent.area}}" },
        ],
    },
    {
        group: dictionary.templateForm.mergeFields.contact.group,
        fields: [
            { name: dictionary.templateForm.mergeFields.contact.firstName, value: "{{contact.firstName}}" },
            { name: dictionary.templateForm.mergeFields.contact.lastName, value: "{{contact.lastName}}" },
            { name: dictionary.templateForm.mergeFields.contact.email, value: "{{contact.email}}" },
        ],
    },
    {
        group: dictionary.templateForm.mergeFields.owner.group,
        fields: [
            { name: dictionary.templateForm.mergeFields.owner.name, value: "{{owner.name}}" },
            { name: dictionary.templateForm.mergeFields.owner.country, value: "{{owner.country}}" },
        ],
    },
    {
        group: dictionary.templateForm.mergeFields.trademark.group,
        fields: [
            { name: dictionary.templateForm.mergeFields.trademark.denomination, value: "{{denomination}}" },
            { name: dictionary.templateForm.mergeFields.trademark.class, value: "{{class}}" },
            { name: dictionary.templateForm.mergeFields.trademark.certificate, value: "{{certificate}}" },
            { name: dictionary.templateForm.mergeFields.trademark.expiration, value: "{{expiration}}" },
            { name: dictionary.templateForm.mergeFields.trademark.products, value: "{{products}}" },
            { name: dictionary.templateForm.mergeFields.trademark.type, value: "{{type}}" },
        ],
    },
    {
        group: dictionary.templateForm.mergeFields.loops.group,
        fields: [
            { name: dictionary.templateForm.mergeFields.loops.ownersLoop, value: "{{#each owners}}" },
            { name: dictionary.templateForm.mergeFields.loops.trademarksLoop, value: "{{#each trademarks}}" },
            { name: dictionary.templateForm.mergeFields.loops.endLoop, value: "{{/each}}" },
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
  const editorRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const quillInstanceRef = React.useRef<Quill | null>(null);
  const isInitialized = React.useRef(false);

  React.useImperativeHandle(ref, () => ({
    insert: (html: string) => {
      const quill = quillInstanceRef.current;
      if (quill) {
        quill.focus();
        let range = quill.getSelection(true); // Get cursor position
        let index = range ? range.index : quill.getLength(); // Insert at cursor or at the end
        
        // Insert the merge field, then a space. Quill will handle the cursor update.
        quill.clipboard.dangerouslyPasteHTML(index, html + '&nbsp;', "user");
      }
    },
  }));

  React.useEffect(() => {
    if (isInitialized.current) return;

    if (editorRef.current && toolbarRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: toolbarRef.current,
        },
      });

      quillInstanceRef.current = quill;
      isInitialized.current = true;

      // Set initial content
      // if (value) {
      //   const delta = quill.clipboard.convert({ html: value });
      //   quill.setContents(delta, "silent");
      // }
      
      quill.on("text-change", (delta, oldDelta, source) => {
        if (source === "user") {
          const currentContent = quill.root.innerHTML;
          onChange(currentContent === "<p><br></p>" ? "" : currentContent);
        }
      });
    }

    // Cleanup
    // return () => {
    //     if (quillInstanceRef.current) {
    //         quillInstanceRef.current.off('text-change');
    //     }
    // };
  // }, []); 
  }, [value]); 

  React.useEffect(() => {
    const quill = quillInstanceRef.current;
    if (quill && quill.root.innerHTML !== value && !quill.hasFocus()) {
        const delta = quill.clipboard.convert({ html: value || "" });
        quill.setContents(delta, "silent");
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
      <div ref={editorRef} />
    </>
  );
});
QuillEditor.displayName = "QuillEditor";

interface TemplateFormProps {
  template?: EmailTemplate;
}

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
    defaultValues: template || {
      name: "",
      subject: "",
      body: "",
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
  
  const availableOwners = selectedContact?.ownerContacts.map(oc => oc.owner) || [];
  
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

    const ownersContext = ownersForPreview.map(owner => ({
        ...owner,
        country: owner.country.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        trademarks: owner.trademarks.map(tm => ({
            denomination: tm.denomination,
            class: tm.trademarkClasses.map(tc => tc.class.id).join(', '),
            certificate: tm.certificate,
            expiration: format(new Date(tm.expiration), "yyyy-MM-dd"),
            products: tm.products,
            type: tm.type,
        }))
    }));

    const allTrademarksForContext = (selectedOwner?.trademarks || []).map(tm => ({
        denomination: tm.denomination,
        class: tm.trademarkClasses.map(tc => tc.class.id).join(', '),
        certificate: tm.certificate,
        expiration: format(new Date(tm.expiration), "yyyy-MM-dd"),
        products: tm.products,
        type: tm.type,
    }));

     const trademarksForSingleOwnerPreview =
      selectedTrademarkId !== "all" && selectedOwner
        ? allTrademarksForContext.filter(
            (tm) => tm.certificate === availableTrademarks.find(t => t.id === Number(selectedTrademarkId))?.certificate
          )
        : allTrademarksForContext;


    let finalContext: any = {
      agent: {
        name: selectedAgent.name,
        country: selectedAgent.country.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
        area: selectedAgent.area,
      },
      contact: {
        firstName: selectedContact.firstName || "",
        lastName: selectedContact.lastName || "",
        email: selectedContact.email,
      },
      owners: ownersContext,
    };
    
    if (ownersContext.length === 1) {
        finalContext.owner = ownersContext[0];
        finalContext.trademarks = trademarksForSingleOwnerPreview;
    }
    
    if (trademarksForSingleOwnerPreview.length === 1) {
        finalContext = {
            ...finalContext,
            ...trademarksForSingleOwnerPreview[0],
        };
    }
    
    const isMultiOwnerTemplate = (body: string) => /\{\{#each\s+owners\}\}/.test(body);
    const cleanTemplate = (str: string) => (str || '').replace(/<span class="merge-tag" contenteditable="false">({{[^}]+}})<\/span>/g, '$1');

    const renderMultiOwnerPreview = (templateString: string, context: any) => {
        if (!templateString || typeof window === 'undefined') return '';
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(cleanTemplate(templateString), 'text/html');
            const textContent = doc.body.textContent || "";
            const compiledTemplate = Handlebars.compile(textContent, { noEscape: true });
            return compiledTemplate(context).replace(/\n/g, '<br />');
        } catch (e) {
            console.error("Multi-owner template rendering error:", e);
            return "Error rendering multi-owner template.";
        }
    };
    
    const renderSimplePreview = (templateString: string, context: any) => {
        if (!templateString || typeof window === 'undefined') return '';
        try {
            const compiledTemplate = Handlebars.compile(cleanTemplate(templateString), { noEscape: true });
            return compiledTemplate(context);
        } catch (e) {
            console.error("Simple template rendering error:", e);
            return "Error rendering template.";
        }
    };
    
    const compileSubject = (templateString: string): string => {
        if (!templateString) return '';
        try {
            const compiled = Handlebars.compile(cleanTemplate(templateString), { noEscape: true });
            return compiled(finalContext);
        } catch (e) {
            console.error("Subject rendering error:", e);
            return "Error in subject";
        }
    }

    return {
        subject: compileSubject(templateSubject),
        body: isMultiOwnerTemplate(templateBody)
          ? renderMultiOwnerPreview(templateBody, finalContext)
          : renderSimplePreview(templateBody, finalContext),
    };

  }, [
    viewMode,
    selectedAgent,
    selectedContact,
    ownersForPreview,
    selectedOwner,
    selectedTrademarkId,
    availableTrademarks,
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
                      className="w-full overflow-x-auto rounded-md border p-4 min-h-[400px] bg-white text-black whitespace-pre-wrap"
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
            {MERGE_FIELDS(dictionary).map((group) => (
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
