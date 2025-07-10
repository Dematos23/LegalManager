import { getEmailTemplate } from '@/app/templates/actions';
import { TemplateForm } from '@/components/template-form';
import { notFound } from 'next/navigation';

type EditTemplatePageProps = {
    params: {
        id: string;
    }
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = await params;
  const templateId = parseInt(id, 10);
  const template = await getEmailTemplate(templateId);

  if (!template) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TemplateForm template={template} />
    </div>
  );
}
