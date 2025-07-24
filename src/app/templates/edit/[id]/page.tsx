import { getEmailTemplate } from '@/app/templates/actions';
import { TemplateForm } from '@/components/template-form';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/main-layout';

type EditTemplatePageProps = {
    params: {
        id: string;
    }
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const template = await getEmailTemplate(params.id);

  if (!template) {
    notFound();
  }

  return (
    <MainLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <TemplateForm template={template} />
        </div>
    </MainLayout>
  );
}
