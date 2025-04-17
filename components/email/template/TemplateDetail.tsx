'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Template } from '@/app/types/templates';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TemplateDetailProps {
	template: Template;
	templateId: string;
}

// Memoize attachment item to prevent unnecessary re-renders
const AttachmentItem = memo(({ attachment }: { attachment: any }) => (
	<div
		key={attachment.id}
		className="border rounded-md p-3 flex items-center"
	>
		<div className="mr-3">
			{attachment.mime_type &&
			attachment.mime_type.startsWith('image/') ? (
				<img
					src={attachment.file_url || ''}
					alt={attachment.file_name || 'Attachment'}
					className="w-12 h-12 object-cover rounded"
				/>
			) : (
				<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
					<svg
						className="w-6 h-6 text-gray-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
						></path>
					</svg>
				</div>
			)}
		</div>
		<div className="overflow-hidden">
			<p
				className="font-medium truncate"
				title={attachment.file_name || 'Attachment'}
			>
				{attachment.file_name || 'Attachment'}
			</p>
			<p className="text-xs text-gray-500 dark:text-gray-400">
				{attachment.file_size
					? Math.round(attachment.file_size / 1024) + ' KB'
					: 'Unknown size'}
			</p>
		</div>
	</div>
));

AttachmentItem.displayName = 'AttachmentItem';

export default function TemplateDetail({
	template,
	templateId,
}: TemplateDetailProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const router = useRouter();
	const { showSuccess, showError } = useNotifications();
	const supabase = createClient();

	const handleDelete = useCallback(async () => {
		if (
			!confirm(
				'Are you sure you want to delete this template? This action cannot be undone.',
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			const { error } = await supabase
				.from('templates')
				.delete()
				.eq('id', templateId);

			if (error) throw error;

			showSuccess('Template deleted successfully');
			router.push('/email/templates');
		} catch (error: any) {
			console.error('Error deleting template:', error);
			showError(`Failed to delete template: ${error.message}`);
		} finally {
			setIsDeleting(false);
		}
	}, [templateId, supabase, showSuccess, showError, router]);

	if (isDeleting) {
		return <LoadingSpinner />;
	}

	return (
		<div className="mx-auto">
			<Breadcrumb
				items={[
					{ label: 'Email', href: '/email' },
					{ label: 'Templates', href: '/email/templates' },
					{ label: template.name },
				]}
				homeHref="/dashboard"
			/>

			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					{template.name}
				</h1>
				<div className="flex space-x-2">
					<Link
						href={`/email/templates/${templateId}/edit`}
						className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
					>
						Edit Template
					</Link>
					<Button
						variant="destructive"
						onClick={handleDelete}
						className="px-4 py-2 rounded-md"
					>
						Delete
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">
						Template Details
					</h2>
					<div className="space-y-4">
						<div>
							<p className="text-gray-500 dark:text-gray-400">
								From Name
							</p>
							<p className="font-medium">{template.from_name}</p>
						</div>
						<div>
							<p className="text-gray-500 dark:text-gray-400">
								From Email
							</p>
							<p className="font-medium">{template.from_email}</p>
						</div>
						<div>
							<p className="text-gray-500 dark:text-gray-400">
								Subject
							</p>
							<p className="font-medium">{template.subject}</p>
						</div>
						<div>
							<p className="text-gray-500 dark:text-gray-400">
								Reply To
							</p>
							<p className="font-medium">
								{template.reply_to_email || (
									<span className="text-gray-500 dark:text-gray-400">
										N/A
									</span>
								)}
							</p>
						</div>
						<div>
							<p className="text-gray-500 dark:text-gray-400">
								Created
							</p>
							<p className="font-medium">
								{new Date(
									template.created_at,
								).toLocaleDateString('en-CA')}
							</p>
						</div>
						<div>
							<p className="text-gray-500 dark:text-gray-400">
								Last Updated
							</p>
							<p className="font-medium">
								{new Date(
									template.updated_at,
								).toLocaleDateString('en-CA')}
							</p>
						</div>
					</div>
				</section>

				<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">
						Content Preview
					</h2>
					<div
						className="prose dark:prose-invert max-w-none"
						dangerouslySetInnerHTML={{ __html: template.content }}
					/>
				</section>

				{template.attachments && template.attachments.length > 0 && (
					<section className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
						<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">
							Attachments
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
							{template.attachments.map(attachment => (
								<AttachmentItem
									key={attachment.id}
									attachment={attachment}
								/>
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
