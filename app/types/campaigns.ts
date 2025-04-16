export interface Campaign {
	id: string;
	name: string;
	start_date?: string;
	end_date?: string;
	status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived' | 'in-progress' | string;
	client_id?: string;
	template_id?: string;
	sent_today_count?: number;
	max_emails_per_day?: number;
	days_of_week?: string[];
	completed_at?: string;
	created_at?: string;
	updated_at?: string;
}
