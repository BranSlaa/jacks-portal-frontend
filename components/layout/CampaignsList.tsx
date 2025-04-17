'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Edit2 } from 'lucide-react';

interface Campaign {
	id: number;
	name: string;
	created_at: string;
	updated_at: string;
}

export default function CampaignsList() {
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	useEffect(() => {
		const fetchCampaigns = async () => {
			try {
				const { data, error } = await supabase
					.from('campaigns')
					.select('id, name, created_at, updated_at')
					.order('updated_at', { ascending: false })
					.limit(5);

				if (error) {
					console.error('Error fetching campaigns:', error);
				} else {
					setCampaigns(data || []);
				}
			} catch (err) {
				console.error('Error in fetchCampaigns:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchCampaigns();
	}, [supabase]);

	// Format date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-CA', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className="p-4">
			<h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
				Recent Campaigns
			</h3>
			{loading ? (
				<div className="text-center text-gray-500 dark:text-gray-400">
					Loading...
				</div>
			) : campaigns.length > 0 ? (
				<ul className="space-y-3">
					{campaigns.map(campaign => (
						<li
							key={campaign.id}
							className="border-b border-gray-200 dark:border-gray-700 pb-2"
						>
							<div className="flex justify-between items-center">
								<Link
									href={`/email/campaigns/${campaign.id}`}
									className="text-blue-600 dark:text-blue-400 hover:underline"
								>
									{campaign.name}
								</Link>
								<Link
									href={`/email/campaigns/${campaign.id}/edit`}
									className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								>
									<Edit2 className="w-4 h-4" />
								</Link>
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Updated {formatDate(campaign.updated_at)}
							</p>
						</li>
					))}
				</ul>
			) : (
				<div className="text-center text-gray-500 dark:text-gray-400">
					No campaigns found
				</div>
			)}
		</div>
	);
}
