'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Edit2 } from 'lucide-react';
import { Template } from '@/app/types/templates';

export default function TemplateList() {
	const [templates, setTemplates] = useState<Partial<Template>[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	useEffect(() => {
		const fetchTemplates = async () => {
			try {
				const { data, error } = await supabase
					.from('templates')
					.select('id, name, created_at, updated_at')
					.order('updated_at', { ascending: false })
					.limit(5);

				if (error) {
					console.error('Error fetching templates:', error);
				} else {
					setTemplates(data || []);
				}
			} catch (err) {
				console.error('Error in fetchTemplates:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchTemplates();
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
				Recent Templates
			</h3>
			{loading ? (
				<div className="text-center text-gray-500 dark:text-gray-400">
					Loading...
				</div>
			) : templates.length > 0 ? (
				<ul className="space-y-3">
					{templates.map(template => (
						<li
							key={template.id}
							className="border-b border-gray-200 dark:border-gray-700 pb-2"
						>
							<div className="flex justify-between items-center">
								<Link
									href={`/email/templates/${template.id}`}
									className="text-blue-600 dark:text-blue-400 hover:underline"
								>
									{template.name}
								</Link>
								<Link
									href={`/email/templates/${template.id}/edit`}
									className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								>
									<Edit2 className="w-4 h-4" />
								</Link>
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								Updated {formatDate(template.updated_at || '')}
							</p>
						</li>
					))}
				</ul>
			) : (
				<div className="text-center text-gray-500 dark:text-gray-400">
					No templates found
				</div>
			)}
		</div>
	);
}
