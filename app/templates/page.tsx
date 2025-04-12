import { createClient } from '@/utils/supabase/server';

export default async function TemplatePage() {
	const supabase = await createClient();
	const { data: templates, error } = await supabase
		.from('templates')
		.select('*');

	return <div>TemplatePage</div>;
}
