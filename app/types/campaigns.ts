export interface Campaign {
	id: number;
	name: string;
	start_date?: string;
	end_date?: string;
	status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived' | string;
	client_id?: number;
	template_id?: number;
	sent_today_count?: number;
	max_emails_per_day?: number;
	days_of_week?: string[];
	completed_at?: string;
	created_at?: string;
	updated_at?: string;
}
