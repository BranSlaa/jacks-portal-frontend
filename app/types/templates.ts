export interface Template {
	id: string;
	name: string;
	subject: string;
	created_at: string;
	updated_at: string;
	html_content: string;
	text_content: string;
	attachments?: any[];
	pdfTemplateIds?: any[];
}
