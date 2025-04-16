import React from 'react';
import { DAYS_OF_WEEK } from '@/app/constants';

interface DayPickerProps {
	selectedDays: string[];
	onChange: (days: string[]) => void;
	className?: string;
}

export default function DayPicker({
	selectedDays,
	onChange,
	className = '',
}: DayPickerProps) {
	const toggleDay = (dayValue: string) => {
		if (selectedDays.includes(dayValue)) {
			onChange(selectedDays.filter(day => day !== dayValue));
		} else {
			onChange([...selectedDays, dayValue]);
		}
	};

	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{DAYS_OF_WEEK.map(day => (
				<button
					key={day.value}
					type="button"
					className={`px-3 py-1 rounded-md text-sm ${
						selectedDays.includes(day.value)
							? 'bg-blue-500 text-white'
							: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
					}`}
					onClick={() => toggleDay(day.value)}
				>
					{day.label}
				</button>
			))}
		</div>
	);
}
