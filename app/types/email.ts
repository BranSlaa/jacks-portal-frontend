// Email event types
export interface EmailEvent {
	id: number;
	sent_email_id: number;
	event_type: string;
	event_timestamp: string;
	clicked_url?: string;
	contact_email?: string;
	contact_name?: string;
}

// Contact types
export interface ContactData {
	id: number;
	first_name: string | null;
	last_name: string | null;
	email: string;
}

export interface ContactStatus extends ContactData {
	processing_status: string;
	sent_at?: string;
	delivered_at?: string;
	bounced_at?: string;
	status?: string;
}

// Sent email types
export interface SentEmail {
	id: number;
	campaign_id: number;
	contact_id: number;
	status: string;
	sent_at?: string;
	delivered_at?: string;
	bounced_at?: string;
	template_id?: number;
	created_at: string;
}

// Email stats types
export interface EmailEventStats {
	opens: number;
	clicks: number;
	uniqueOpens: number;
	uniqueClicks: number;
	openRate: number;
	clickRate: number;
	totalSent: number;
}

export interface ContactStats {
	total: number;
	pending: number;
	processing: number;
	delivered: number;
	failed: number;
	excluded: number;
} 