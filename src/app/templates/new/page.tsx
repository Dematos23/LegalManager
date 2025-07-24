import { TemplateForm } from '@/components/template-form';
import { MainLayout } from '@/components/main-layout';

export default function NewTemplatePage() {
  return (
    <MainLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <TemplateForm />
        </div>
    </MainLayout>
  );
}
