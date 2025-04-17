'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Template } from '@/app/types/templates';
import { useNotifications } from '@/hooks/useNotifications';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { EditorWrapper } from './EditorWrapper';
import Attachment from './Attachment';
import PdfTemplateSelector from './PdfTemplateSelector';
import { UploadedFile } from '@/app/types/templateEditor';
import { TEMPLATE_VARIABLES } from '@/app/constants/templateEditor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import AttachmentEditor from './AttachmentEditor';
import { FileCategory } from '@/app/types/templateEditor';
import { TemplateFormProps } from '@/app/types/templates';

export default function TemplateForm({
	template,
	isNewTemplate,
	onSuccess,
}: TemplateFormProps) {
	const [currentTemplate, setCurrentTemplate] = useState<Template>(template);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [attachments, setAttachments] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
	const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
		[],
	);
	const [editingFile, setEditingFile] = useState<File | null>(null);
	const [fileProperties, setFileProperties] = useState<
		Record<
			string,
			{
				category: FileCategory;
				width?: number;
				height?: number;
				alt_text?: string;
			}
		>
	>({});

	const supabase = createClient();
	const { showError } = useNotifications();
	const router = useRouter();

	useEffect(() => {
		// Create a new template object with all the proper number conversions at once
		const updatedTemplate = {
			...template,
			// Convert client_id to number if it's a string
			client_id:
				template.client_id && typeof template.client_id === 'string'
					? parseInt(template.client_id, 10)
					: template.client_id,
			// Convert any other string IDs to numbers as needed
			pdfTemplateIds: template.pdfTemplateIds.map(id => Number(id)),
		};

		setCurrentTemplate(updatedTemplate);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty dependency array means this only runs once on mount

	useEffect(() => {
		// Fetch available clients
		const fetchClients = async () => {
			try {
				const { data, error } = await supabase
					.from('clients')
					.select('id, name')
					.order('name');

				if (error) {
					console.error('Error fetching clients:', error);
					showError(`Failed to load clients: ${error.message}`);
					return;
				}

				if (data) {
					setClients(data);
				}
			} catch (error: any) {
				console.error('Error in clients fetch:', error);
				showError(`Error loading clients: ${error.message}`);
			}
		};

		fetchClients();
	}, [supabase, showError]);

	const handleInputChange = useCallback(
		(
			e: React.ChangeEvent<
				HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
			>,
		) => {
			const { name, value } = e.target;

			// Handle number conversions for specific fields
			if (name === 'client_id') {
				// Convert to integer if not empty, otherwise set to undefined
				const parsedValue = value ? parseInt(value, 10) : undefined;
				setCurrentTemplate(prev => ({
					...prev,
					[name]: parsedValue,
				}));
			} else {
				setCurrentTemplate(prev => ({
					...prev,
					[name]: value,
				}));
			}
		},
		[],
	);

	// Handle rich text editor content changes
	const handleContentChange = useCallback((content: string) => {
		setCurrentTemplate(prev => ({
			...prev,
			content: content,
		}));
	}, []);

	// Handle file selection for attachments
	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				setFileErrors({});
				const newFiles = Array.from(e.target.files);

				// Set the first file for editing
				if (newFiles.length > 0) {
					setEditingFile(newFiles[0]);
				}

				setAttachments(prev => [...prev, ...newFiles]);
			}
		},
		[],
	);

	// Handle file properties change
	const handleFilePropertiesChange = useCallback(
		(
			file: File,
			properties: {
				category: FileCategory;
				width?: number;
				height?: number;
				alt_text?: string;
			},
		) => {
			setFileProperties(prev => ({
				...prev,
				[file.name]: properties,
			}));
			setEditingFile(null);
		},
		[],
	);

	// Remove a file from attachments
	const handleRemoveFile = useCallback(
		(index: number) => {
			setAttachments(prev => {
				const file = prev[index];
				if (file && fileErrors[file.name]) {
					const newErrors = { ...fileErrors };
					delete newErrors[file.name];
					setFileErrors(newErrors);
				}
				return prev.filter((_, i) => i !== index);
			});
		},
		[fileErrors],
	);

	// Remove existing attachment
	const handleRemoveExistingAttachment = useCallback(
		async (id: number) => {
			try {
				const { error } = await supabase
					.from('media')
					.delete()
					.eq('id', id);

				if (error) throw error;

				setCurrentTemplate(prev => ({
					...prev,
					attachments: prev.attachments.filter(att => att.id !== id),
				}));
			} catch (error: any) {
				console.error('Error removing attachment:', error);
				showError(`Failed to remove attachment: ${error.message}`);
			}
		},
		[supabase, showError],
	);

	// Handle PDF template selection
	const handlePDFTemplatesChange = useCallback((pdfTemplateIds: number[]) => {
		// Ensure all IDs are numbers
		const numericIds = pdfTemplateIds.map(id => Number(id));

		setCurrentTemplate(prev => ({
			...prev,
			pdfTemplateIds: numericIds,
		}));
	}, []);

	// Upload files to storage
	const uploadFiles = useCallback(
		async (files: File[]): Promise<UploadedFile[]> => {
			const uploadedFiles: UploadedFile[] = [];
			setUploadProgress(0);

			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileExt = file.name.split('.').pop();
				const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
				const filePath = `template-attachments/${fileName}`;

				// Get any properties set for this file
				const props = fileProperties[file.name] || {
					category: file.type.startsWith('image/')
						? 'image'
						: 'other',
				};

				try {
					const { error: uploadError } = await supabase.storage
						.from('uploads')
						.upload(filePath, file, {
							cacheControl: '3600',
							upsert: false,
						});

					if (uploadError) {
						setFileErrors(prev => ({
							...prev,
							[file.name]: uploadError.message,
						}));
						continue;
					}

					// Get public URL for the file
					const { data: publicUrlData } = supabase.storage
						.from('uploads')
						.getPublicUrl(filePath);

					uploadedFiles.push({
						name: file.name,
						path: filePath,
						size: file.size,
						type: file.type,
						url: publicUrlData.publicUrl,
						category: props.category,
						width: props.width,
						height: props.height,
						alt_text: props.alt_text,
					});

					// Batch update progress every few files to reduce re-renders
					if (i % 3 === 0 || i === files.length - 1) {
						setUploadProgress(
							Math.floor(((i + 1) / files.length) * 100),
						);
					}
				} catch (error: any) {
					console.error('File upload error:', error);
					setFileErrors(prev => ({
						...prev,
						[file.name]: error.message,
					}));
				}
			}

			return uploadedFiles;
		},
		[supabase, fileProperties],
	);

	// Handle form submission
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsSubmitting(true);

			try {
				// Upload new attachments if any
				let uploadedFiles: UploadedFile[] = [];
				if (attachments.length > 0) {
					uploadedFiles = await uploadFiles(attachments);
				}

				// Prepare data for update or insert
				const now = new Date().toISOString();
				const templateData = {
					...currentTemplate,
					updated_at: now,
					...(isNewTemplate && { created_at: now }),
				};

				// Remove properties that don't belong in the templates table
				const {
					attachments: templateAttachments,
					pdfTemplateIds,
					...submitData
				} = templateData;

				// Final preparation of submit data
				let finalSubmitData: any = { ...submitData };

				// For new templates, remove the id field completely
				if (isNewTemplate) {
					delete finalSubmitData.id;
				}

				// Ensure client_id is handled properly
				if (!finalSubmitData.client_id) {
					// Set client_id to null explicitly if it's not valid
					finalSubmitData.client_id = null;
				} else if (typeof finalSubmitData.client_id === 'string') {
					// Convert to number if it's a string
					finalSubmitData.client_id = Number(
						finalSubmitData.client_id,
					);
				}

				// Save template to database
				let result;
				if (isNewTemplate) {
					result = await supabase
						.from('templates')
						.insert([finalSubmitData])
						.select()
						.single();
				} else {
					result = await supabase
						.from('templates')
						.update(finalSubmitData)
						.eq('id', finalSubmitData.id)
						.select()
						.single();
				}

				if (result.error) throw result.error;

				// Handle new template ID for attachments and PDF associations
				const savedTemplateId = result.data.id || 0;

				// Save media attachments
				if (uploadedFiles.length > 0) {
					// Get client_id from the server response, which should always include it
					const clientId = result.data.client_id;

					if (!clientId) {
						console.error('Client ID missing from response data');
						throw new Error(
							'Client ID is required for uploading media but was not returned from server',
						);
					}

					const mediaItems = uploadedFiles.map(file => ({
						template_id: savedTemplateId,
						client_id: clientId,
						file_name: file.name,
						file_url: file.url,
						mime_type: file.type,
						file_size: file.size,
						width: file.width,
						height: file.height,
						alt_text: file.alt_text,
					}));

					const { error: mediaError } = await supabase
						.from('media')
						.insert(mediaItems);

					if (mediaError) throw mediaError;
				}

				// Save PDF template associations using the correct table structure
				if (currentTemplate.pdfTemplateIds.length > 0) {
					// Delete existing associations first
					if (!isNewTemplate) {
						const { error: deleteError } = await supabase
							.from('pdf_template_media')
							.delete()
							.eq('template_id', savedTemplateId);

						if (deleteError) {
							console.error(
								'Error deleting existing PDF template associations:',
								deleteError,
							);
						}
					}

					// Add new associations using pdf_template_media table
					const pdfAssociations = currentTemplate.pdfTemplateIds.map(
						(pdfTemplateId, index) => ({
							template_id: savedTemplateId,
							pdf_template_id: pdfTemplateId,
							placeholder_name: `template_${index + 1}`,
							description: `PDF Template ${index + 1}`,
						}),
					);

					const { error: insertError } = await supabase
						.from('pdf_template_media')
						.insert(pdfAssociations);

					if (insertError) {
						console.error(
							'Error inserting PDF template associations:',
							insertError,
						);
						// If this fails, don't throw an error - just log it
					}
				}

				// Success handling
				onSuccess();

				// Redirect to the templates list or template detail page
				if (isNewTemplate) {
					router.push(`/email/templates/${savedTemplateId}`);
				} else {
					router.refresh();
				}
			} catch (error: any) {
				console.error('Error saving template:', error);
				showError(`Failed to save template: ${error.message}`);
			} finally {
				setIsSubmitting(false);
			}
		},
		[
			attachments,
			currentTemplate,
			isNewTemplate,
			onSuccess,
			router,
			showError,
			supabase,
			uploadFiles,
		],
	);

	// Memoize attachment rendering to prevent re-renders
	const existingAttachmentsSection = useMemo(() => {
		if (
			!currentTemplate.attachments ||
			currentTemplate.attachments.length === 0
		) {
			return null;
		}

		return (
			<div className="mt-2">
				<h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
					Current Attachments:
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					{currentTemplate.attachments.map(attachment => (
						<Attachment
							key={attachment.id}
							file={attachment}
							onRemove={() =>
								handleRemoveExistingAttachment(attachment.id)
							}
							isExisting={true}
						/>
					))}
				</div>
			</div>
		);
	}, [currentTemplate.attachments, handleRemoveExistingAttachment]);

	// Memoize new attachments rendering
	const newAttachmentsSection = useMemo(() => {
		if (attachments.length === 0) {
			return null;
		}

		return (
			<div className="mt-2">
				<h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
					New Attachments:
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					{attachments.map((file, index) => (
						<Attachment
							key={index}
							file={file}
							onRemove={() => handleRemoveFile(index)}
							isExisting={false}
							error={fileErrors[file.name]}
						/>
					))}
				</div>
			</div>
		);
	}, [attachments, fileErrors, handleRemoveFile]);

	return (
		<>
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-6 p-6 rounded border border-gray-300 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700"
			>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField label="Template Name" htmlFor="name">
						<Input
							id="name"
							type="text"
							name="name"
							placeholder="Enter template name"
							value={currentTemplate.name || ''}
							onChange={handleInputChange}
							required
						/>
					</FormField>

					<FormField label="Client" htmlFor="client_id">
						<select
							id="client_id"
							name="client_id"
							value={currentTemplate.client_id?.toString() || ''}
							onChange={handleInputChange}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Select a client</option>
							{clients.map(client => (
								<option key={client.id} value={client.id}>
									{client.name}
								</option>
							))}
						</select>
					</FormField>
				</div>

				<div className="border rounded-lg overflow-hidden shadow-sm dark:border-gray-700">
					<div className="bg-gray-50 p-4 border-b dark:bg-gray-700 dark:border-gray-600">
						<h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
							Email Details
						</h3>

						<div className="space-y-3">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<FormField
									label="From Name"
									htmlFor="from_name"
								>
									<Input
										id="from_name"
										type="text"
										name="from_name"
										placeholder="Enter sender name"
										value={currentTemplate.from_name || ''}
										onChange={handleInputChange}
									/>
								</FormField>

								<FormField
									label="From Email Address"
									htmlFor="from_email"
								>
									<Input
										id="from_email"
										type="email"
										name="from_email"
										placeholder="Enter sender email"
										value={currentTemplate.from_email || ''}
										onChange={handleInputChange}
									/>
								</FormField>
							</div>

							<FormField
								label="Reply-To Email Address"
								htmlFor="reply_to_email"
							>
								<Input
									id="reply_to_email"
									type="email"
									name="reply_to_email"
									placeholder="Enter reply-to email"
									value={currentTemplate.reply_to_email || ''}
									onChange={handleInputChange}
								/>
							</FormField>

							<FormField
								label="CC Recipients"
								htmlFor="cc_recipients"
							>
								<Input
									id="cc_recipients"
									type="text"
									name="cc_recipients"
									placeholder="Comma-separated CC recipients"
									value={currentTemplate.cc_recipients || ''}
									onChange={handleInputChange}
								/>
							</FormField>

							<FormField
								label="BCC Recipients"
								htmlFor="bcc_recipients"
							>
								<Input
									id="bcc_recipients"
									type="text"
									name="bcc_recipients"
									placeholder="Comma-separated BCC recipients"
									value={currentTemplate.bcc_recipients || ''}
									onChange={handleInputChange}
								/>
							</FormField>

							<FormField label="Subject" htmlFor="subject">
								<Input
									id="subject"
									type="text"
									name="subject"
									placeholder="Enter email subject"
									value={currentTemplate.subject || ''}
									onChange={handleInputChange}
								/>
							</FormField>
						</div>
					</div>

					<div className="p-4">
						<FormField label="Email Content" htmlFor="content">
							<EditorWrapper
								value={currentTemplate.content || ''}
								onChange={handleContentChange}
								placeholder="Enter complete email content (introduction, main content, and signature)"
								variables={TEMPLATE_VARIABLES}
							/>
						</FormField>

						<FormField
							label="Attachments"
							htmlFor="attachments"
							className="mt-4"
						>
							<div className="grid grid-cols-1 gap-4">
								<Input
									id="attachments"
									type="file"
									multiple
									onChange={handleFileChange}
								/>

								{uploadProgress > 0 && (
									<div className="w-full bg-gray-200 rounded h-2.5 my-2 dark:bg-gray-700">
										<div
											className="bg-blue-600 h-2.5 rounded"
											style={{
												width: `${uploadProgress}%`,
											}}
										></div>
										<p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
											Uploading: {uploadProgress}%
										</p>
									</div>
								)}

								{existingAttachmentsSection}
								{newAttachmentsSection}
							</div>
						</FormField>

						<FormField
							label="Templated PDF Attachment"
							htmlFor="pdf_templates"
							className="mt-4"
						>
							<PdfTemplateSelector
								selectedTemplateIds={
									currentTemplate.pdfTemplateIds || []
								}
								onPDFTemplatesChange={handlePDFTemplatesChange}
							/>
						</FormField>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField label="Date Created" htmlFor="created_at">
						<Input
							id="created_at"
							type="text"
							value={
								currentTemplate.created_at
									? new Date(
											currentTemplate.created_at,
										).toLocaleString('en-CA')
									: new Date().toLocaleString('en-CA')
							}
							readOnly
							className="opacity-70"
						/>
					</FormField>
					<FormField label="Last Updated" htmlFor="updated_at">
						<Input
							id="updated_at"
							type="text"
							value={
								currentTemplate.updated_at
									? new Date(
											currentTemplate.updated_at,
										).toLocaleString('en-CA')
									: new Date().toLocaleString('en-CA')
							}
							readOnly
							className="opacity-70"
						/>
					</FormField>
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					className={
						isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
					}
				>
					{isSubmitting ? 'Saving...' : 'Save Template'}
				</Button>
			</form>

			{editingFile && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="max-w-lg w-full mx-4">
						<AttachmentEditor
							file={editingFile}
							onChange={props =>
								handleFilePropertiesChange(editingFile, props)
							}
							onClose={() => setEditingFile(null)}
						/>
					</div>
				</div>
			)}
		</>
	);
}
