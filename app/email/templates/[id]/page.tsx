import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import TemplateDetail from '@/components/email/template/TemplateDetail';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PageProps {
	params: Promise<{ id: string }> | { id: string };
}

interface PdfTemplateItem {
	pdf_template_id: number;
}

export default async function TemplateDetailPage({ params }: PageProps) {
	// Await params if it's a Promise
	const resolvedParams = await Promise.resolve(params);
	const id = resolvedParams.id;

	// Fetch template data from Supabase
	const supabase = await createClient();
	const { data: template, error } = await supabase
		.from('templates')
		.select('*')
		.eq('id', id)
		.single();

	if (error || !template) {
		notFound();
	}

	// Fetch attachments if any
	const { data: attachments } = await supabase
		.from('media')
		.select('*')
		.eq('template_id', id);

	// Fetch PDF templates if any
	const { data: pdfTemplates } = await supabase
		.from('template_pdf_templates')
		.select('pdf_template_id')
		.eq('template_id', id);

	// Build the full template object
	const fullTemplate = {
		...template,
		attachments: attachments || [],
		pdf_templates:
			pdfTemplates?.map((pt: PdfTemplateItem) => pt.pdf_template_id) ||
			[],
	};

	return (
		<div className="container mx-auto p-4">
			<Suspense
				fallback={
					<div className="flex justify-center items-center p-8">
						<LoadingSpinner />
					</div>
				}
			>
				<TemplateDetail template={fullTemplate} templateId={id} />
			</Suspense>
		</div>
	);
}
