'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { EmailEvent, EmailEventStats } from '@/app/types/email';

export default function EmailEventsList({
	campaignId,
}: {
	campaignId: string;
}) {
	const [events, setEvents] = useState<EmailEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<EmailEventStats>({
		opens: 0,
		clicks: 0,
		uniqueOpens: 0,
		uniqueClicks: 0,
		openRate: 0,
		clickRate: 0,
		totalSent: 0,
	});

	const supabase = createClient();
	const { showError } = useNotifications();

	useEffect(() => {
		const fetchEvents = async () => {
			setLoading(true);
			try {
				const { data: sentEmails, error: sentError } = await supabase
					.from('sent_emails')
					.select('id, contact_id, status')
					.eq('campaign_id', campaignId)
					.eq('status', 'delivered');

				if (sentError) {
					showError(
						`Failed to load sent emails: ${sentError.message}`,
					);
					return;
				}

				if (!sentEmails?.length) {
					setEvents([]);
					setLoading(false);
					return;
				}

				const sentEmailIds = sentEmails.map(se => se.id);
				const contactIds = sentEmails.map(se => se.contact_id);

				// Get contacts info
				const { data: contacts, error: contactsError } = await supabase
					.from('contacts')
					.select('id, email, first_name, last_name')
					.in('id', contactIds);

				if (contactsError) {
					showError(
						`Failed to load contacts: ${contactsError.message}`,
					);
				}

				// Get events
				const { data: eventsData, error: eventsError } = await supabase
					.from('email_events')
					.select('*')
					.in('sent_email_id', sentEmailIds)
					.order('event_timestamp', { ascending: false });

				if (eventsError) {
					showError(
						`Failed to load email events: ${eventsError.message}`,
					);
					return;
				}

				// Process events with contact info
				const processedEvents = eventsData.map(event => {
					const sentEmail = sentEmails.find(
						se => se.id === event.sent_email_id,
					);
					const contact = contacts?.find(
						c => c.id === sentEmail?.contact_id,
					);

					return {
						...event,
						contact_email: contact?.email || 'Unknown',
						contact_name: contact
							? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
							: 'Unknown',
					};
				});

				setEvents(processedEvents);

				// Calculate stats
				const totalSent = sentEmails.length;
				const opens = processedEvents.filter(
					e => e.event_type === 'open',
				).length;
				const clicks = processedEvents.filter(
					e => e.event_type === 'click',
				).length;
				const uniqueOpens = new Set(
					processedEvents
						.filter(e => e.event_type === 'open')
						.map(e => e.sent_email_id),
				).size;
				const uniqueClicks = new Set(
					processedEvents
						.filter(e => e.event_type === 'click')
						.map(e => e.sent_email_id),
				).size;

				setStats({
					opens,
					clicks,
					uniqueOpens,
					uniqueClicks,
					openRate: totalSent
						? Math.round((uniqueOpens / totalSent) * 100)
						: 0,
					clickRate: totalSent
						? Math.round((uniqueClicks / totalSent) * 100)
						: 0,
					totalSent,
				});
			} catch (err) {
				console.error('Unexpected error:', err);
				showError('Failed to load email events');
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();

		// Set up real-time subscription
		const channel = supabase
			.channel(`campaign-events-${campaignId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'email_events',
				},
				payload => {
					console.log('New email event:', payload);
					fetchEvents(); // Refresh the data
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

	if (!events.length) {
		return (
			<div className="text-center py-8 text-gray-500 dark:text-gray-400">
				No email events recorded for this campaign yet.
			</div>
		);
	}

	return (
		<div>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-blue-600 dark:text-blue-400">
						Total Sent
					</p>
					<p className="text-xl font-semibold">{stats.totalSent}</p>
				</div>
				<div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-green-600 dark:text-green-400">
						Open Rate
					</p>
					<p className="text-xl font-semibold">{stats.openRate}%</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						{stats.uniqueOpens} unique opens
					</p>
				</div>
				<div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-purple-600 dark:text-purple-400">
						Click Rate
					</p>
					<p className="text-xl font-semibold">{stats.clickRate}%</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						{stats.uniqueClicks} unique clicks
					</p>
				</div>
				<div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
					<p className="text-sm text-yellow-600 dark:text-yellow-400">
						Total Events
					</p>
					<p className="text-xl font-semibold">{events.length}</p>
				</div>
			</div>

			<h3 className="text-lg font-medium mb-3">Recent Events</h3>
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead className="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Event
							</th>
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
								Time
							</th>
							<th
								scope="col"
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
							>
								Details
							</th>
						</tr>
					</thead>
					<tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
						{events.slice(0, 20).map(event => (
							<tr
								key={event.id}
								className="hover:bg-gray-50 dark:hover:bg-gray-800"
							>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${
											event.event_type === 'open'
												? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
												: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
										}`}
									>
										{event.event_type === 'open'
											? 'Opened'
											: 'Clicked'}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm font-medium text-gray-900 dark:text-white">
										{event.contact_name}
									</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{event.contact_email}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{new Date(
											event.event_timestamp,
										).toLocaleDateString('en-CA', {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									{event.clicked_url && (
										<div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
											<a
												href={event.clicked_url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 dark:text-blue-400 hover:underline"
											>
												{event.clicked_url}
											</a>
										</div>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
