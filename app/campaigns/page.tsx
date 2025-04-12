'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PostTable from '@/components/PostTable';
import { Campaign } from '../types/campaigns';
import { useNotifications } from '@/hooks/useNotifications';

export default function CampaignPage() {
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();
	const { showError, showSuccess } = useNotifications();

	useEffect(() => {
		const fetchInitialData = async () => {
			setLoading(true);
			const { data, error } = await supabase
				.from('campaigns')
				.select('*');

			if (error) {
				console.error('Error fetching initial campaigns:', error);
				showError(`Failed to load campaigns: ${error.message}`);
			} else if (data) {
				setCampaigns(data);
				showSuccess('Campaigns loaded successfully');
			}
			setLoading(false);
		};

		fetchInitialData();

		const channel = supabase
			.channel('campaigns-changes')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'campaigns' },
				payload => {
					console.log('Insert', payload);
					const newCampaign = payload.new as Campaign;
					setCampaigns(prev => [...prev, newCampaign]);
					showSuccess('New campaign added');
				},
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'campaigns' },
				payload => {
					console.log('Update', payload);
					const newCampaign = payload.new as Campaign;

					if (newCampaign) {
						setCampaigns(prev =>
							prev.map(campaign =>
								campaign.id === newCampaign.id
									? newCampaign
									: campaign,
							),
						);
						showSuccess('Campaign updated');
					}
				},
			)
			.on(
				'postgres_changes',
				{ event: 'DELETE', schema: 'public', table: 'campaigns' },
				payload => {
					console.log('Delete', payload);
					const deletedCampaign = payload.old as Campaign;
					setCampaigns(prev =>
						prev.filter(c => c.id !== deletedCampaign.id),
					);
					showSuccess('Campaign deleted');
				},
			)
			.subscribe();

		// Cleanup subscription on component unmount
		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, showError, showSuccess]); // Add notification functions as dependencies

	// Define columns for the campaign table
	const campaignColumns = [
		{
			key: 'name',
			actions: true,
			header: 'Campaign Name',
			render: (campaign: Campaign) => (
				<a
					href={`/campaigns/${campaign.id}`}
					className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
				>
					{campaign.name}
				</a>
			),
		},
		{
			key: 'start_date',
			header: 'Start Date',
			render: (campaign: Campaign) =>
				campaign.start_date
					? new Date(campaign.start_date).toLocaleDateString('en-CA')
					: '',
		},
		{
			key: 'end_date',
			header: 'End Date',
			render: (campaign: Campaign) =>
				campaign.end_date
					? new Date(campaign.end_date).toLocaleDateString('en-CA')
					: '',
		},
		{
			key: 'status',
			header: 'Status',
			render: (campaign: Campaign) => (
				<span
					className={`px-2 py-1 rounded-full text-xs font-medium ${
						campaign.status === 'active'
							? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
							: campaign.status === 'pending'
								? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
								: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
					}`}
				>
					{campaign.status}
				</span>
			),
		},
	];

	const handleEdit = (campaign: Campaign) => {
		console.log('Edit campaign:', campaign);
		showSuccess(`Editing campaign: ${campaign.name}`);
		// Add your edit logic here
	};

	return (
		<div className="">
			<h1 className="text-2xl font-semibold mb-4">Campaigns</h1>
			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			) : (
				<PostTable<Campaign>
					data={campaigns}
					columns={campaignColumns}
					onEdit={handleEdit}
				/>
			)}
		</div>
	);
}
