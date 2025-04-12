import { createClient } from '@/utils/supabase/server';

export default async function ContactPage() {
	const supabase = await createClient();
	const { data: contacts, error } = await supabase
		.from('contacts')
		.select('*');

	return <div>ContactPage</div>;
}
