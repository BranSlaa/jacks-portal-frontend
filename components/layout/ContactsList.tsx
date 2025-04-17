'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Edit2 } from 'lucide-react';
import { Contact } from '@/app/types/contacts';

export default function ContactsList() {
	const [contacts, setContacts] = useState<Partial<Contact>[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	useEffect(() => {
		const fetchContacts = async () => {
			try {
				const { data, error } = await supabase
					.from('contacts')
					.select(
						'id, first_name, last_name, email, created_at, updated_at',
					)
					.order('updated_at', { ascending: false })
					.limit(5);

				if (error) {
					console.error('Error fetching contacts:', error);
				} else {
					setContacts(data || []);
				}
			} catch (err) {
				console.error('Error in fetchContacts:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchContacts();
	}, [supabase]);

	// Format date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-CA', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className="p-4">
			<h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
				Recent Contacts
			</h3>
			{loading ? (
				<div className="text-center text-gray-500 dark:text-gray-400">
					Loading...
				</div>
			) : contacts.length > 0 ? (
				<ul className="space-y-3">
					{contacts.map(contact => (
						<li
							key={contact.id}
							className="border-b border-gray-200 dark:border-gray-700 pb-2"
						>
							<div className="flex justify-between items-center">
								<Link
									href={`/email/contacts/${contact.id}`}
									className="text-blue-600 dark:text-blue-400 hover:underline"
								>
									{`${contact.first_name} ${contact.last_name}`}
								</Link>
								<Link
									href={`/email/contacts/${contact.id}/edit`}
									className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								>
									<Edit2 className="w-4 h-4" />
								</Link>
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{contact.email}
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Updated {formatDate(contact.updated_at || '')}
							</p>
						</li>
					))}
				</ul>
			) : (
				<div className="text-center text-gray-500 dark:text-gray-400">
					No contacts found
				</div>
			)}
		</div>
	);
}
