'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PostTable from '@/components/PostTable';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import { Template } from '@/app/types/templates';
import { LinkTagList } from '@/components/ui/LinkTagList';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function TemplatePage() {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [loading, setLoading] = useState(true);
	const [campaignsByTemplate, setCampaignsByTemplate] = useState<{
		[key: string]: any[];
	}>({});
	const supabase = createClient();
	const { showError, showSuccess } = useNotifications();

	// Define fetchTemplates outside useEffect so it can be called from elsewhere
	const fetchTemplates = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('templates')
			.select('*')
			.order('updated_at', { ascending: false });

		if (error) {
			console.error('Error fetching templates:', error);
			showError(`Failed to load templates: ${error.message}`);
		} else if (data) {
			// Enhance templates with attachment info
			const enhancedTemplates = await Promise.all(
				(data || []).map(async template => {
					// Get media attachments
					let mediaData: any[] = [];
					try {
						const { data: mediaResult, error: mediaError } =
							await supabase
								.from('media')
								.select('id')
								.eq('template_id', template.id);

						if (!mediaError && mediaResult) {
							mediaData = mediaResult;
						}
					} catch (err) {
						console.error('Error fetching media attachments:', err);
					}

					// Get PDF templates
					let pdfData: any[] = [];
					try {
						// Try to get all PDF templates and filter in code
						const { data: allPdfTemplates, error: pdfError } =
							await supabase.from('pdf_templates').select('*');

						if (pdfError) {
							console.error(
								'PDF Templates query error:',
								pdfError.message,
								pdfError.details,
							);
						} else if (allPdfTemplates) {
							// Filter manually in code to avoid potential query issues
							pdfData = allPdfTemplates
								.filter(pdf => pdf.template_id === template.id)
								.map(pdf => ({ id: pdf.id }));
						}
					} catch (err) {
						console.error('Error fetching PDF templates:', err);
					}

					return {
						...template,
						attachments: mediaData,
						pdfTemplateIds: pdfData,
					};
				}),
			);

			// Fetch campaigns data for all templates at once
			const templateIds = enhancedTemplates.map(t => t.id);
			const { data: campaignsData } = await supabase
				.from('campaigns')
				.select('id, name, template_id')
				.in('template_id', templateIds);

			// Group campaigns by template_id
			const campaignsMap: { [key: string]: any[] } = {};
			(campaignsData || []).forEach(campaign => {
				if (!campaignsMap[campaign.template_id]) {
					campaignsMap[campaign.template_id] = [];
				}
				campaignsMap[campaign.template_id].push(campaign);
			});

			setCampaignsByTemplate(campaignsMap);
			setTemplates(enhancedTemplates);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchTemplates();

		// Set up real-time subscription with better error handling
		let channel: ReturnType<typeof supabase.channel> | null = null;
		try {
			channel = supabase
				.channel('templates-changes')
				.on(
					'postgres_changes',
					{ event: 'INSERT', schema: 'public', table: 'templates' },
					payload => {
						const newTemplate = payload.new as Template;
						setTemplates(prev => [...prev, newTemplate]);
						showSuccess('New template added');
					},
				)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'templates' },
					payload => {
						const updatedTemplate = payload.new as Template;
						setTemplates(prev =>
							prev.map(template =>
								template.id === updatedTemplate.id
									? updatedTemplate
									: template,
							),
						);
						showSuccess('Template updated');
					},
				)
				.on(
					'postgres_changes',
					{ event: 'DELETE', schema: 'public', table: 'templates' },
					payload => {
						const deletedTemplate = payload.old as Template;
						setTemplates(prev =>
							prev.filter(
								template => template.id !== deletedTemplate.id,
							),
						);
						showSuccess('Template deleted');
					},
				);
		} catch (error) {
			console.error('Error setting up real-time subscription:', error);
		}

		return () => {
			// Safe cleanup of channel
			if (channel) {
				try {
					supabase.removeChannel(channel);
				} catch (error) {
					console.error('Error removing channel:', error);
				}
			}
		};
	}, [supabase, showError, showSuccess]);

	// Helper function to format dates
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-CA');
	};

	const templateColumns = [
		{
			key: 'name',
			actions: true,
			header: 'Template Name',
			render: (template: Template) => (
				<Link
					href={`/email/templates/${template.id}`}
					className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
				>
					{template.name}
				</Link>
			),
		},
		{
			key: 'attachments',
			header: 'Attachments',
			render: (template: Template) => {
				const attachmentsCount = template.attachments?.length || 0;
				const pdfTemplateIdsCount =
					template.pdfTemplateIds?.length || 0;
				const totalAttachments = attachmentsCount + pdfTemplateIdsCount;

				if (totalAttachments === 0) {
					return <span className="text-gray-400">None</span>;
				}

				return (
					<div className="flex items-center space-x-1">
						{attachmentsCount > 0 && (
							<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-3 w-3 mr-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
									/>
								</svg>
								{attachmentsCount} file
								{attachmentsCount !== 1 ? 's' : ''}
							</span>
						)}
						{pdfTemplateIdsCount > 0 && (
							<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-3 w-3 mr-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
								{pdfTemplateIdsCount} PDF
								{pdfTemplateIdsCount !== 1 ? 's' : ''}
							</span>
						)}
					</div>
				);
			},
		},
		{
			key: 'updated_at',
			header: 'Last Updated',
			render: (template: Template) => formatDate(template.updated_at),
		},
		{
			key: 'campaigns',
			header: 'Used In Campaigns',
			render: (template: Template) => {
				const templateCampaigns =
					campaignsByTemplate[template.id] || [];

				return (
					<LinkTagList
						items={templateCampaigns}
						basePath="/email/campaigns/"
						emptyMessage="Not in use"
						emptyClassName="text-gray-400"
						tagClassName="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1"
						className="max-w-xs"
					/>
				);
			},
		},
	];

	const handleEdit = (template: Template) => {
		window.location.href = `/email/templates/${template.id}/edit`;
	};

	const handleDuplicate = async (template: Template) => {
		try {
			// First, let's strip any existing "(Copy)" text from the template name
			// to handle multiple duplications cleanly
			const baseTemplateName = template.name.replace(
				/ \(Copy( \d+)?\)$/,
				'',
			);

			// Find all templates with similar names to determine the next copy number
			const { data: existingCopies } = await supabase
				.from('templates')
				.select('name')
				.like('name', `${baseTemplateName} (Copy%`);

			// Determine new name based on existing copies
			let newName = `${baseTemplateName} (Copy)`;

			if (existingCopies && existingCopies.length > 0) {
				// Extract copy numbers
				const copyNumbers = existingCopies.map(t => {
					const match = t.name.match(/ \(Copy( (\d+))?\)$/);
					return match && match[2] ? parseInt(match[2]) : 1;
				});

				// Find highest number and increment
				const highestNumber = Math.max(...copyNumbers, 0);
				newName = `${baseTemplateName} (Copy ${highestNumber + 1})`;
			}

			// Create duplicated template omitting specific fields that should be generated by DB
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { id, created_at, updated_at, attachments, ...templateData } =
				template;

			const duplicatedTemplate = {
				...templateData,
				name: newName,
			};

			// Insert the new template
			const { data: newTemplate, error } = await supabase
				.from('templates')
				.insert(duplicatedTemplate)
				.select('id')
				.single();

			if (error) throw error;

			// If original template had attachments, duplicate them
			if (template.attachments && template.attachments.length > 0) {
				// This could be a separate async operation to speed up initial duplication
				const duplicateAttachmentsPromise = Promise.all(
					template.attachments.map(async attachment => {
						await supabase.from('template_attachments').insert({
							template_id: newTemplate.id,
							file_name: attachment.file_name,
							file_url: attachment.file_url,
							file_size: attachment.file_size,
							mime_type: attachment.mime_type,
						});
					}),
				);

				// We're not awaiting this promise to speed up the UI response
				duplicateAttachmentsPromise.catch(error => {
					console.error('Error duplicating attachments:', error);
				});
			}

			showSuccess(`Template "${newName}" created successfully`);
			fetchTemplates();
		} catch (error: any) {
			console.error('Error duplicating template:', error);
			showError(`Failed to duplicate template: ${error.message}`);
		}
	};

	const handleDelete = async (template: Template) => {
		if (
			!window.confirm(
				`Are you sure you want to delete "${template.name}"?`,
			)
		) {
			return;
		}

		try {
			const { error } = await supabase
				.from('templates')
				.delete()
				.eq('id', template.id);

			if (error) throw error;

			// Remove template from state
			setTemplates(prev => prev.filter(t => t.id !== template.id));

			showSuccess(`Template "${template.name}" deleted successfully`);
		} catch (error: any) {
			console.error('Error deleting template:', error);
			showError(`Failed to delete template: ${error.message}`);
		}
	};

	return (
		<div className="container py-6">
			<Breadcrumb
				items={[
					{ label: 'Email', href: '/email' },
					{ label: 'Templates' },
				]}
				homeHref="/dashboard"
			/>
			<div className="p-4">
				<div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
						Email Templates
					</h1>
					<Link
						href="/email/templates/new"
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
						New Template
					</Link>
				</div>

				{loading ? (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
					</div>
				) : (
					<PostTable<Template>
						data={templates}
						columns={templateColumns}
						onEdit={handleEdit}
						onDuplicate={handleDuplicate}
						onDelete={handleDelete}
					/>
				)}
			</div>
		</div>
	);
}
