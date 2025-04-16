'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { Contact } from '@/app/types/contacts';

export default function ContactDetailedPage() {
	const [contact, setContact] = useState<Contact | null>(null);
	const [loading, setLoading] = useState(true);
	const [clientName, setClientName] = useState<string>('');
	const [contactLists, setContactLists] = useState<
		Array<{ id: string; name: string }>
	>([]);
	const params = useParams();
	const router = useRouter();
	const supabase = createClient();
	const { showError, showSuccess } = useNotifications();
	const contactId = params.id as string;

	useEffect(() => {
		const fetchContactDetails = async () => {
			setLoading(true);
			try {
				// Fetch contact data
				const { data, error } = await supabase
					.from('contacts')
					.select('*')
					.eq('id', contactId)
					.single();

				if (error) throw error;
				if (!data) {
					showError('Contact not found');
					router.push('/email/contacts');
					return;
				}

				// Fetch client name
				const { data: clientData, error: clientError } = await supabase
					.from('clients')
					.select('name')
					.eq('id', data.client_id)
					.single();

				if (!clientError && clientData) {
					setClientName(clientData.name);
				}

				// Fetch contact lists with names
				const { data: membershipData, error: membershipError } =
					await supabase
						.from('contact_list_contacts')
						.select('contact_list_id')
						.eq('contact_id', contactId);

				if (membershipError) {
					console.error(
						'Error fetching list memberships:',
						membershipError,
					);
				} else if (membershipData && membershipData.length > 0) {
					// Get the list IDs
					const listIds = membershipData.map(
						item => item.contact_list_id,
					);

					// Fetch the actual list details
					const { data: listsData, error: listsError } =
						await supabase
							.from('contact_lists')
							.select('id, name')
							.in('id', listIds);

					if (!listsError && listsData) {
						setContactLists(listsData);
					}
				}

				setContact(data);
				showSuccess('Contact details loaded');
			} catch (error: any) {
				console.error('Error fetching contact details:', error);
				showError(`Failed to load contact: ${error.message}`);
			} finally {
				setLoading(false);
			}
		};

		fetchContactDetails();

		// Set up real-time subscription
		const channel = supabase
			.channel(`contact-${contactId}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'contacts',
					filter: `id=eq.${contactId}`,
				},
				payload => {
					setContact(payload.new as Contact);
					showSuccess('Contact updated');
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [contactId, router, showError, showSuccess, supabase]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-96">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (!contact) {
		return (
			<div className="p-4 text-center">
				<p className="text-red-500">Contact not found</p>
				<Link
					href="/email/contacts"
					className="text-blue-600 hover:underline mt-4 inline-block"
				>
					Return to contacts
				</Link>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					{contact.title} {contact.first_name} {contact.last_name}
				</h1>
				<div className="flex space-x-2">
					<Link
						href={`/email/contacts/${contactId}/edit`}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
					>
						Edit Contact
					</Link>
					<Link
						href="/email/contacts"
						className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
					>
						Back to Contacts
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">
						Contact Information
					</h2>
					<div className="space-y-4">
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Email
							</p>
							<p className="text-gray-800 dark:text-gray-200">
								{contact.email}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Phone
							</p>
							<p className="text-gray-800 dark:text-gray-200">
								{contact.phone_number || 'Not provided'}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Instagram Handle
							</p>
							<p className="text-gray-800 dark:text-gray-200">
								{contact.instagram_handle || 'Not provided'}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Client
							</p>
							<p className="text-gray-800 dark:text-gray-200">
								{clientName || 'Unknown Client'}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Contact Lists
							</p>
							{contactLists.length > 0 ? (
								<div className="flex flex-wrap gap-2 mt-1">
									{contactLists.map(list => (
										<Link
											key={list.id}
											href={`/email/contact-lists/${list.id}`}
											className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
										>
											{list.name}
										</Link>
									))}
								</div>
							) : (
								<p className="text-gray-800 dark:text-gray-200">
									Not in any contact lists
								</p>
							)}
						</div>
					</div>
				</section>

				<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">
						Professional Information
					</h2>
					<div className="space-y-4">
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Company
							</p>
							<p className="text-gray-800 dark:text-gray-200">
								{contact.company || 'Not provided'}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Job Title
							</p>
							<p className="text-gray-800 dark:text-gray-200">
								{contact.job_title || 'Not provided'}
							</p>
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Website
							</p>
							{contact.website ? (
								<a
									href={
										contact.website.startsWith('http')
											? contact.website
											: `https://${contact.website}`
									}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline"
								>
									{contact.website}
								</a>
							) : (
								<p className="text-gray-800 dark:text-gray-200">
									Not provided
								</p>
							)}
						</div>
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Last Updated
							</p>
							<p className="text-gray-800 dark:text-gray-200">
								{new Date(
									contact.updated_at,
								).toLocaleDateString('en-CA')}{' '}
								at{' '}
								{new Date(
									contact.updated_at,
								).toLocaleTimeString('en-CA')}
							</p>
						</div>
					</div>
				</section>

				<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2">
					<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">
						Analytics
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
							<h3 className="text-lg font-medium mb-2">
								Email Engagement
							</h3>
							<p className="text-3xl font-bold">0%</p>
							<p className="text-sm text-gray-500 mt-1">
								Open rate
							</p>
						</div>
						<div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
							<h3 className="text-lg font-medium mb-2">
								Click Rate
							</h3>
							<p className="text-3xl font-bold">0%</p>
							<p className="text-sm text-gray-500 mt-1">
								Average CTR
							</p>
						</div>
						<div className="bg-gray-100 dark:bg-gray-700 rounded p-4">
							<h3 className="text-lg font-medium mb-2">
								Campaign Activity
							</h3>
							<p className="text-3xl font-bold">0</p>
							<p className="text-sm text-gray-500 mt-1">
								Campaigns received
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
