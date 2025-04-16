export interface Contact {
	id: string;
	client_id: string;
	title?: string;
	first_name: string;
	last_name: string;
	email: string;
	instagram_handle?: string;
	company?: string;
	job_title?: string;
	website?: string;
	phone_number?: string;
	created_at: string;
	updated_at: string;
	client_name?: string;
	contact_lists?: Array<{id: string, name: string}>;
}