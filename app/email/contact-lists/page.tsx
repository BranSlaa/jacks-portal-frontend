'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PostTable from '@/components/PostTable';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { ContactList } from '@/app/types/contactLists';
import EmailPageLayout from '@/components/layout/EmailPageLayout';

export default function ContactListPage() {
	const [contactLists, setContactLists] = useState<ContactList[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();
	const { showError, showSuccess } = useNotifications();

	useEffect(() => {
		const fetchContactLists = async () => {
			setLoading(true);
			try {
				// Get the contact lists
				const { data, error } = await supabase
					.from('contact_lists')
					.select('*')
					.order('updated_at', { ascending: false });

				if (error) throw error;

				// Enhance with contact count information
				const enhancedLists = await Promise.all(
					(data || []).map(async list => {
						// Use a more stable count query approach
						const { data: countData, error: countError } =
							await supabase
								.from('contact_list_contacts')
								.select('contact_id')
								.eq('contact_list_id', list.id);

						if (countError) {
							console.error('Count error:', countError);
							return {
								...list,
								contact_count: 0,
							};
						}

						return {
							...list,
							contact_count: countData?.length || 0,
						};
					}),
				);

				setContactLists(enhancedLists);
			} catch (error: any) {
				console.error('Error fetching contact lists:', error);
				showError(`Failed to load contact lists: ${error.message}`);
			} finally {
				setLoading(false);
			}
		};

		fetchContactLists();

		const channel = supabase
			.channel('contact-lists-changes')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'contact_lists' },
				payload => {
					const newList = payload.new as ContactList;
					setContactLists(prev => [
						...prev,
						{ ...newList, contact_count: 0 },
					]);
					showSuccess('New contact list added');
				},
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'contact_lists' },
				payload => {
					const updatedList = payload.new as ContactList;
					setContactLists(prev =>
						prev.map(list => {
							if (list.id === updatedList.id) {
								return {
									...updatedList,
								};
							}
							return list;
						}),
					);
					showSuccess('Contact list updated');
				},
			)
			.on(
				'postgres_changes',
				{ event: 'DELETE', schema: 'public', table: 'contact_lists' },
				payload => {
					const deletedList = payload.old as ContactList;
					setContactLists(prev =>
						prev.filter(list => list.id !== deletedList.id),
					);
					showSuccess('Contact list deleted');
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, showError, showSuccess]);

	const contactListColumns = [
		{
			key: 'name',
			actions: true,
			header: 'List Name',
			render: (list: ContactList) => (
				<Link
					href={`/email/contact-lists/${list.id}`}
					className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
				>
					{list.name}
				</Link>
			),
		},
		{
			key: 'description',
			header: 'Description',
			render: (list: ContactList) => (
				<span className="truncate block max-w-xs">
					{list.description}
				</span>
			),
		},
		{
			key: 'contact_count',
			header: '# Contacts',
			render: (list: ContactList) => (
				<span className="font-medium">{list.contact_count || 0}</span>
			),
		},
		{
			key: 'updated_at',
			header: 'Last Updated',
			render: (list: ContactList) =>
				new Date(list.updated_at).toLocaleDateString('en-CA'),
		},
	];

	const handleEdit = (list: ContactList) => {
		window.location.href = `/email/contact-lists/${list.id}/edit`;
	};

	const handleDuplicate = async (list: ContactList) => {
		try {
			const baseName = list.name.replace(/ \(Copy( \d+)?\)$/, '');
			const { data: existingCopies, error: searchError } = await supabase
				.from('contact_lists')
				.select('name')
				.like('name', `${baseName} (Copy%)`);

			if (searchError) {
				console.error(
					'Error searching for existing copies:',
					searchError,
				);
			}

			let newName = `${baseName} (Copy)`;

			if (existingCopies && existingCopies.length > 0) {
				let highestCopyNum = 0;
				existingCopies.forEach(copy => {
					const match = copy.name.match(/\(Copy( (\d+))?\)$/);
					if (match) {
						const copyNum = match[2] ? parseInt(match[2]) : 1;
						if (copyNum > highestCopyNum) {
							highestCopyNum = copyNum;
						}
					}
				});

				if (highestCopyNum > 0) {
					newName = `${baseName} (Copy ${highestCopyNum + 1})`;
				}
			}

			const duplicatedList = {
				client_id: list.client_id,
				name: newName,
				description: list.description,
				tags: list.tags,
			};

			// Insert the new list
			const { error } = await supabase
				.from('contact_lists')
				.insert([duplicatedList]);

			if (error) throw error;

			// Fetch the most recently added list
			const { data: contactListsData, error: contactListsError } =
				await supabase
					.from('contact_lists')
					.select('*')
					.order('created_at', { ascending: false })
					.limit(1);

			if (contactListsError) throw contactListsError;

			if (contactListsData && contactListsData.length > 0) {
				const newList = {
					...contactListsData[0],
					contact_count: 0,
				};
				setContactLists(prev => [newList, ...prev]);
			}

			showSuccess(`Contact list "${list.name}" duplicated successfully`);
		} catch (error: any) {
			console.error('Error duplicating contact list:', error);
			showError(`Failed to duplicate contact list: ${error.message}`);
		}
	};

	const handleDelete = async (list: ContactList) => {
		if ((list.contact_count || 0) > 0) {
			if (
				!window.confirm(
					`This list contains ${list.contact_count} contacts. Are you sure you want to delete "${list.name}"?`,
				)
			) {
				return;
			}
		} else if (
			!window.confirm(`Are you sure you want to delete "${list.name}"?`)
		) {
			return;
		}

		try {
			const { error: membershipError } = await supabase
				.from('contact_list_contacts')
				.delete()
				.eq('contact_list_id', list.id);

			if (membershipError) throw membershipError;

			const { error } = await supabase
				.from('contact_lists')
				.delete()
				.eq('id', list.id);

			if (error) throw error;

			// Remove the list from state
			setContactLists(prev => prev.filter(item => item.id !== list.id));

			showSuccess(`Contact list "${list.name}" deleted successfully`);
		} catch (error: any) {
			console.error('Error deleting contact list:', error);
			showError(`Failed to delete contact list: ${error.message}`);
		}
	};

	const importButton = (
		<Link
			href="/email/contact-lists/import"
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
	);

	return (
		<EmailPageLayout
			title="Contact Lists"
			createLink="/email/contact-lists/new"
			createButtonText="New List"
			breadcrumbItems={[
				{ label: 'Email', href: '/email' },
				{ label: 'Contact Lists' },
			]}
			additionalActions={importButton}
		>
			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			) : (
				<PostTable<ContactList>
					data={contactLists}
					columns={contactListColumns}
					onEdit={handleEdit}
					onDuplicate={handleDuplicate}
					onDelete={handleDelete}
				/>
			)}
		</EmailPageLayout>
	);
}
