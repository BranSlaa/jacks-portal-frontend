import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Campaign } from '@/app/types/campaigns';
import { CAMPAIGN_STATUSES } from '@/app/constants';
import {
	FormField,
	Input,
	Select,
	PrimaryButton,
	SecondaryButton,
} from '@/components/ui/FormField';
import DayPicker from '@/components/ui/DayPicker';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CampaignFormProps {
	campaignId?: string;
	isEdit?: boolean;
}

export default function CampaignForm({
	campaignId,
	isEdit = false,
}: CampaignFormProps) {
	const [campaign, setCampaign] = useState<Partial<Campaign>>({
		name: '',
		status: 'draft',
		start_date: new Date().toISOString().split('T')[0],
		max_emails_per_day: 100,
		sent_today_count: 0,
		days_of_week: ['1', '2', '3', '4', '5'], // Monday to Friday
	});
	const [templates, setTemplates] = useState<any[]>([]);
	const [clients, setClients] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedDays, setSelectedDays] = useState<string[]>(
		campaign.days_of_week || ['1', '2', '3', '4', '5'],
	);
	const [contacts, setContacts] = useState<any[]>([]);
	const [maxContacts, setMaxContacts] = useState(0);
	const router = useRouter();
	const { showSuccess, showError } = useNotifications();
	const supabase = createClient();

	// Fetch required data
	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				const { data, error } = await supabase
					.from('templates')
					.select('*');
				if (error) {
					showError(`Failed to load templates: ${error.message}`);
					console.error('Error fetching templates:', error);
				} else {
					setTemplates(data || []);
				}
			} catch (err) {
				console.error('Error fetching templates:', err);
			}
		};

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

		const fetchCampaign = async () => {
			if (!campaignId || !isEdit) return;

			try {
				const { data, error } = await supabase
					.from('campaigns')
					.select('*')
					.eq('id', campaignId)
					.single();

				if (error) {
					showError(`Failed to load campaign: ${error.message}`);
					console.error('Error fetching campaign:', error);
				} else {
					setCampaign(data);
					// Initialize selected days from campaign data
					if (data.days_of_week) {
						setSelectedDays(data.days_of_week);
					}
				}
			} catch (err) {
				console.error('Unexpected error:', err);
				showError('An unexpected error occurred');
			}
		};

		const fetchContacts = async () => {
			if (!campaignId || !isEdit) return;

			try {
				// First fetch campaign_contacts junction table
				const { data: campaignContacts, error: campaignContactsError } =
					await supabase
						.from('campaign_contacts')
						.select('contact_id')
						.eq('campaign_id', campaignId);

				if (campaignContactsError) {
					throw campaignContactsError;
				}

				if (campaignContacts?.length) {
					// Get the contact IDs
					const contactIds = campaignContacts.map(
						cc => cc.contact_id,
					);

					// Fetch the actual contacts
					const { data: contactsData, error: contactsError } =
						await supabase
							.from('contacts')
							.select('*')
							.in('id', contactIds);

					if (contactsError) {
						throw contactsError;
					}

					// Set contacts data
					setContacts(contactsData || []);
					setMaxContacts(contactsData?.length || 0);
				} else {
					setContacts([]);
				}
			} catch (err) {
				console.error('Error fetching contacts:', err);
				showError('Failed to load campaign contacts');
			}
		};

		Promise.all([
			fetchTemplates(),
			fetchClients(),
			fetchCampaign(),
			fetchContacts(),
		]).finally(() => {
			setLoading(false);
		});
	}, [campaignId, isEdit, showError, supabase]);

	// Handle form input changes
	const handleInputChange = (field: string, value: any) => {
		setCampaign(prev => ({
			...prev,
			[field]: value,
		}));
	};

	// Handle day of week change
	const handleDaysChange = (days: string[]) => {
		setSelectedDays(days);
	};

	// Submit form
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (isEdit && campaignId) {
				// Update existing campaign
				const { error } = await supabase
					.from('campaigns')
					.update({
						name: campaign.name,
						status: campaign.status,
						template_id: campaign.template_id,
						client_id: campaign.client_id,
						start_date: campaign.start_date,
						max_emails_per_day: campaign.max_emails_per_day,
						days_of_week: selectedDays,
						sent_today_count: campaign.sent_today_count,
						completed_at: campaign.completed_at,
						updated_at: new Date().toISOString(),
					})
					.eq('id', campaignId);

				if (error) throw error;

				showSuccess('Campaign updated successfully');
				router.push(`/email/campaigns/${campaignId}`);
			} else {
				// Create new campaign
				const { data, error } = await supabase
					.from('campaigns')
					.insert({
						name: campaign.name,
						status: campaign.status,
						template_id: campaign.template_id,
						client_id: campaign.client_id,
						start_date: campaign.start_date,
						max_emails_per_day: campaign.max_emails_per_day,
						days_of_week: selectedDays,
						sent_today_count: 0,
					})
					.select()
					.single();

				if (error) throw error;

				showSuccess('Campaign created successfully');
				router.push(`/email/campaigns/${data.id}`);
			}
		} catch (error: any) {
			console.error(
				`Error ${isEdit ? 'updating' : 'creating'} campaign:`,
				error,
			);
			showError(
				`Failed to ${isEdit ? 'update' : 'create'} campaign: ${error.message}`,
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Reset daily counter
	const handleResetCounter = async () => {
		if (!campaignId || !isEdit) return;

		try {
			const { error } = await supabase
				.from('campaigns')
				.update({
					sent_today_count: 0,
				})
				.eq('id', campaignId);

			if (error) throw error;

			setCampaign(prev => ({
				...prev,
				sent_today_count: 0,
			}));

			showSuccess('Daily counter reset successfully');
		} catch (error: any) {
			console.error('Error resetting counter:', error);
			showError(`Failed to reset counter: ${error.message}`);
		}
	};

	// Remove contact from campaign
	const handleContactRemove = async (contact: any) => {
		if (!campaignId || !isEdit) return;

		try {
			const { error } = await supabase
				.from('campaign_contacts')
				.delete()
				.match({
					campaign_id: campaignId,
					contact_id: contact.id,
				});

			if (error) throw error;

			// Remove contact from local state
			setContacts(prev => prev.filter(c => c.id !== contact.id));
			showSuccess(`Contact ${contact.email} removed from campaign`);
		} catch (error: any) {
			console.error('Error removing contact:', error);
			showError(`Failed to remove contact: ${error.message}`);
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="">
			<div className="mb-6">
				<Link
					href={
						isEdit && campaignId
							? `/email/campaigns/${campaignId}`
							: '/email/campaigns'
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
					{isEdit ? 'Back to Campaign' : 'Back to Campaigns'}
				</Link>
			</div>

			<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
				<h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
					{isEdit ? 'Edit Campaign' : 'Create New Campaign'}
				</h1>

				<form onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						{/* Campaign Name */}
						<FormField label="Campaign Name">
							<Input
								type="text"
								value={campaign.name || ''}
								onChange={e =>
									handleInputChange('name', e.target.value)
								}
								required
							/>
						</FormField>

						{/* Status */}
						<FormField label="Status">
							<Select
								value={campaign.status || 'draft'}
								onChange={e =>
									handleInputChange('status', e.target.value)
								}
								options={CAMPAIGN_STATUSES}
							/>
						</FormField>

						{/* Client */}
						<FormField label="Client">
							<Select
								value={campaign.client_id || ''}
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

						{/* Template */}
						<FormField label="Email Template">
							<Select
								value={campaign.template_id || ''}
								onChange={e =>
									handleInputChange(
										'template_id',
										e.target.value,
									)
								}
								options={templates.map(template => ({
									value: template.id,
									label: template.name,
								}))}
								placeholder="Select Template"
								required
							/>
						</FormField>

						{/* Start Date */}
						<FormField label="Start Date">
							<Input
								type="date"
								value={
									campaign.start_date
										? campaign.start_date.split('T')[0]
										: ''
								}
								onChange={e =>
									handleInputChange(
										'start_date',
										e.target.value,
									)
								}
							/>
						</FormField>

						{/* Max Emails Per Day */}
						<FormField label="Max Emails Per Day">
							<Input
								type="number"
								min="1"
								value={campaign.max_emails_per_day || 100}
								onChange={e =>
									handleInputChange(
										'max_emails_per_day',
										parseInt(e.target.value),
									)
								}
							/>
						</FormField>
					</div>

					{/* Days of Week */}
					<FormField label="Days to Send">
						<DayPicker
							selectedDays={selectedDays}
							onChange={handleDaysChange}
						/>
					</FormField>

					{/* Display contacts section if editing */}
					{isEdit && campaignId && (
						<div className="mt-8 mb-6">
							<h2 className="text-xl font-semibold mb-4">
								Campaign Contacts
							</h2>

							{contacts.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
										<thead className="bg-gray-50 dark:bg-gray-700">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
													Name
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
													Email
												</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
													Actions
												</th>
											</tr>
										</thead>
										<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
											{contacts.map(contact => (
												<tr key={contact.id}>
													<td className="px-6 py-4 whitespace-nowrap">
														{contact.first_name}{' '}
														{contact.last_name}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{contact.email}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
														<button
															type="button"
															onClick={() =>
																handleContactRemove(
																	contact,
																)
															}
															className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
														>
															Remove
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="text-center py-4 text-gray-500 dark:text-gray-400">
									No contacts added to this campaign yet.
								</div>
							)}

							<div className="mt-4 flex items-center justify-between">
								<PrimaryButton
									type="button"
									onClick={() => {
										// This should open a modal for adding contacts
										alert('This feature is coming soon!');
									}}
								>
									Add Contacts
								</PrimaryButton>

								<div className="flex items-center">
									<div className="text-lg flex items-center">
										<p className="mr-2">Sent Today:</p>
										<p className="font-bold">
											{campaign.sent_today_count || 0} /{' '}
											{Math.min(
												campaign.max_emails_per_day ||
													100,
												maxContacts,
											)}
										</p>
									</div>
									<button
										type="button"
										onClick={handleResetCounter}
										className="ml-4 bg-red-600 opacity-50 hover:bg-red-700 hover:opacity-100 text-white px-4 py-2 rounded-md transition-colors"
									>
										Reset Counter
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Form Buttons */}
					<div className="flex justify-end space-x-4 mt-6">
						<SecondaryButton
							type="button"
							onClick={() => router.push('/email/campaigns')}
						>
							Cancel
						</SecondaryButton>
						<PrimaryButton type="submit" disabled={isSubmitting}>
							{isSubmitting
								? isEdit
									? 'Saving...'
									: 'Creating...'
								: isEdit
									? 'Save Campaign'
									: 'Create Campaign'}
						</PrimaryButton>
					</div>
				</form>
			</div>
		</div>
	);
}
