import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PdfTemplateForm from '@/components/pdf/PdfTemplateForm';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default async function EditPdfTemplatePage({
	params,
}: {
	params: { id: string };
}) {
	const supabase = await createClient();
	const id = parseInt(params.id);

	if (isNaN(id)) {
		notFound();
	}

	const { data, error } = await supabase
		.from('pdf_templates')
		.select('*')
		.eq('id', id)
		.single();

	if (error || !data) {
		notFound();
	}

	return (
		<div className="container py-8">
			<Breadcrumb
				items={[
					{ label: 'Email', href: '/email' },
					{ label: 'PDF Templates', href: '/email/pdf-templates' },
					{ label: 'Edit Template' },
				]}
				homeHref="/dashboard"
			/>
			<Card>
				<CardHeader>
					<CardTitle>Edit PDF Template</CardTitle>
				</CardHeader>
				<CardContent>
					<PdfTemplateForm
						id={id}
						initialData={{
							name: data.name,
							description: data.description || '',
							html_content: data.html_content || '',
							css_content: data.css_content || '',
							client_id: data.client_id || 0,
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
