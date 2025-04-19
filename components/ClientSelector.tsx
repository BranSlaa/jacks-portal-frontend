'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface Client {
	id: number;
	name: string;
}

interface ClientSelectorProps {
	value: number;
	onChange: (value: number | null) => void;
}

export default function ClientSelector({
	value,
	onChange,
}: ClientSelectorProps) {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	useEffect(() => {
		const fetchClients = async () => {
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
				console.error('Error:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchClients();
	}, [supabase]);

	const handleValueChange = (value: string) => {
		onChange(value ? parseInt(value) : null);
	};

	return (
		<Select
			value={value?.toString() || ''}
			onValueChange={handleValueChange}
		>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="Select a client" />
			</SelectTrigger>
			<SelectContent>
				{loading ? (
					<SelectItem value="loading" disabled>
						Loading...
					</SelectItem>
				) : (
					clients.map(client => (
						<SelectItem
							key={client.id}
							value={client.id.toString()}
						>
							{client.name}
						</SelectItem>
					))
				)}
			</SelectContent>
		</Select>
	);
}
