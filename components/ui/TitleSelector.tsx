import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

interface TitleSelectorProps {
	contactId: number;
	currentTitle: string;
	onUpdate?: (newTitle: string) => void;
}

export default function TitleSelector({
	contactId,
	currentTitle = '',
	onUpdate,
}: TitleSelectorProps) {
	const titles = ['Mr', 'Mrs', 'Ms', 'Dr', ''];
	const [isOpen, setIsOpen] = useState(false);
	const supabase = createClient();
	const { showSuccess, showError } = useNotifications();

	const handleTitleUpdate = async (title: string) => {
		try {
			const { error } = await supabase
				.from('contacts')
				.update({ title })
				.eq('id', contactId);

			if (error) throw error;

			if (onUpdate) {
				onUpdate(title);
			}

			showSuccess('Title updated successfully');
		} catch (error: any) {
			console.error('Error updating title:', error);
			showError(`Failed to update title: ${error.message}`);
		}
	};

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full text-left flex items-center justify-between text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
			>
				{currentTitle || 'None'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-4 w-4 ml-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute z-10 mt-1 w-24 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden">
					{titles.map(title => (
						<button
							key={title}
							className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							onClick={() => {
								handleTitleUpdate(title);
								setIsOpen(false);
							}}
						>
							{title || 'None'}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
