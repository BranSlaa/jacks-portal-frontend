export interface PdfTemplate {
	id: number;
	name: string;
	description: string | null;
	client_id: number;
	clients: {
		name: string;
	};
	created_at: string;
	updated_at: string;
}

export interface FormattedTemplate extends PdfTemplate {
	client_name: string;
	created_at_formatted: string;
	updated_at_formatted: string;
}

export type PdfTemplateFormProps = {
	id?: number;
	initialData?: {
		name: string;
		description: string;
		html_content: string;
		css_content: string;
		client_id: number;
	};
};

export type Variable = {
	label: string;
	value: string;
};

export type VariableCategory = {
	category: string;
	variables: Variable[];
};
