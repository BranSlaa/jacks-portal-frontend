import { createClient } from '@/utils/supabase/client';

describe('Campaign Service Integration Tests', () => {
	const supabase = createClient();
	let testCampaignId: string | null = null;

	// Clean up after all tests
	afterAll(async () => {
		if (testCampaignId) {
			await supabase.from('campaigns').delete().eq('id', testCampaignId);
		}
	});

	describe('Campaign CRUD Operations', () => {
		it('should create a new campaign', async () => {
			const newCampaign = {
				name: 'Test Campaign',
				description: 'This is a test campaign',
				start_date: new Date().toISOString(),
				status: 'active',
			};

			const { data, error } = await supabase
				.from('campaigns')
				.insert(newCampaign)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).toBeDefined();
			expect(data.name).toBe(newCampaign.name);
			expect(data.description).toBe(newCampaign.description);

			// Store the ID for cleanup and subsequent tests
			testCampaignId = data.id;
		});

		it('should retrieve the created campaign', async () => {
			const { data, error } = await supabase
				.from('campaigns')
				.select()
				.eq('id', testCampaignId)
				.single();

			expect(error).toBeNull();
			expect(data).toBeDefined();
			expect(data.id).toBe(testCampaignId);
		});

		it('should update the campaign', async () => {
			const updatedData = {
				name: 'Updated Test Campaign',
				description: 'This is an updated test campaign',
				status: 'inactive',
			};

			const { data, error } = await supabase
				.from('campaigns')
				.update(updatedData)
				.eq('id', testCampaignId)
				.select()
				.single();

			expect(error).toBeNull();
			expect(data).toBeDefined();
			expect(data.name).toBe(updatedData.name);
			expect(data.description).toBe(updatedData.description);
			expect(data.status).toBe(updatedData.status);
		});

		it('should delete the campaign', async () => {
			const { error } = await supabase
				.from('campaigns')
				.delete()
				.eq('id', testCampaignId);

			expect(error).toBeNull();

			// Verify the campaign was deleted
			const { data } = await supabase
				.from('campaigns')
				.select()
				.eq('id', testCampaignId)
				.single();

			expect(data).toBeNull();
			testCampaignId = null;
		});
	});
});
