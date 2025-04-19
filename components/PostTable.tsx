'use client';

import React, { useState, useMemo } from 'react';
import '@/styles/_postTable.scss';
import { Column, SortDirection, PostTableProps } from '../app/types/postTable';

function PostTable<T>({
	data,
	columns,
	onEdit,
	onDuplicate,
	onDelete,
}: PostTableProps<T>) {
	const [sortKey, setSortKey] = useState<string | null>('updated_at');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

	if (!data || data.length === 0) {
		return (
			<p className="text-gray-500 dark:text-gray-400">
				No data available.
			</p>
		);
	}

	const numHeaders = columns.length;

	// Sort the data based on the current sort key and direction
	const sortedData = useMemo(() => {
		if (!sortKey) return data;

		return [...data].sort((a, b) => {
			const aValue = a[sortKey as keyof T];
			const bValue = b[sortKey as keyof T];

			// Handle different types of values
			if (aValue === null || aValue === undefined)
				return sortDirection === 'asc' ? -1 : 1;
			if (bValue === null || bValue === undefined)
				return sortDirection === 'asc' ? 1 : -1;

			// Compare based on type
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				// For UUID strings specifically
				if (
					sortKey === 'id' &&
					aValue.includes('-') &&
					bValue.includes('-')
				) {
					return sortDirection === 'asc'
						? aValue.localeCompare(bValue)
						: bValue.localeCompare(aValue);
				}

				// For dates stored as strings
				if (
					(sortKey === 'created_at' || sortKey === 'updated_at') &&
					!isNaN(Date.parse(aValue)) &&
					!isNaN(Date.parse(bValue))
				) {
					const dateA = new Date(aValue);
					const dateB = new Date(bValue);
					return sortDirection === 'asc'
						? dateA.getTime() - dateB.getTime()
						: dateB.getTime() - dateA.getTime();
				}

				// Default string comparison
				return sortDirection === 'asc'
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			}

			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return sortDirection === 'asc'
					? aValue - bValue
					: bValue - aValue;
			}

			// For dates (assuming they're stored as strings)
			if (
				(aValue instanceof Date && bValue instanceof Date) ||
				(typeof aValue === 'string' &&
					typeof bValue === 'string' &&
					!isNaN(Date.parse(aValue)) &&
					!isNaN(Date.parse(bValue)))
			) {
				const dateA =
					aValue instanceof Date ? aValue : new Date(aValue);
				const dateB =
					bValue instanceof Date ? bValue : new Date(bValue);
				return sortDirection === 'asc'
					? dateA.getTime() - dateB.getTime()
					: dateB.getTime() - dateA.getTime();
			}

			// Default comparison for other types
			return sortDirection === 'asc'
				? String(aValue).localeCompare(String(bValue))
				: String(bValue).localeCompare(String(aValue));
		});
	}, [data, sortKey, sortDirection]);

	// Handle column header click for sorting
	const handleHeaderClick = (column: Column<T>) => {
		// Skip if the column is not sortable
		if (column.sortable === false) return;

		if (sortKey === column.key) {
			// Toggle direction if already sorting by this column
			setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
		} else {
			// Set new sort column and default to ascending
			setSortKey(column.key);
			setSortDirection('asc');
		}
	};

	// Helper function to render cell content
	const renderCellContent = (column: Column<T>, item: T) => {
		if (column.render) {
			return column.render(item);
		}

		const value = item[column.key as keyof T];

		// Default rendering based on value type
		if (typeof value === 'boolean') {
			return value ? 'Yes' : 'No';
		}
		if (typeof value === 'object' && value !== null) {
			return JSON.stringify(value);
		}

		// Convert to string to ensure it's a valid React node
		return String(value ?? '');
	};

	// Helper function to render action buttons
	const renderActionButtons = (item: T) => {
		if (!(onEdit || onDuplicate || onDelete)) return null;

		return (
			<div className="flex gap-2 flex-wrap">
				{onEdit && (
					<button
						onClick={e => {
							e.stopPropagation();
							onEdit(item);
						}}
						className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
					>
						Edit
					</button>
				)}
				{onDuplicate && (
					<button
						onClick={e => {
							e.stopPropagation();
							onDuplicate(item);
						}}
						className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
					>
						Duplicate
					</button>
				)}
				{onDelete && (
					<button
						onClick={e => {
							e.stopPropagation();
							onDelete(item);
						}}
						className="text-sm text-red-600 dark:text-red-500 hover:underline font-medium"
					>
						Delete
					</button>
				)}
			</div>
		);
	};

	// Helper function to render sort indicator
	const renderSortIndicator = (column: Column<T>) => {
		if (sortKey !== column.key) return null;

		return (
			<span className="ml-1">
				{sortDirection === 'asc' ? (
					<svg
						className="w-3 h-3 inline-block"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M5 15l7-7 7 7"
						></path>
					</svg>
				) : (
					<svg
						className="w-3 h-3 inline-block"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M19 9l-7 7-7-7"
						></path>
					</svg>
				)}
			</span>
		);
	};

	return (
		<div className="shadow-md rounded-lg overflow-x-auto bg-white dark:bg-gray-800">
			{/* Main grid container */}
			<div
				className="post-table-grid"
				style={
					{
						'--data-length': data.length,
						'--num-headers': numHeaders,
					} as React.CSSProperties
				}
			>
				{/* Headers Row */}
				<div className="post-table-grid-header grid grid-cols-subgrid grid-rows-subgrid sticky left-0 md:top-0 z-10 bg-gray-100 dark:bg-gray-700">
					{columns.map(column => (
						<div
							key={`header-${column.key}`}
							className={`px-4 py-3 max-w-[300px] border-b border-r border-gray-200 dark:border-gray-600 font-semibold text-sm text-gray-700 dark:text-gray-200 capitalize whitespace-nowrap ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''}`}
							onClick={() => handleHeaderClick(column)}
						>
							{column.header}
							{renderSortIndicator(column)}
						</div>
					))}
				</div>

				{/* Data Rows */}
				{sortedData.map((item, rowIndex) => (
					<div
						key={`row-${rowIndex}`}
						className="post-table-grid-data-row grid grid-cols-subgrid grid-rows-subgrid"
						style={
							{
								'--row-grid-column': `${rowIndex + 2} / ${rowIndex + 3}`,
								'--row-grid-row': `${rowIndex + 2} / ${rowIndex + 3}`,
							} as React.CSSProperties
						}
					>
						{columns.map(column => (
							<div
								key={`${rowIndex}-${column.key}`}
								className="group relative px-4 py-3 max-w-[300px] border-b border-r border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-300 truncate hover:overflow-visible hover:whitespace-normal"
							>
								{renderCellContent(column, item)}
								{column.actions && (
									<div className="mt-2">
										{renderActionButtons(item)}
									</div>
								)}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export default PostTable;
