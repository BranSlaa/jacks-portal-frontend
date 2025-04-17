'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { MegaMenuProps } from '@/app/types/ui';

export default function MegaMenu({ type, title, createLink }: MegaMenuProps) {
	const [recentItems, setRecentItems] = useState<any[]>([]);
	const supabase = createClient();

	useEffect(() => {
		const fetchRecentItems = async () => {
			try {
				let table = '';
				let nameColumn = 'name';

				// Map type to table name
				switch (type) {
					case 'campaigns':
						table = 'campaigns';
						break;
					case 'templates':
						table = 'templates';
						break;
					case 'contact-lists':
						table = 'contact_lists';
						break;
					case 'contacts':
						table = 'contacts';
						nameColumn = "CONCAT(first_name, ' ', last_name)";
						break;
				}

				// Fetch recent items
				const { data, error } = await supabase
					.from(table)
					.select(
						'id, created_at, updated_at' +
							(nameColumn !== 'name'
								? ', first_name, last_name'
								: ', name'),
					)
					.order('updated_at', { ascending: false })
					.limit(5);

				if (error) {
					console.error(`Error fetching recent ${type}:`, error);
				} else {
					setRecentItems(data || []);
				}
			} catch (err) {
				console.error(`Error in fetchRecentItems for ${type}:`, err);
			}
		};

		fetchRecentItems();
	}, [type, supabase]);

	// Format item name based on type
	const getItemName = (item: any) => {
		if (type === 'contacts') {
			return `${item.first_name} ${item.last_name}`;
		}
		return item.name;
	};

	// Get item link based on type
	const getItemLink = (item: any) => {
		const baseUrl = `/email/${type}`;
		return `${baseUrl}/${item.id}`;
	};

	// Get edit link for item
	const getEditLink = (item: any) => {
		const baseUrl = `/email/${type}`;
		return `${baseUrl}/${item.id}/edit`;
	};

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
		<div className="container mx-auto px-8 py-6 text-white">
			<div className="grid grid-cols-3 gap-8">
				<div className="col-span-2">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-xl font-medium text-white">
							{title}
						</h3>
					</div>

					<h4 className="text-sm font-medium text-gray-300/80 mb-3">
						Recently Updated
					</h4>

					{recentItems.length > 0 ? (
						<ul className="space-y-2 bg-black rounded-md p-2">
							{recentItems.map(item => (
								<li
									key={item.id}
									className="text-sm border-b border-gray-700"
								>
									<div className="block p-2 hover:bg-gray-800 transition-colors">
										<div className="flex justify-between items-center">
											<Link
												href={getItemLink(item)}
												className="font-medium text-white hover:text-blue-300"
											>
												{getItemName(item)}
											</Link>
											<div className="flex items-center space-x-2">
												<span className="text-gray-400 text-xs">
													{formatDate(
														item.updated_at,
													)}
												</span>
												<Link
													href={getEditLink(item)}
													className="text-gray-400 hover:text-blue-400"
													title="Edit"
												>
													<Edit2 size={14} />
												</Link>
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-gray-400 py-2">
							No {type} found. Create your first one!
						</p>
					)}
				</div>

				<div className="col-span-1 border-l border-gray-700 pl-8">
					<h4 className="text-sm font-medium text-white mb-4">
						Quick Links
					</h4>
					<div className="space-y-3">
						<Link
							href={`/email/${type}`}
							className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
						>
							View all {type}
						</Link>
						<Link
							href={createLink}
							className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
						>
							Create new {type.replace(/s$/, '')}
						</Link>
						{type === 'campaigns' && (
							<Link
								href="/email/campaigns/analytics"
								className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
							>
								Campaign analytics
							</Link>
						)}
						{type === 'contact-lists' && (
							<Link
								href="/email/contact-lists/import"
								className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
							>
								Import contacts
							</Link>
						)}
						{type === 'contacts' && (
							<Link
								href="/email/contacts/import"
								className="block text-sm text-blue-400 hover:text-blue-300 transition-colors"
							>
								Import contacts
							</Link>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
