"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
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
} from "@/app/templates/actions";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[500px] w-full rounded-md border border-input bg-background animate-pulse" />
  ),
});

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
      { name: "Trademark Name", value: "{{{trademark}}}" },
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

export function TemplateForm({ template }: TemplateFormProps) {
  const { toast } = useToast();
  const [editorMode, setEditorMode] = useState<"rich" | "html">("rich");
  const [mounted, setMounted] = useState(false);

  const form = useForm<z.infer<typeof TemplateSchema>>({
    resolver: zodResolver(TemplateSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      body: template?.body || "",
    },
  });

  const [state, setState] = useState<{ errors?: any } | null>(null);

  const onSubmit = async (data: z.infer<typeof TemplateSchema>) => {
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

    setState(result);

    if (result?.errors) {
      const { errors } = result;
      if ("name" in errors && errors.name && Array.isArray(errors.name))
        form.setError("name", { type: "manual", message: errors.name[0] });
      if (
        "subject" in errors &&
        errors.subject &&
        Array.isArray(errors.subject)
      )
        form.setError("subject", {
          type: "manual",
          message: errors.subject[0],
        });
      if ("body" in errors && errors.body && Array.isArray(errors.body))
        form.setError("body", { type: "manual", message: errors.body[0] });
      if ("_form" in errors && errors._form && Array.isArray(errors._form)) {
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
    toast({ title: "Copied to clipboard", description: value });
  };

  const quillModules = {
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
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {template ? "Edit Template" : "Create New Template"}
          </CardTitle>
          <CardDescription>
            Design your email template. Use the merge fields to personalize your
            emails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 'Trademark Renewal Notice'"
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
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Subject Line" {...field} />
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
                    <FormLabel>Email Body</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute top-2 right-2 z-10">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditorMode(
                                editorMode === "rich" ? "html" : "rich"
                              )
                            }
                          >
                            {editorMode === "rich" ? "View HTML" : "Rich Editor"}
                          </Button>
                        </div>
                        {editorMode === "rich" ? (
                          mounted ? (
                            <ReactQuill
                              theme="snow"
                              value={field.value}
                              onChange={field.onChange}
                              modules={quillModules}
                            />
                          ) : (
                            <div className="min-h-[500px] w-full rounded-md border border-input bg-background animate-pulse" />
                          )
                        ) : (
                          <Textarea
                            placeholder="<html>...</html>"
                            className="min-h-[500px] font-code text-sm pt-12"
                            {...field}
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Warning: Switching from HTML to Rich Text may alter
                      complex HTML or custom merge fields.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                {template ? "Update Template" : "Create Template"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Merge Fields</CardTitle>
            <CardDescription>
              Click to copy a merge field to your clipboard.
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
