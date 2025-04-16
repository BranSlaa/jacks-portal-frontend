import { createClient } from '@/utils/supabase/server';

export default async function TemplateDetailedPage() {
	const supabase = await createClient();
	const { data: templates, error } = await supabase
		.from('templates')
		.select('*');

	return <div>TemplateDetailedPage</div>;
}
