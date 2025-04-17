import React, { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
	label: string;
	htmlFor?: string;
	error?: string;
	className?: string;
	children: ReactNode;
	labelClassName?: string;
}

export function FormField({
	label,
	htmlFor,
	error,
	className = '',
	labelClassName = 'mb-2 block',
	children,
}: FormFieldProps) {
	return (
		<div className={`mb-4 ${className}`}>
			<Label htmlFor={htmlFor} className={`${labelClassName}`}>
				{label}
			</Label>
			{children}
			{error && (
				<p className="mt-1 text-sm text-red-600 dark:text-red-400">
					{error}
				</p>
			)}
		</div>
	);
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: string;
}

export function Input({ className = '', error, ...props }: InputProps) {
	return (
		<input
			className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${className}`}
			{...props}
		/>
	);
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
	options: { value: string; label: string }[];
	error?: string;
	placeholder?: string;
}

export function Select({
	className = '',
	options,
	error,
	placeholder,
	...props
}: SelectProps) {
	return (
		<select
			className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${className}`}
			{...props}
		>
			{placeholder && <option value="">{placeholder}</option>}
			{options.map(option => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	);
}

export function Button({
	className = '',
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button className={`px-4 py-2 rounded-md ${className}`} {...props}>
			{children}
		</button>
	);
}

export function PrimaryButton({
	className = '',
	disabled = false,
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<Button
			className={`bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${className}`}
			disabled={disabled}
			{...props}
		>
			{children}
		</Button>
	);
}

export function SecondaryButton({
	className = '',
	children,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<Button
			className={`border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${className}`}
			{...props}
		>
			{children}
		</Button>
	);
}
