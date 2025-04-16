'use client';

import { createClient } from '@/utils/supabase/client';
import { Campaign } from '@/app/types/campaigns';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import React from 'react';
import { useParams } from 'next/navigation';
import CampaignContactsList from '@/components/email/campaign/CampaignContactsList';
import EmailEventsList from '@/components/email/EmailEventsList';

export default function CampaignDetailedPage() {
	// Get campaign ID from URL params
	const params = useParams();
	const id = params?.id as string;
	const [campaign, setCampaign] = useState<Campaign | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [clientName, setClientName] = useState<string>('');
	const [templateName, setTemplateName] = useState<string>('');
	const [progress, setProgress] = useState<{ sent: number; total: number }>({
		sent: 0,
		total: 0,
	});
	const [activeTab, setActiveTab] = useState<'contacts' | 'analytics'>(
		'contacts',
	);
	const supabase = createClient();

	useEffect(() => {
		if (!id) return;

		const fetchCampaign = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from('campaigns')
					.select('*')
					.eq('id', id)
					.single();

				if (error) {
					setError(error.message);
					console.error('Error fetching campaign:', error);
					setLoading(false);
					return;
				}

				setCampaign(data);

				if (data.client_id) {
					const { data: clientData, error: clientError } =
						await supabase
							.from('clients')
							.select('name')
							.eq('id', data.client_id)
							.single();

					if (clientError) {
						console.error('Error fetching client:', clientError);
					} else if (clientData) {
						setClientName(clientData.name);
					}
				}

				if (data.template_id) {
					const { data: templateData, error: templateError } =
						await supabase
							.from('templates')
							.select('name')
							.eq('id', data.template_id)
							.single();

					if (templateError) {
						console.error(
							'Error fetching template:',
							templateError,
						);
					} else if (templateData) {
						setTemplateName(templateData.name);
					}
				}

				const { data: contactsData, error: contactsError } =
					await supabase
						.from('campaign_contacts')
						.select('contact_id', { count: 'exact' })
						.eq('campaign_id', id);

				if (contactsError) {
					console.error(
						'Error fetching total contacts:',
						contactsError,
					);
				}

				const { data: sentData, error: sentError } = await supabase
					.from('sent_emails')
					.select('id', { count: 'exact' })
					.eq('campaign_id', id);

				if (sentError) {
					console.error('Error fetching sent emails:', sentError);
				}

				const totalContacts = contactsData?.length || 0;
				const sentEmails = sentData?.length || 0;

				setProgress({
					sent: sentEmails,
					total: totalContacts,
				});
			} catch (err) {
				console.error('Unexpected error:', err);
				setError('An unexpected error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchCampaign();
	}, [id, supabase]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (error || !campaign) {
		return (
			<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
				<h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
					Error Loading Campaign
				</h2>
				<p className="text-red-700 dark:text-red-300">
					{error || 'Campaign not found'}
				</p>
				<Link
					href="/email/campaigns"
					className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
				>
					← Back to Campaigns
				</Link>
			</div>
		);
	}

	// Format date for display
	const formatDate = (dateString?: string) => {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleDateString('en-CA', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	// Get status badge style
	const getStatusBadgeClass = (status?: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
			case 'draft':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
			case 'in-progress':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
			case 'completed':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
		}
	};

	return (
		<div className="max-w-5xl mx-auto">
			{/* Back button */}
			<Link
				href="/email/campaigns"
				className="mb-6 inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
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
				Back to Campaigns
			</Link>

			{/* Header section */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							{campaign.name}
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mt-1">
							Campaign ID: {campaign.id}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<span
							className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(campaign.status)}`}
						>
							{campaign.status || 'No Status'}
						</span>
						<Link
							href={`/email/campaigns/${id}/edit`}
							className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition-colors"
						>
							Edit Campaign
						</Link>
					</div>
				</div>
			</div>

			{/* Campaign details section */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Left column */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Campaign Details
					</h2>

					<div className="space-y-4">
						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Client
							</h3>
							<p className="text-gray-900 dark:text-white">
								{clientName || 'Not assigned'}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Template
							</h3>
							<p className="text-gray-900 dark:text-white">
								{templateName || 'No template'}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Created Date
							</h3>
							<p className="text-gray-900 dark:text-white">
								{formatDate(campaign.created_at)}
							</p>
						</div>
					</div>
				</div>

				{/* Right column */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Timeline
					</h2>

					<div className="space-y-4">
						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Start Date
							</h3>
							<p className="text-gray-900 dark:text-white">
								{formatDate(campaign.start_date)}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Last Updated
							</h3>
							<p className="text-gray-900 dark:text-white">
								{formatDate(campaign.updated_at)}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Progress ({progress.sent} of {progress.total}{' '}
								emails sent)
							</h3>
							<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
								<div
									className="bg-blue-600 h-2.5 rounded-full"
									style={{
										width:
											progress.total > 0
												? `${Math.min(100, (progress.sent / progress.total) * 100)}%`
												: '0%',
									}}
								></div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Tabs for Contacts and Analytics */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
				<div className="border-b border-gray-200 dark:border-gray-700 mb-4">
					<nav className="-mb-px flex" aria-label="Tabs">
						<button
							className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
								activeTab === 'contacts'
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
							}`}
							onClick={() => setActiveTab('contacts')}
						>
							Contacts
						</button>
						<button
							className={`ml-8 py-2 px-4 text-center border-b-2 font-medium text-sm ${
								activeTab === 'analytics'
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
							}`}
							onClick={() => setActiveTab('analytics')}
						>
							Analytics
						</button>
					</nav>
				</div>

				{activeTab === 'contacts' ? (
					<CampaignContactsList campaignId={id} />
				) : (
					<EmailEventsList campaignId={id} />
				)}
			</div>
		</div>
	);
}
