import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
	// Use NEXT_PUBLIC environment variables for client components
	const supabaseUrl = 
		process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';

	const supabaseKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

	return createBrowserClient(supabaseUrl, supabaseKey);
};
