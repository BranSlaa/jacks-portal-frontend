import React from 'react';

interface LoadingSpinnerProps {
	size?: 'sm' | 'md' | 'lg';
	className?: string;
}

export default function LoadingSpinner({
	size = 'md',
	className = '',
}: LoadingSpinnerProps) {
	const sizeClass = {
		sm: 'h-6 w-6 border-2',
		md: 'h-12 w-12 border-2',
		lg: 'h-16 w-16 border-4',
	};

	return (
		<div className="flex justify-center items-center">
			<div
				className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClass[size]} ${className}`}
			/>
		</div>
	);
}
