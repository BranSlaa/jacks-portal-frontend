import { Contact } from './contacts';

export interface ContactList {
	id: number;
	client_id: number;
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
	tags?: any;
	contact_count?: number;
}

export interface ContactListDetailsProps {
	contactList: ContactList;
	clientName: string;
}

export interface ContactListContactsProps {
	contacts: Contact[];
	contactListId: number;
}

export interface ContactListFormProps {
	contactListId?: number;
	isEdit?: boolean;
}