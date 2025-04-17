'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PostTable from '@/components/PostTable';
import { Campaign } from '../../types/campaigns';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CampaignPage() {
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
	const supabase = createClient();
	const { showError, showSuccess } = useNotifications();

	useEffect(() => {
		const fetchInitialData = async () => {
			setLoading(true);

			const { data, error } = await supabase
				.from('campaigns')
				.select('*');

			console.log('data', data);
			if (error) {
				console.error('Error fetching initial campaigns:', error);
				showError(`Failed to load campaigns: ${error.message}`);
			} else if (data) {
				// Enhance campaigns with progress information
				const enhancedCampaigns = await Promise.all(
					data.map(async campaign => {
						// Get total contacts count
						const { data: contactsData, error: contactsError } =
							await supabase
								.from('campaign_contacts')
								.select('contact_id', { count: 'exact' })
								.eq('campaign_id', campaign.id);

						// Get sent emails count
						const { data: sentData, error: sentError } =
							await supabase
								.from('sent_emails')
								.select('id', { count: 'exact' })
								.eq('campaign_id', campaign.id);

						const totalContacts = contactsData?.length || 0;
						const sentEmails = sentData?.length || 0;
						const progressPercent =
							totalContacts > 0
								? Math.round((sentEmails / totalContacts) * 100)
								: 0;

						return {
							...campaign,
							totalContacts,
							sentEmails,
							progress: progressPercent,
						};
					}),
				);

				setCampaigns(enhancedCampaigns);
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

	// Helper function to render progress bar
	const renderProgressBar = (campaign: any) => {
		const sentCount = campaign.sentEmails || 0;
		const total = campaign.totalContacts || 0;
		const progressPercent = campaign.progress || 0;

		if (campaign.status === 'completed') {
			return (
				<div className="w-full">
					<div className="flex items-center justify-between text-xs mb-1">
						<span>Complete</span>
						<span>
							{sentCount}/{total}
						</span>
					</div>
					<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full bg-green-400"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
				</div>
			);
		}

		if (campaign.status === 'in-progress' && sentCount === 0) {
			return (
				<div className="w-full">
					<div className="flex items-center justify-between text-xs mb-1">
						<span>0% complete</span>
					</div>
					<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full bg-blue-500"
							style={{ width: '0%' }}
						/>
					</div>
				</div>
			);
		}

		if (total === 0) {
			return <span className="text-gray-500">Not started</span>;
		}

		return (
			<div className="w-full">
				<div className="flex items-center justify-between text-xs mb-1">
					<span>{progressPercent}% complete</span>
					<span>
						{sentCount}/{total}
					</span>
				</div>
				<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
					<div
						className="h-full bg-blue-500"
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>
		);
	};

	// Define columns for the campaign table
	const campaignColumns = [
		{
			key: 'name',
			actions: true,
			header: 'Campaign Name',
			render: (campaign: Campaign) => (
				<Link
					href={`/email/campaigns/${campaign.id}`}
					className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
				>
					{campaign.name}
				</Link>
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
			key: 'status',
			header: 'Status',
			render: (campaign: Campaign) => (
				<span
					className={`px-2 py-1 rounded-full text-xs font-medium ${
						campaign.status === 'active'
							? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
							: campaign.status === 'pending' ||
								  campaign.status === 'in-progress'
								? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
								: campaign.status === 'completed'
									? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
									: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
					}`}
				>
					{campaign.status}
				</span>
			),
		},
		{
			key: 'progress',
			header: 'Progress',
			render: renderProgressBar,
		},
		{
			key: 'sent_today',
			header: 'Sent Today',
			render: (campaign: Campaign) => {
				const sentToday = campaign.sent_today_count || 0;
				const maxDaily = campaign.max_emails_per_day || 0;

				if (!maxDaily) {
					return <span>{sentToday}/∞</span>;
				}

				const percentage = Math.min(100, (sentToday / maxDaily) * 100);

				return (
					<div className="w-full">
						<div className="flex items-center justify-between text-xs mb-1">
							<span>
								{sentToday}/{maxDaily}
							</span>
						</div>
						<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full bg-amber-400"
								style={{ width: `${percentage}%` }}
							/>
						</div>
					</div>
				);
			},
		},
	];

	const handleEdit = (campaign: Campaign) => {
		window.location.href = `/email/campaigns/${campaign.id}/edit`;
	};

	const handleDuplicate = async (campaign: Campaign) => {
		try {
			const baseName = campaign.name.replace(/ \(Copy( \d+)?\)$/, '');
			const { data: existingCopies, error: searchError } = await supabase
				.from('campaigns')
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

			const duplicatedCampaign = {
				client_id: campaign.client_id,
				name: newName,
				status: 'draft',
				template_id: campaign.template_id,
				start_date: campaign.start_date,
				days_of_week: campaign.days_of_week,
				max_emails_per_day: campaign.max_emails_per_day,
			};

			// Insert the new campaign
			const { error } = await supabase
				.from('campaigns')
				.insert([duplicatedCampaign]);

			if (error) throw error;

			// Fetch updated data after insert
			const { data: fetchedData, error: fetchError } = await supabase
				.from('campaigns')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(1);

			if (fetchError) throw fetchError;

			if (fetchedData && fetchedData.length > 0) {
				const newCampaign = {
					...fetchedData[0],
					totalContacts: 0,
					sentEmails: 0,
					progress: 0,
				};
				setCampaigns(prev => [newCampaign, ...prev]);
			}

			showSuccess(`Campaign "${campaign.name}" duplicated successfully`);
		} catch (error: any) {
			console.error('Error duplicating campaign:', error);
			showError(`Failed to duplicate campaign: ${error.message}`);
		}
	};

	const handleDelete = async (campaign: Campaign) => {
		if (
			!window.confirm(
				`Are you sure you want to delete "${campaign.name}"?`,
			)
		) {
			return;
		}

		try {
			// Delete campaign contacts first
			const { error: contactsError } = await supabase
				.from('campaign_contacts')
				.delete()
				.eq('campaign_id', campaign.id);

			if (contactsError) throw contactsError;

			// Delete campaign contact lists
			const { error: listsError } = await supabase
				.from('campaign_contact_lists')
				.delete()
				.eq('campaign_id', campaign.id);

			if (listsError) throw listsError;

			// Finally delete the campaign
			const { error } = await supabase
				.from('campaigns')
				.delete()
				.eq('id', campaign.id);

			if (error) throw error;

			// Remove from local state
			setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
			showSuccess(`Campaign "${campaign.name}" deleted successfully`);
		} catch (error: any) {
			console.error('Error deleting campaign:', error);
			showError(`Failed to delete campaign: ${error.message}`);
		}
	};

	// Filter campaigns based on active/archived status
	const activeCampaigns = campaigns.filter(campaign => {
		if (activeTab === 'active') {
			return campaign.status !== 'archived';
		} else {
			return campaign.status === 'archived';
		}
	});

	const activeButtonClass =
		'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700';

	return (
		<div className="p-4">
			<div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
					Email Campaigns
				</h1>
				<Link
					href="/email/campaigns/new"
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
					New Campaign
				</Link>
			</div>

			{/* Tabs */}
			<div className="flex gap-x-4 mb-2">
				<Button
					className={`py-2 px-4 text-center text-sm font-medium ${
						activeTab === 'active' ? activeButtonClass : ''
					}`}
					onClick={() => setActiveTab('active')}
				>
					Active Campaigns
				</Button>
				<Button
					className={`py-2 px-4 text-center text-sm font-medium ${
						activeTab === 'archived' ? activeButtonClass : ''
					}`}
					onClick={() => setActiveTab('archived')}
				>
					Archived Campaigns
				</Button>
			</div>

			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			) : (
				<PostTable<Campaign>
					data={activeCampaigns}
					columns={campaignColumns}
					onEdit={handleEdit}
					onDuplicate={handleDuplicate}
					onDelete={handleDelete}
				/>
			)}
		</div>
	);
}
