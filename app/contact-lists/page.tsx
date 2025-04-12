import { createClient } from '@/utils/supabase/server';

export default async function ContactListPage() {
	const supabase = await createClient();
	const { data: contactLists, error } = await supabase
		.from('contact_lists')
		.select('*');

	return <div>ContactListPage</div>;
}
