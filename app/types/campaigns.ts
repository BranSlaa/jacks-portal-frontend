export interface Campaign {
	id: string;
	name: string;
	start_date?: string;
	end_date?: string;
	status?:
		| 'draft'
		| 'active'
		| 'in-progress'
		| 'completed'
		| 'archived'
		| string;
	client_id: string;
	template_id?: string;
	created_at?: string;
	updated_at?: string;
}
