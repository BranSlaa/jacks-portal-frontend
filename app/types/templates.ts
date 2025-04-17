import { FileCategory } from './templateEditor';

export interface Template {
	id: number;
	name: string;
	from_name: string;
	from_email: string;
	reply_to_email: string;
	cc_recipients?: string;
	bcc_recipients?: string;
	subject: string;
	content: string;
	client_id?: number;
	attachments: Array<ExistingAttachmentProps>;
	pdfTemplateIds: number[];
	created_at: string;
	updated_at: string;
}

export interface ExistingAttachmentProps {
	id: number;
	file_name?: string;
	file_size?: number;
	file_type?: string;
	file_url?: string;
	mime_type?: string;
	name?: string;
	url?: string;
	size?: number;
	type?: string;
	path?: string;
	template_id?: number;
}

export interface AttachmentProps {
	file: File | ExistingAttachmentProps;
	onRemove: () => void;
	isExisting: boolean;
	error?: string;
}

export interface AttachmentEditorProps {
	file: File;
	onChange: (properties: {
		category: FileCategory;
		width?: number;
		height?: number;
		alt_text?: string;
	}) => void;
	onClose: () => void;
}

export interface PdfTemplate {
	id: number;
	name: string;
	description?: string;
	created_at: string;
}

export interface PdfTemplateSelectorProps {
	selectedTemplateIds: number[];
	onPDFTemplatesChange: (templateIds: number[]) => void;
}

export interface TemplateFormProps {
	template: Template;
	isNewTemplate: boolean;
	onSuccess: () => void;
}