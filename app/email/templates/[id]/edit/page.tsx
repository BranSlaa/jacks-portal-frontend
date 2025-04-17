import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import TemplateEdit from '@/components/email/template/TemplateEdit';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PageProps {
	params: Promise<{ id: string }> | { id: string };
}

export default async function TemplateEditPage({ params }: PageProps) {
	// Resolve params properly
	const resolvedParams = await Promise.resolve(params);
	const id = resolvedParams.id;

	return (
		<Suspense
			fallback={
				<div className="flex justify-center items-center p-8">
					<LoadingSpinner />
				</div>
			}
		>
			<TemplateContent id={id} />
		</Suspense>
	);
}

async function TemplateContent({ id }: { id: string }) {
	const supabase = await createClient();

	const { data: template, error } = await supabase
		.from('templates')
		.select('*')
		.eq('id', id)
		.single();

	if (error || !template) {
		notFound();
	}

	// Fetch template attachments
	const { data: attachments } = await supabase
		.from('media')
		.select('*')
		.eq('template_id', id);

	// Fetch PDF template associations
	const { data: pdfTemplateData } = await supabase
		.from('pdf_template_media')
		.select('pdf_template_id')
		.eq('template_id', id);

	const pdfTemplateIds = pdfTemplateData
		? pdfTemplateData.map(item => item.pdf_template_id)
		: [];

	const fullTemplate = {
		...template,
		attachments: attachments || [],
		pdfTemplateIds: pdfTemplateIds,
	};

	return <TemplateEdit template={fullTemplate} />;
}
