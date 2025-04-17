'use client';

import { useState } from 'react';
import { Template } from '@/app/types/templates';
import TemplateForm from './TemplateForm';
import { useNotifications } from '@/hooks/useNotifications';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface TemplateEditProps {
	template: Template;
}

export default function TemplateEdit({ template }: TemplateEditProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { showSuccess } = useNotifications();

	const handleSuccess = () => {
		setIsSubmitting(false);
		showSuccess('Template updated successfully');
	};

	return (
		<div className="mx-auto">
			<Breadcrumb
				items={[
					{ label: 'Email', href: '/email' },
					{ label: 'Templates', href: '/email/templates' },
					{ label: `Edit ${template.name}` },
				]}
				homeHref="/dashboard"
			/>

			<div className="mt-6">
				<h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
					Edit Template
				</h1>

				<TemplateForm
					template={template}
					isNewTemplate={false}
					onSuccess={handleSuccess}
				/>
			</div>
		</div>
	);
}
