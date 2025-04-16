import { createClient } from '@/utils/supabase/server';

export default async function PdfTemplateDetailedPage() {
	const supabase = await createClient();
	const { data: pdfTemplates, error } = await supabase
		.from('pdf_templates')
		.select('*');

	return <div>PdfTemplateDetailedPage</div>;
}
