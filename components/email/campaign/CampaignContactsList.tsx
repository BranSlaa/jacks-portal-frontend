'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { ContactStatus, ContactStats } from '@/app/types/email';

// Add interfaces for our database results
interface ContactData {
	id: string;
	first_name: string | null;
	last_name: string | null;
	email: string;
}

interface CampaignContact {
	campaign_id: string;
	processing_status: string;
	contact_id: string;
	contacts: ContactData;
}

interface SentEmail {
	id: number;
	contact_id: string;
	status: string;
	sent_at?: string;
	delivered_at?: string;
	bounced_at?: string;
}

export default function CampaignContactsList({
	campaignId,
}: {
	campaignId: string;
}) {
	const [contacts, setContacts] = useState<ContactStatus[]>([]);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<ContactStats>({
		total: 0,
		pending: 0,
		processing: 0,
		delivered: 0,
		failed: 0,
		excluded: 0,
	});
	const supabase = createClient();
	const { showError } = useNotifications();

	useEffect(() => {
		const fetchContacts = async () => {
			setLoading(true);
			try {
				// First, get the campaign contacts with their contact info
				const { data: campaignContacts, error: contactsError } =
					await supabase
						.from('campaign_contacts')
						.select(
							`
                        campaign_id,
                        contact_id,
                        contacts:contact_id (
                            id, 
                            first_name, 
                            last_name, 
                            email
                        )
                    `,
						)
						.eq('campaign_id', campaignId);

				if (contactsError) {
					showError(
						`Failed to load contacts: ${contactsError.message}`,
					);
					console.error('Error fetching contacts:', contactsError);
					setLoading(false);
					return;
				}

				if (!campaignContacts || campaignContacts.length === 0) {
					setContacts([]);
					setLoading(false);
					return;
				}

				// Then, get the sent emails for this campaign
				const { data: sentEmails, error: emailsError } = await supabase
					.from('sent_emails')
					.select(
						'id, contact_id, status, sent_at, delivered_at, bounced_at',
					)
					.eq('campaign_id', campaignId);

				if (emailsError) {
					showError(
						`Failed to load sent emails: ${emailsError.message}`,
					);
					console.error('Error fetching sent emails:', emailsError);
				}

				// Process and combine the data
				const processedContacts = campaignContacts.map((item: any) => {
					// The contacts field might be an array or an object depending on how Supabase returns it
					const contact =
						typeof item.contacts === 'object' &&
						!Array.isArray(item.contacts)
							? item.contacts
							: {
									id: '',
									first_name: '',
									last_name: '',
									email: '',
								};

					// Find matching sent email for this contact if any
					const sentEmail = sentEmails?.find(
						(email: any) => email.contact_id === item.contact_id,
					);

					// Determine processing status based on sent email status
					let processingStatus = 'pending';
					if (sentEmail) {
						switch (sentEmail.status) {
							case 'delivered':
								processingStatus = 'delivered';
								break;
							case 'sent':
							case 'processing':
								processingStatus = 'processing';
								break;
							case 'failed':
							case 'bounced':
								processingStatus = 'failed';
								break;
							default:
								processingStatus = 'pending';
						}
					}

					return {
						id: contact.id || '',
						email: contact.email || '',
						first_name: contact.first_name || '',
						last_name: contact.last_name || '',
						processing_status: processingStatus,
						sent_at: sentEmail?.sent_at,
						delivered_at: sentEmail?.delivered_at,
						bounced_at: sentEmail?.bounced_at,
						status: sentEmail?.status || 'Not sent',
					};
				});

				setContacts(processedContacts);

				// Calculate stats based on sent email status instead of processing_status
				const totalContacts = processedContacts.length;
				const deliveredEmails = processedContacts.filter(
					c => c.status === 'delivered',
				).length;
				const failedEmails = processedContacts.filter(
					c => c.status === 'failed' || c.status === 'bounced',
				).length;
				const processingEmails = processedContacts.filter(
					c => c.status === 'processing' || c.status === 'sent',
				).length;
				const pendingEmails =
					totalContacts -
					deliveredEmails -
					failedEmails -
					processingEmails;

				const newStats = {
					total: totalContacts,
					pending: pendingEmails,
					processing: processingEmails,
					delivered: deliveredEmails,
					failed: failedEmails,
					excluded: 0, // We no longer track excluded contacts
				};

				setStats(newStats);
			} catch (err) {
				console.error('Unexpected error:', err);
				showError('Failed to load campaign contacts');
			} finally {
				setLoading(false);
			}
		};

		fetchContacts();

		// Set up real-time subscription
		const channel = supabase
			.channel(`campaign-contacts-${campaignId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'campaign_contacts',
					filter: `campaign_id=eq.${campaignId}`,
				},
				payload => {
					console.log('Contact update:', payload);
					fetchContacts(); // Refresh the data
				},
			)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'sent_emails',
					filter: `campaign_id=eq.${campaignId}`,
				},
				payload => {
					console.log('Sent email update:', payload);
					fetchContacts(); // Refresh the data
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [campaignId, supabase, showError]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-40">
				<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (!contacts.length) {
		return (
			<div className="text-center py-8 text-gray-500 dark:text-gray-400">
				No contacts found for this campaign.
			</div>
		);
	}

	return (
		<div>
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
				<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-blue-600 dark:text-blue-400">
						Total
					</p>
					<p className="text-xl font-semibold">{stats.total}</p>
				</div>
				<div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-yellow-600 dark:text-yellow-400">
						Pending
					</p>
					<p className="text-xl font-semibold">{stats.pending}</p>
				</div>
				<div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-purple-600 dark:text-purple-400">
						Processing
					</p>
					<p className="text-xl font-semibold">{stats.processing}</p>
				</div>
				<div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-green-600 dark:text-green-400">
						Delivered
					</p>
					<p className="text-xl font-semibold">{stats.delivered}</p>
				</div>
				<div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-red-600 dark:text-red-400">
						Failed
					</p>
					<p className="text-xl font-semibold">{stats.failed}</p>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Contact
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Email
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Status
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Last Updated
							</th>
						</tr>
					</thead>
					<tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
						{contacts.map(contact => (
							<tr
								key={contact.id}
								className="hover:bg-gray-50 dark:hover:bg-gray-800"
							>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm font-medium text-gray-900 dark:text-white">
										{contact.first_name} {contact.last_name}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{contact.email}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${
											contact.status === 'delivered'
												? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
												: contact.status ===
															'bounced' ||
													  contact.status ===
															'failed'
													? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
													: contact.processing_status ===
														  'processing'
														? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
														: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
										}`}
									>
										{contact.status !== 'Not sent'
											? contact.status
											: contact.processing_status}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{contact.delivered_at
											? new Date(
													contact.delivered_at,
												).toLocaleDateString('en-CA', {
													year: 'numeric',
													month: 'short',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit',
												})
											: contact.sent_at
												? new Date(
														contact.sent_at,
													).toLocaleDateString(
														'en-CA',
														{
															year: 'numeric',
															month: 'short',
															day: 'numeric',
															hour: '2-digit',
															minute: '2-digit',
														},
													)
												: 'Not sent yet'}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
