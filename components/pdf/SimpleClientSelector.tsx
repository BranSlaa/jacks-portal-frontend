'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type ClientSelectorProps = {
	value: number;
	onChange: (value: number | null) => void;
};

type Client = {
	id: number;
	name: string;
};

export default function ClientSelector({
	value,
	onChange,
}: ClientSelectorProps) {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	useEffect(() => {
		async function fetchClients() {
			try {
				const { data, error } = await supabase
					.from('clients')
					.select('id, name')
					.order('name');

				if (error) {
					console.error('Error fetching clients:', error);
					return;
				}

				setClients(data || []);
			} catch (error) {
				console.error('Error fetching clients:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchClients();
	}, [supabase]);

	return (
		<select
			value={value || ''}
			onChange={e =>
				onChange(e.target.value ? Number(e.target.value) : null)
			}
			className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={loading}
		>
			<option value="">Select a client</option>
			{clients.map(client => (
				<option key={client.id} value={client.id}>
					{client.name}
				</option>
			))}
		</select>
	);
}
