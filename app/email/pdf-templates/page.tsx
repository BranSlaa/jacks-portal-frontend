'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import PostTable from '@/components/PostTable';
import { formatDate } from '@/app/utils/date';
import { FormattedTemplate } from '@/app/types/pdfTemplate';
import { useNotifications } from '@/hooks/useNotifications';
import EmailPageLayout from '@/components/layout/EmailPageLayout';
import Link from 'next/link';

export default function PdfTemplatesPage() {
	const [templates, setTemplates] = useState<FormattedTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();
	const { showError, showSuccess } = useNotifications();

	useEffect(() => {
		const fetchTemplates = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from('pdf_templates')
					.select(
						`
						id,
						name,
						description,
						client_id,
						clients (
							name
						),
						created_at,
						updated_at
					`,
					)
					.order('updated_at', { ascending: false });

				if (error) throw error;

				const formattedTemplates = data?.map((template: any) => ({
					...template,
					client_name: template.clients?.name || 'Unknown',
					created_at_formatted: formatDate(template.created_at),
					updated_at_formatted: formatDate(template.updated_at),
				})) as FormattedTemplate[];

				setTemplates(formattedTemplates || []);
			} catch (error: any) {
				console.error('Error fetching PDF templates:', error);
				showError(`Failed to load PDF templates: ${error.message}`);
			} finally {
				setLoading(false);
			}
		};

		fetchTemplates();

		const channel = supabase
			.channel('pdf-templates-changes')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'pdf_templates' },
				payload => {
					const newTemplate = payload.new as any;
					const formattedTemplate = {
						...newTemplate,
						client_name: 'Unknown',
						created_at_formatted: formatDate(
							newTemplate.created_at,
						),
						updated_at_formatted: formatDate(
							newTemplate.updated_at,
						),
					};
					setTemplates(prev => [formattedTemplate, ...prev]);
					showSuccess('New PDF template added');
				},
			)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'pdf_templates' },
				payload => {
					const updatedTemplate = payload.new as any;
					setTemplates(prev =>
						prev.map(template => {
							if (template.id === updatedTemplate.id) {
								return {
									...updatedTemplate,
									client_name: template.client_name,
									created_at_formatted: formatDate(
										updatedTemplate.created_at,
									),
									updated_at_formatted: formatDate(
										updatedTemplate.updated_at,
									),
								};
							}
							return template;
						}),
					);
					showSuccess('PDF template updated');
				},
			)
			.on(
				'postgres_changes',
				{ event: 'DELETE', schema: 'public', table: 'pdf_templates' },
				payload => {
					const deletedTemplate = payload.old as any;
					setTemplates(prev =>
						prev.filter(
							template => template.id !== deletedTemplate.id,
						),
					);
					showSuccess('PDF template deleted');
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [supabase, showError, showSuccess]);

	const columns = [
		{
			key: 'name',
			header: 'Name',
			actions: true,
			render: (template: FormattedTemplate) => (
				<Link
					href={`/email/pdf-templates/${template.id}`}
					className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
				>
					{template.name}
				</Link>
			),
		},
		{
			key: 'description',
			header: 'Description',
			render: (template: FormattedTemplate) =>
				template.description || 'No description',
		},
		{
			key: 'client_name',
			header: 'Client',
		},
		{
			key: 'updated_at_formatted',
			header: 'Last Updated',
		},
	];

	const handleEdit = (template: FormattedTemplate) => {
		window.location.href = `/email/pdf-templates/${template.id}/edit`;
	};

	const handleDuplicate = async (template: FormattedTemplate) => {
		try {
			const baseName = template.name.replace(/ \(Copy( \d+)?\)$/, '');
			const { data: existingCopies } = await supabase
				.from('pdf_templates')
				.select('name')
				.like('name', `${baseName} (Copy%)`);

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

			const duplicatedTemplate = {
				client_id: template.client_id,
				name: newName,
				description: template.description,
				html_content: template.html_content,
				css_content: template.css_content,
			};

			const { error } = await supabase
				.from('pdf_templates')
				.insert([duplicatedTemplate]);

			if (error) throw error;

			showSuccess(
				`PDF template "${template.name}" duplicated successfully`,
			);
		} catch (error: any) {
			console.error('Error duplicating PDF template:', error);
			showError(`Failed to duplicate PDF template: ${error.message}`);
		}
	};

	const handleDelete = async (template: FormattedTemplate) => {
		if (
			!window.confirm(
				`Are you sure you want to delete "${template.name}"?`,
			)
		) {
			return;
		}

		try {
			const { error } = await supabase
				.from('pdf_templates')
				.delete()
				.eq('id', template.id);

			if (error) throw error;

			setTemplates(prev => prev.filter(t => t.id !== template.id));
			showSuccess(`PDF template "${template.name}" deleted successfully`);
		} catch (error: any) {
			console.error('Error deleting PDF template:', error);
			showError(`Failed to delete PDF template: ${error.message}`);
		}
	};

	return (
		<EmailPageLayout
			title="PDF Templates"
			createLink="/email/pdf-templates/new"
			createButtonText="Create New"
			breadcrumbItems={[
				{ label: 'Email', href: '/email' },
				{ label: 'PDF Templates' },
			]}
		>
			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			) : (
				<PostTable
					data={templates}
					columns={columns}
					onEdit={handleEdit}
					onDuplicate={handleDuplicate}
					onDelete={handleDelete}
				/>
			)}
		</EmailPageLayout>
	);
}
