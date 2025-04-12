'use client';

import { createClient } from '@/utils/supabase/client';
import { Campaign } from '@/app/types/campaigns';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CampaignDetailedPage({
	params,
}: {
	params: { id: string };
}) {
	const [campaign, setCampaign] = useState<Campaign | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const supabase = createClient();

	useEffect(() => {
		const fetchCampaign = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from('campaigns')
					.select('*')
					.eq('id', params.id)
					.single();

				if (error) {
					setError(error.message);
					console.error('Error fetching campaign:', error);
				} else {
					setCampaign(data);
				}
			} catch (err) {
				console.error('Unexpected error:', err);
				setError('An unexpected error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchCampaign();
	}, [params.id, supabase]);

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
					href="/campaigns"
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
				href="/campaigns"
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
						<button className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition-colors">
							Edit Campaign
						</button>
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
								Client ID
							</h3>
							<p className="text-gray-900 dark:text-white">
								{campaign.client_id || 'Not assigned'}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Template
							</h3>
							<p className="text-gray-900 dark:text-white">
								{campaign.template_id || 'No template'}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
								Start Date
							</h3>
							<p className="text-gray-900 dark:text-white">
								{formatDate(campaign.start_date)}
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
								Created At
							</h3>
							<p className="text-gray-900 dark:text-white">
								{formatDate(campaign.created_at)}
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
								Progress
							</h3>
							<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
								<div className="bg-blue-600 h-2.5 rounded-full w-1/3"></div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Additional sections could go here */}
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
					Campaign Analytics
				</h2>
				<p className="text-gray-600 dark:text-gray-400">
					Analytics data will be displayed here. This section is a
					placeholder for future development.
				</p>
			</div>
		</div>
	);
}
