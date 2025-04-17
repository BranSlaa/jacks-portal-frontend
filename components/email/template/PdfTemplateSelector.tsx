'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { FormField } from '@/components/ui/FormField';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { PdfTemplate, PdfTemplateSelectorProps } from '@/app/types/templates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function PdfTemplateSelector({
	selectedTemplateIds = [],
	onPDFTemplatesChange,
}: PdfTemplateSelectorProps) {
	const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();
	const { showError } = useNotifications();
	const [searchQuery, setSearchQuery] = useState('');

	// Fetch available PDF templates
	useEffect(() => {
		const fetchPdfTemplates = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from('pdf_templates')
					.select('id, name, description, created_at')
					.order('created_at', { ascending: false });

				if (error) {
					console.error('Error fetching PDF templates:', error);
					return;
				}

				if (data) {
					setPdfTemplates(data);
				}
			} catch (error) {
				console.error('Error in PDF templates fetch:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchPdfTemplates();
	}, [supabase]);

	// Handle template selection toggling
	const toggleTemplate = (templateId: number) => {
		if (selectedTemplateIds.includes(templateId)) {
			onPDFTemplatesChange(
				selectedTemplateIds.filter(id => id !== templateId),
			);
		} else {
			onPDFTemplatesChange([...selectedTemplateIds, templateId]);
		}
	};

	// Filter templates based on search query
	const filteredTemplates = searchQuery.trim()
		? pdfTemplates.filter(
				template =>
					template.name
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					(template.description &&
						template.description
							.toLowerCase()
							.includes(searchQuery.toLowerCase())),
			)
		: pdfTemplates;

	return (
		<div className="border border-gray-300 rounded-md overflow-hidden dark:border-gray-600">
			<div className="p-3 bg-gray-50 border-b border-gray-300 dark:bg-gray-700 dark:border-gray-600">
				<Input
					type="text"
					placeholder="Search PDF templates..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className="w-full"
				/>
			</div>

			<div className="max-h-64 overflow-y-auto">
				{loading ? (
					<div className="flex justify-center items-center p-4">
						<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
					</div>
				) : filteredTemplates.length > 0 ? (
					<ul className="divide-y divide-gray-200 dark:divide-gray-700">
						{filteredTemplates.map(template => (
							<li
								key={template.id}
								className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
							>
								<div className="flex items-start">
									<Checkbox
										id={`template-${template.id}`}
										checked={selectedTemplateIds.includes(
											template.id,
										)}
										onCheckedChange={() =>
											toggleTemplate(template.id)
										}
										className="mt-1"
									/>
									<div className="ml-3">
										<Label
											htmlFor={`template-${template.id}`}
										>
											{template.name}
										</Label>
										{template.description && (
											<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
												{template.description}
											</p>
										)}
										<p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
											Created:{' '}
											{new Date(
												template.created_at,
											).toLocaleDateString('en-CA')}
										</p>
									</div>
								</div>
							</li>
						))}
					</ul>
				) : (
					<div className="p-4 text-center text-gray-500 dark:text-gray-400">
						{searchQuery
							? 'No PDF templates match your search'
							: 'No PDF templates available'}
					</div>
				)}
			</div>

			<div className="p-3 bg-gray-50 border-t border-gray-300 dark:bg-gray-700 dark:border-gray-600">
				<div className="flex justify-between items-center">
					<span className="text-sm text-gray-600 dark:text-gray-300">
						{selectedTemplateIds.length} template
						{selectedTemplateIds.length !== 1 ? 's' : ''} selected
					</span>
					{selectedTemplateIds.length > 0 && (
						<Button
							type="button"
							onClick={() => onPDFTemplatesChange([])}
							variant="ghost"
							size="sm"
							className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
						>
							Clear selection
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
