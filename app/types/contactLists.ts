export interface ContactList {
	id: string;
	client_id: string;
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
	tags?: any;
	status?: string;
	contact_count?: number;
}