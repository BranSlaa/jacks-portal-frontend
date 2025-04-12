import { createClient } from '@/utils/supabase/server';

export default async function ContactDetailedPage() {
	const supabase = await createClient();
	const { data: contacts, error } = await supabase
		.from('contacts')
		.select('*');

	return <div>ContactDetailedPage</div>;
}
