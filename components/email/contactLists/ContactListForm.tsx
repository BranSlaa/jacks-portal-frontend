import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { ContactList } from '@/app/types/contactLists';
import {
	FormField,
	Input,
	Select,
	PrimaryButton,
	SecondaryButton,
} from '@/components/ui/FormField';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ContactListFormProps {
	contactListId?: string;
	isEdit?: boolean;
}

export default function ContactListForm({
	contactListId,
	isEdit = false,
}: ContactListFormProps) {
	const [contactList, setContactList] = useState<Partial<ContactList>>({
		name: '',
		description: '',
		tags: {},
	});
	const [clients, setClients] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [tagInput, setTagInput] = useState<string>('');
	const [tags, setTags] = useState<string[]>([]);

	const router = useRouter();
	const { showSuccess, showError } = useNotifications();
	const supabase = createClient();

	// Fetch required data
	useEffect(() => {
		const fetchClients = async () => {
			try {
				const { data, error } = await supabase
					.from('clients')
					.select('*');
				if (error) {
					showError(`Failed to load clients: ${error.message}`);
					console.error('Error fetching clients:', error);
				} else {
					setClients(data || []);
				}
			} catch (err) {
				console.error('Error fetching clients:', err);
			}
		};

		const fetchContactList = async () => {
			if (!contactListId || !isEdit) return;

			try {
				const { data, error } = await supabase
					.from('contact_lists')
					.select('*')
					.eq('id', contactListId)
					.single();

				if (error) {
					showError(`Failed to load contact list: ${error.message}`);
					console.error('Error fetching contact list:', error);
				} else {
					setContactList(data);

					// Initialize tags from JSON if they exist
					if (data.tags && typeof data.tags === 'object') {
						setTags(Object.keys(data.tags));
					}
				}
			} catch (err) {
				console.error('Unexpected error:', err);
				showError('An unexpected error occurred');
			}
		};

		Promise.all([fetchClients(), fetchContactList()]).finally(() =>
			setLoading(false),
		);
	}, [contactListId, isEdit, showError, supabase]);

	const handleInputChange = (field: string, value: any) => {
		setContactList(prev => ({ ...prev, [field]: value }));
	};

	const addTag = () => {
		if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
			setTags([...tags, tagInput.trim()]);
			setTagInput('');
		}
	};

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter(tag => tag !== tagToRemove));
	};

	// Convert tags array to object for storage
	const prepareTags = () => {
		const tagsObject: Record<string, boolean> = {};
		tags.forEach(tag => {
			tagsObject[tag] = true;
		});
		return tagsObject;
	};

	// Submit form
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Prepare the contact list data with tags as JSON object
			const listData = {
				...contactList,
				tags: prepareTags(),
			};

			if (isEdit && contactListId) {
				// Update existing contact list
				const { error } = await supabase
					.from('contact_lists')
					.update({
						name: listData.name,
						description: listData.description,
						client_id: listData.client_id,
						tags: listData.tags,
						updated_at: new Date().toISOString(),
					})
					.eq('id', contactListId);

				if (error) throw error;

				showSuccess('Contact list updated successfully');
				router.push(`/email/contact-lists/${contactListId}`);
			} else {
				// Create new contact list
				const { data, error } = await supabase
					.from('contact_lists')
					.insert({
						name: listData.name,
						description: listData.description,
						client_id: listData.client_id,
						tags: listData.tags,
					})
					.select()
					.single();

				if (error) throw error;

				showSuccess('Contact list created successfully');
				router.push(`/email/contact-lists/${data.id}`);
			}
		} catch (error: any) {
			console.error(
				`Error ${isEdit ? 'updating' : 'creating'} contact list:`,
				error,
			);
			showError(
				`Failed to ${isEdit ? 'update' : 'create'} contact list: ${error.message}`,
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<LoadingSpinner />
			</div>
		);
	}

	return (
		<div className="">
			<div className="mb-6">
				<Link
					href={
						isEdit && contactListId
							? `/email/contact-lists/${contactListId}`
							: '/email/contact-lists'
					}
					className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
				>
					<svg
						className="w-4 h-4 mr-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						></path>
					</svg>
					{isEdit ? 'Back to Contact List' : 'Back to Contact Lists'}
				</Link>
			</div>

			<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
				<h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
					{isEdit ? 'Edit Contact List' : 'Create New Contact List'}
				</h1>

				<form onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						{/* Client */}
						<FormField label="Client">
							<Select
								value={contactList.client_id || ''}
								onChange={e =>
									handleInputChange(
										'client_id',
										e.target.value,
									)
								}
								options={clients.map(client => ({
									value: client.id,
									label: client.name,
								}))}
								placeholder="Select Client"
								required
							/>
						</FormField>

						{/* Name */}
						<FormField label="List Name">
							<Input
								type="text"
								value={contactList.name || ''}
								onChange={e =>
									handleInputChange('name', e.target.value)
								}
								required
							/>
						</FormField>

						{/* Description */}
						<div className="md:col-span-2">
							<FormField label="Description">
								<textarea
									value={contactList.description || ''}
									onChange={e =>
										handleInputChange(
											'description',
											e.target.value,
										)
									}
									rows={3}
									className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
								/>
							</FormField>
						</div>

						{/* Tags */}
						<div className="md:col-span-2">
							<FormField label="Tags">
								<div className="flex flex-wrap gap-2 mb-2">
									{tags.map(tag => (
										<div
											key={tag}
											className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center"
										>
											{tag}
											<button
												type="button"
												className="ml-1 text-blue-600 hover:text-blue-800"
												onClick={() => removeTag(tag)}
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M6 18L18 6M6 6l12 12"
													></path>
												</svg>
											</button>
										</div>
									))}
								</div>
								<div className="flex">
									<Input
										type="text"
										value={tagInput}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>,
										) => setTagInput(e.target.value)}
										placeholder="Add a tag"
										className="mr-2"
									/>
									<button
										type="button"
										onClick={addTag}
										className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
									>
										Add
									</button>
								</div>
							</FormField>
						</div>
					</div>

					{/* Form Buttons */}
					<div className="flex justify-end space-x-4 mt-6">
						<SecondaryButton
							type="button"
							onClick={() => router.push('/email/contact-lists')}
						>
							Cancel
						</SecondaryButton>
						<PrimaryButton type="submit" disabled={isSubmitting}>
							{isSubmitting
								? isEdit
									? 'Saving...'
									: 'Creating...'
								: isEdit
									? 'Save Contact List'
									: 'Create Contact List'}
						</PrimaryButton>
					</div>
				</form>
			</div>
		</div>
	);
}
