'use client';

import { Template } from '@/app/types/templates';
import { useNotifications } from '@/hooks/useNotifications';
import TemplateForm from '@/components/email/template/TemplateForm';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function NewTemplatePage() {
	const { showSuccess } = useNotifications();

	// Create empty template structure
	const emptyTemplate: Template = {
		id: 0,
		name: '',
		from_name: '',
		from_email: '',
		reply_to_email: '',
		subject: '',
		content: '',
		attachments: [],
		pdfTemplateIds: [],
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	return (
		<div className="p-4">
			<Breadcrumb
				items={[
					{ label: 'Email', href: '/email' },
					{ label: 'Templates', href: '/email/templates' },
					{ label: 'New Template' },
				]}
				homeHref="/dashboard"
			/>
			<h1 className="text-2xl font-bold mb-6">Create New Template</h1>

			<TemplateForm
				template={emptyTemplate}
				isNewTemplate={true}
				onSuccess={() => showSuccess('Template created successfully')}
			/>
		</div>
	);
}
