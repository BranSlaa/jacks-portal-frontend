'use client';

import React from 'react';

type TabsProps = {
	defaultValue: string;
	onValueChange: (value: string) => void;
	children: React.ReactNode;
};

type TabsListProps = {
	className?: string;
	children: React.ReactNode;
};

type TabsTriggerProps = {
	value: string;
	children: React.ReactNode;
};

type TabsContentProps = {
	value: string;
	className?: string;
	children: React.ReactNode;
};

const TabsContext = React.createContext<{
	value: string;
	onChange: (value: string) => void;
}>({
	value: '',
	onChange: () => {},
});

export function Tabs({ defaultValue, onValueChange, children }: TabsProps) {
	const [value, setValue] = React.useState(defaultValue);

	const handleChange = (newValue: string) => {
		setValue(newValue);
		onValueChange(newValue);
	};

	return (
		<TabsContext.Provider value={{ value, onChange: handleChange }}>
			<div className="w-full">{children}</div>
		</TabsContext.Provider>
	);
}

export function TabsList({ className = '', children }: TabsListProps) {
	return (
		<div
			className={`flex space-x-1 rounded-md bg-gray-100 p-1 ${className}`}
		>
			{children}
		</div>
	);
}

export function TabsTrigger({ value, children }: TabsTriggerProps) {
	const { value: selectedValue, onChange } = React.useContext(TabsContext);
	const isSelected = selectedValue === value;

	return (
		<button
			type="button"
			className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
				isSelected
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-500 hover:text-gray-900'
			}`}
			onClick={() => onChange(value)}
		>
			{children}
		</button>
	);
}

export function TabsContent({
	value,
	className = '',
	children,
}: TabsContentProps) {
	const { value: selectedValue } = React.useContext(TabsContext);

	if (selectedValue !== value) {
		return null;
	}

	return <div className={className}>{children}</div>;
}
