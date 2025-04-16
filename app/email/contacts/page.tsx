'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PostTable from '@/components/PostTable';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { Contact } from '@/app/types/contacts';

export default function ContactPage() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(true);
	const [clientNames, setClientNames] = useState<{ [key: string]: string }>(
		{},
	);
	const supabase = createClient();
	const { showError, showSuccess } = useNotifications();

	// Function to fetch client names
	const fetchClientNames = async (clientIds: string[]) => {
		if (!clientIds.length) return {};

		try {
			const { data, error } = await supabase
				.from('clients')
				.select('id, name')
				.in('id', clientIds);

			if (error) throw error;

			const nameMap: { [key: string]: string } = {};
			data.forEach(client => {
				nameMap[client.id] = client.name;
			});

			return nameMap;
		} catch (error) {
			console.error('Error fetching client names:', error);
			return {};
		}
	};

	// Helper function to get contact lists for a contact
	const getContactLists = async (contactId: string) => {
		try {
			// Get list memberships
			const { data: membershipData, error: membershipError } =
				await supabase
					.from('contact_list_contacts')
					.select('contact_list_id')
					.eq('contact_id', contactId);

			if (membershipError) {
				console.error(
					'Error fetching contact list memberships:',
					membershipError,
				);
				return [];
			}

			if (!membershipData || membershipData.length === 0) {
				return [];
			}

			// Get list details
			const listIds = membershipData.map(item => item.contact_list_id);
			const { data: listsData, error: listsError } = await supabase
				.from('contact_lists')
				.select('id, name')
				.in('id', listIds);

			if (listsError) {
				console.error('Error fetching contact lists:', listsError);
				return [];
			}

			return listsData || [];
		} catch (error) {
			console.error('Error in getContactLists:', error);
			return [];
		}
	};

	// Title update function
	const handleTitleUpdate = async (contactId: string, newTitle: string) => {
		try {
			const { error } = await supabase
				.from('contacts')
				.update({ title: newTitle })
				.eq('id', contactId);

			if (error) throw error;

			// Update the contact in the local state
			setContacts(prev =>
				prev.map(contact =>
					contact.id === contactId
						? { ...contact, title: newTitle }
						: contact,
				),
			);

			showSuccess('Title updated successfully');
		} catch (error: any) {
			console.error('Error updating title:', error);
			showError(`Failed to update title: ${error.message}`);
		}
	};

	useEffect(() => {
		const fetchContacts = async () => {
			setLoading(true);
			try {
				// Get contacts data
				const { data, error } = await supabase
					.from('contacts')
					.select('*')
					.order('updated_at', { ascending: false });

				if (error) throw error;

				// Get unique client IDs to fetch client names
				const clientIds = Array.from(
					new Set(data.map(contact => contact.client_id)),
				);
				const clientNamesMap = await fetchClientNames(clientIds);
				setClientNames(clientNamesMap);

				// Enhance with list membership count and client names
				const enhancedContacts = await Promise.all(
					(data || []).map(async contact => {
						// Get list memberships
						const contactLists = await getContactLists(contact.id);

						return {
							...contact,
							list_count: contactLists.length,
							contact_lists: contactLists,
							client_name:
								clientNamesMap[contact.client_id] ||
								'Unknown Client',
						};
					}),
				);

				setContacts(enhancedContacts);
				showSuccess('Contacts loaded successfully');
			} catch (error: any) {
				console.error('Error fetching contacts:', error);
				showError(`Failed to load contacts: ${error.message}`);
			} finally {
				setLoading(false);
			}
		};

		fetchContacts();

		const channel = supabase
			.channel('contacts-changes')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'contacts' },
				payload => {
					const newContact = payload.new as Contact;
					setContacts(prev => [
						...prev,
						{ ...newContact, list_count: 0 },
					]);
					showSuccess('New contact added');
				},
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'contacts' },
				payload => {
					const updatedContact = payload.new as Contact;
					setContacts(prev =>
						prev.map(contact => {
							if (contact.id === updatedContact.id) {
								return {
									...updatedContact,
									list_count: contact.list_count || 0,
								};
							}
							return contact;
						}),
					);
					showSuccess('Contact updated');
				},
			)
			.on(
				'postgres_changes',
				{ event: 'DELETE', schema: 'public', table: 'contacts' },
				payload => {
					const deletedContact = payload.old as Contact;
					setContacts(prev =>
						prev.filter(
							contact => contact.id !== deletedContact.id,
						),
					);
					showSuccess('Contact deleted');
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, showError, showSuccess]);

	// Title selector component
	const TitleSelector = ({ contact }: { contact: Contact }) => {
		const titles = ['Mr', 'Mrs', 'Ms', 'Dr', ''];
		const [isOpen, setIsOpen] = useState(false);

		return (
			<div className="relative">
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
				>
					{contact.title || 'None'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4 ml-1"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
						/>
					</svg>
				</button>

				{isOpen && (
					<div className="absolute z-10 mt-1 w-24 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden">
						{titles.map(title => (
							<button
								key={title}
								className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
								onClick={() => {
									handleTitleUpdate(contact.id, title);
									setIsOpen(false);
								}}
							>
								{title || 'None'}
							</button>
						))}
					</div>
				)}
			</div>
		);
	};

	// Contact list tag component
	const ContactListTags = ({ contact }: { contact: Contact }) => {
		const lists = contact.contact_lists || [];

		if (lists.length === 0) {
			return <span className="text-gray-400">None</span>;
		}

		return (
			<div className="flex flex-wrap gap-1">
				{lists.map((list: { id: string; name: string }) => (
					<Link
						key={list.id}
						href={`/email/contact-lists/${list.id}`}
						className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
					>
						{list.name}
					</Link>
				))}
			</div>
		);
	};

	const contactColumns = [
		{
			key: 'name',
			actions: true,
			header: 'Name',
			render: (contact: Contact) => (
				<Link
					href={`/email/contacts/${contact.id}`}
					className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
				>
					{`${contact.first_name} ${contact.last_name}`}
				</Link>
			),
		},
		{
			key: 'email',
			header: 'Email',
			render: (contact: Contact) => (
				<span className="text-gray-600 dark:text-gray-300">
					{contact.email}
				</span>
			),
		},
		{
			key: 'client_name',
			header: 'Client',
			render: (contact: Contact) => (
				<span className="text-gray-600 dark:text-gray-300">
					{contact.client_name || 'Unknown Client'}
				</span>
			),
		},
		{
			key: 'title',
			header: 'Title',
			render: (contact: Contact) => <TitleSelector contact={contact} />,
		},
		{
			key: 'job_title',
			header: 'Job Title',
			render: (contact: Contact) => (
				<span className="text-gray-600 dark:text-gray-300">
					{contact.job_title}
				</span>
			),
		},
		{
			key: 'company',
			header: 'Company',
			render: (contact: Contact) => (
				<span className="text-gray-600 dark:text-gray-300">
					{contact.company}
				</span>
			),
		},
		{
			key: 'contact_lists',
			header: 'Contact Lists',
			render: (contact: Contact) => <ContactListTags contact={contact} />,
		},
		{
			key: 'updated_at',
			header: 'Last Updated',
			render: (contact: Contact) =>
				new Date(contact.updated_at).toLocaleDateString('en-CA'),
		},
	];

	const handleEdit = (contact: Contact) => {
		window.location.href = `/email/contacts/${contact.id}/edit`;
	};

	const handleDuplicate = async (contact: Contact) => {
		try {
			// Check if there are already copies of this contact's email
			const baseEmail = contact.email.replace(/\.copy(\d+)?@/, '@');
			const emailParts = baseEmail.split('@');
			const emailLocalPart = emailParts[0];
			const emailDomain = emailParts[1];

			const { data: existingCopies, error: searchError } = await supabase
				.from('contacts')
				.select('email')
				.like('email', `${emailLocalPart}.copy%@${emailDomain}`);

			if (searchError) {
				console.error(
					'Error searching for existing copies:',
					searchError,
				);
			}

			// Determine the new email with appropriate copy number
			let newEmail = `${emailLocalPart}.copy@${emailDomain}`;

			if (existingCopies && existingCopies.length > 0) {
				// Find highest existing copy number
				let highestCopyNum = 0;
				existingCopies.forEach(copy => {
					const match = copy.email.match(/\.copy(\d+)?@/);
					if (match) {
						const copyNum = match[1] ? parseInt(match[1]) : 1;
						if (copyNum > highestCopyNum) {
							highestCopyNum = copyNum;
						}
					}
				});

				// Increment for the new copy
				if (highestCopyNum > 0) {
					newEmail = `${emailLocalPart}.copy${highestCopyNum + 1}@${emailDomain}`;
				}
			}

			// Create a new contact object with only database fields
			const duplicatedContact = {
				client_id: contact.client_id,
				title: contact.title,
				first_name: contact.first_name,
				last_name: `${contact.last_name} (Copy)`,
				email: newEmail,
				company: contact.company,
				job_title: contact.job_title,
				website: contact.website,
				phone_number: contact.phone_number,
				instagram_handle: contact.instagram_handle,
			};

			const { error } = await supabase
				.from('contacts')
				.insert([duplicatedContact])
				.select()
				.single();

			if (error) throw error;

			// Let's manually fetch the latest data
			const { data, error: fetchError } = await supabase
				.from('contacts')
				.select('*')
				.order('updated_at', { ascending: false });

			if (!fetchError && data) {
				// Enhance with list membership count
				const enhancedContacts = await Promise.all(
					(data || []).map(async contact => {
						const { data: countData, error: countError } =
							await supabase
								.from('contact_list_contacts')
								.select('contact_list_id')
								.eq('contact_id', contact.id);

						if (countError) {
							console.error('Count error:', countError);
							return {
								...contact,
								list_count: 0,
							};
						}

						return {
							...contact,
							list_count: countData?.length || 0,
						};
					}),
				);

				setContacts(enhancedContacts);
			}

			showSuccess(
				`Contact "${contact.first_name} ${contact.last_name}" duplicated successfully`,
			);
		} catch (error: any) {
			console.error('Error duplicating contact:', error);
			showError(`Failed to duplicate contact: ${error.message}`);
		}
	};

	const handleDelete = async (contact: Contact) => {
		if ((contact.list_count || 0) > 0) {
			if (
				!window.confirm(
					`This contact is in ${contact.list_count} lists. Are you sure you want to delete "${contact.first_name} ${contact.last_name}"?`,
				)
			) {
				return;
			}
		} else if (
			!window.confirm(
				`Are you sure you want to delete "${contact.first_name} ${contact.last_name}"?`,
			)
		) {
			return;
		}

		try {
			// First, delete all contact list memberships
			const { error: membershipError } = await supabase
				.from('contact_list_contacts')
				.delete()
				.eq('contact_id', contact.id);

			if (membershipError) throw membershipError;

			// Then delete the contact
			const { error } = await supabase
				.from('contacts')
				.delete()
				.eq('id', contact.id);

			if (error) throw error;

			// Let's manually fetch the latest data
			const { data, error: fetchError } = await supabase
				.from('contacts')
				.select('*')
				.order('updated_at', { ascending: false });

			if (!fetchError && data) {
				// Enhance with list membership count
				const enhancedContacts = await Promise.all(
					(data || []).map(async contact => {
						const { data: countData, error: countError } =
							await supabase
								.from('contact_list_contacts')
								.select('contact_list_id')
								.eq('contact_id', contact.id);

						if (countError) {
							console.error('Count error:', countError);
							return {
								...contact,
								list_count: 0,
							};
						}

						return {
							...contact,
							list_count: countData?.length || 0,
						};
					}),
				);

				setContacts(enhancedContacts);
			}

			showSuccess(
				`Contact "${contact.first_name} ${contact.last_name}" deleted successfully`,
			);
		} catch (error: any) {
			console.error('Error deleting contact:', error);
			showError(`Failed to delete contact: ${error.message}`);
		}
	};

	return (
		<div className="p-4">
			<div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
					Contacts
				</h1>
				<div className="flex space-x-2">
					<Link
						href="/email/contacts/create"
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
					>
						<svg
							className="w-5 h-5 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							></path>
						</svg>
						New Contact
					</Link>
					<Link
						href="/email/contacts/import"
						className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
					>
						<svg
							className="w-5 h-5 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
							></path>
						</svg>
						Import
					</Link>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			) : (
				<PostTable<Contact>
					data={contacts}
					columns={contactColumns}
					onEdit={handleEdit}
					onDuplicate={handleDuplicate}
					onDelete={handleDelete}
				/>
			)}
		</div>
	);
}
