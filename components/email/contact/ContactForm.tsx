import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Contact } from '@/app/types/contacts';
import {
	FormField,
	Input,
	Select,
	PrimaryButton,
	SecondaryButton,
} from '@/components/ui/FormField';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ContactFormProps {
	contactId?: string;
	isEdit?: boolean;
}

export default function ContactForm({
	contactId,
	isEdit = false,
}: ContactFormProps) {
	const [contact, setContact] = useState<Partial<Contact>>({
		first_name: '',
		last_name: '',
		email: '',
		title: '',
		company: '',
		job_title: '',
		instagram_handle: '',
		website: '',
		phone_number: '',
	});
	const [clients, setClients] = useState<any[]>([]);
	const [contactLists, setContactLists] = useState<any[]>([]);
	const [selectedContactLists, setSelectedContactLists] = useState<string[]>(
		[],
	);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const titleOptions = [
		{ value: 'Mr', label: 'Mr' },
		{ value: 'Mrs', label: 'Mrs' },
		{ value: 'Ms', label: 'Ms' },
		{ value: 'Dr', label: 'Dr' },
		{ value: '', label: 'None' },
	];

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

		const fetchContactLists = async () => {
			try {
				const { data, error } = await supabase
					.from('contact_lists')
					.select('*');
				if (error) {
					showError(`Failed to load contact lists: ${error.message}`);
					console.error('Error fetching contact lists:', error);
				} else {
					setContactLists(data || []);
				}
			} catch (err) {
				console.error('Error fetching contact lists:', err);
			}
		};

		const fetchContact = async () => {
			if (!contactId || !isEdit) return;

			try {
				const { data, error } = await supabase
					.from('contacts')
					.select('*, contact_list_contacts(contact_list_id)')
					.eq('id', contactId)
					.single();

				if (error) {
					showError(`Failed to load contact: ${error.message}`);
					console.error('Error fetching contact:', error);
				} else {
					setContact(data);
					// Initialize selected contact lists from contact data
					if (data.contact_list_contacts) {
						setSelectedContactLists(
							data.contact_list_contacts.map(
								(item: any) => item.contact_list_id,
							),
						);
					}
				}
			} catch (err) {
				console.error('Unexpected error:', err);
				showError('An unexpected error occurred');
			}
		};

		Promise.all([
			fetchClients(),
			fetchContactLists(),
			fetchContact(),
		]).finally(() => setLoading(false));
	}, [contactId, isEdit, showError, supabase]);

	const handleInputChange = (field: string, value: any) => {
		setContact(prev => ({ ...prev, [field]: value }));
	};

	const handleContactListChange = (listId: string) => {
		setSelectedContactLists(prev => {
			if (prev.includes(listId)) {
				return prev.filter(id => id !== listId);
			} else {
				return [...prev, listId];
			}
		});
	};

	// Submit form
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (isEdit && contactId) {
				// Update existing contact
				const { error } = await supabase
					.from('contacts')
					.update({
						first_name: contact.first_name,
						last_name: contact.last_name,
						email: contact.email,
						client_id: contact.client_id,
						title: contact.title,
						company: contact.company,
						job_title: contact.job_title,
						instagram_handle: contact.instagram_handle,
						website: contact.website,
						phone_number: contact.phone_number,
						updated_at: new Date().toISOString(),
					})
					.eq('id', contactId);

				if (error) throw error;

				// Update contact lists relationships
				if (selectedContactLists.length > 0) {
					// Delete existing relationships
					await supabase
						.from('contact_list_contacts')
						.delete()
						.eq('contact_id', contactId);

					// Add new relationships
					const relationshipData = selectedContactLists.map(
						listId => ({
							contact_id: contactId,
							contact_list_id: listId,
						}),
					);

					const { error: relationshipError } = await supabase
						.from('contact_list_contacts')
						.insert(relationshipData);

					if (relationshipError) throw relationshipError;
				}

				showSuccess('Contact updated successfully');
				router.push(`/email/contacts/${contactId}`);
			} else {
				// Create new contact
				const { data, error } = await supabase
					.from('contacts')
					.insert({
						first_name: contact.first_name,
						last_name: contact.last_name,
						email: contact.email,
						client_id: contact.client_id,
						title: contact.title,
						company: contact.company,
						job_title: contact.job_title,
						instagram_handle: contact.instagram_handle,
						website: contact.website,
						phone_number: contact.phone_number,
					})
					.select()
					.single();

				if (error) throw error;

				// Add contact to selected lists
				if (selectedContactLists.length > 0) {
					const relationshipData = selectedContactLists.map(
						listId => ({
							contact_id: data.id,
							contact_list_id: listId,
						}),
					);

					const { error: relationshipError } = await supabase
						.from('contact_list_contacts')
						.insert(relationshipData);

					if (relationshipError) throw relationshipError;
				}

				showSuccess('Contact created successfully');
				router.push(`/email/contacts/${data.id}`);
			}
		} catch (error: any) {
			console.error(
				`Error ${isEdit ? 'updating' : 'creating'} contact:`,
				error,
			);
			showError(
				`Failed to ${isEdit ? 'update' : 'create'} contact: ${error.message}`,
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
						isEdit && contactId
							? `/email/contacts/${contactId}`
							: '/email/contacts'
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
					{isEdit ? 'Back to Contact' : 'Back to Contacts'}
				</Link>
			</div>

			<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
				<h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
					{isEdit ? 'Edit Contact' : 'Create New Contact'}
				</h1>

				<form onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						{/* Client */}
						<FormField label="Client">
							<Select
								value={contact.client_id || ''}
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

						{/* Title (Mr/Mrs/etc) */}
						<FormField label="Title">
							<Select
								value={contact.title || ''}
								onChange={e =>
									handleInputChange('title', e.target.value)
								}
								options={titleOptions}
								placeholder="Select Title"
							/>
						</FormField>

						{/* First Name */}
						<FormField label="First Name">
							<Input
								type="text"
								value={contact.first_name || ''}
								onChange={e =>
									handleInputChange(
										'first_name',
										e.target.value,
									)
								}
								required
							/>
						</FormField>

						{/* Last Name */}
						<FormField label="Last Name">
							<Input
								type="text"
								value={contact.last_name || ''}
								onChange={e =>
									handleInputChange(
										'last_name',
										e.target.value,
									)
								}
								required
							/>
						</FormField>

						{/* Email */}
						<FormField label="Email Address">
							<Input
								type="email"
								value={contact.email || ''}
								onChange={e =>
									handleInputChange('email', e.target.value)
								}
								required
							/>
						</FormField>

						{/* Company */}
						<FormField label="Company">
							<Input
								type="text"
								value={contact.company || ''}
								onChange={e =>
									handleInputChange('company', e.target.value)
								}
							/>
						</FormField>

						{/* Job Title */}
						<FormField label="Job Title">
							<Input
								type="text"
								value={contact.job_title || ''}
								onChange={e =>
									handleInputChange(
										'job_title',
										e.target.value,
									)
								}
							/>
						</FormField>

						{/* Instagram Handle */}
						<FormField label="Instagram Handle">
							<Input
								type="text"
								value={contact.instagram_handle || ''}
								onChange={e =>
									handleInputChange(
										'instagram_handle',
										e.target.value,
									)
								}
							/>
						</FormField>

						{/* Website */}
						<FormField label="Website">
							<Input
								type="url"
								value={contact.website || ''}
								onChange={e =>
									handleInputChange('website', e.target.value)
								}
							/>
						</FormField>

						{/* Phone Number */}
						<FormField label="Phone Number">
							<Input
								type="tel"
								value={contact.phone_number || ''}
								onChange={e =>
									handleInputChange(
										'phone_number',
										e.target.value,
									)
								}
							/>
						</FormField>
					</div>

					{/* Contact Lists */}
					<FormField label="Contact Lists">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
							{contactLists.map(list => (
								<div
									key={list.id}
									className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 p-3 rounded-md"
								>
									<input
										type="checkbox"
										id={`list-${list.id}`}
										checked={selectedContactLists.includes(
											list.id,
										)}
										onChange={() =>
											handleContactListChange(list.id)
										}
										className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
									/>
									<label
										htmlFor={`list-${list.id}`}
										className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
									>
										{list.name}
									</label>
								</div>
							))}
						</div>
					</FormField>

					{/* Form Buttons */}
					<div className="flex justify-end space-x-4 mt-6">
						<SecondaryButton
							type="button"
							onClick={() => router.push('/email/contacts')}
						>
							Cancel
						</SecondaryButton>
						<PrimaryButton type="submit" disabled={isSubmitting}>
							{isSubmitting
								? isEdit
									? 'Saving...'
									: 'Creating...'
								: isEdit
									? 'Save Contact'
									: 'Create Contact'}
						</PrimaryButton>
					</div>
				</form>
			</div>
		</div>
	);
}
