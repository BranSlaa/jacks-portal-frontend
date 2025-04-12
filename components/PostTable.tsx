import React from 'react';
import '../app/styles/_postTable.scss';

interface Column<T> {
	key: string;
	header: string;
	actions?: boolean;
	render?: (item: T) => React.ReactNode;
	isActionColumn?: boolean;
}

interface PostTableProps<T> {
	data: T[];
	columns: Column<T>[];
	onEdit?: (item: T) => void;
	onDuplicate?: (item: T) => void;
	onDelete?: (item: T) => void;
}

function PostTable<T>({
	data,
	columns,
	onEdit,
	onDuplicate,
	onDelete,
}: PostTableProps<T>) {
	if (!data || data.length === 0) {
		return (
			<p className="text-gray-500 dark:text-gray-400 p-4">
				No data available.
			</p>
		);
	}

	const numHeaders = columns.length;
	const nameColumn = columns.find(
		col =>
			col.key.toLowerCase() === 'name' ||
			col.header.toLowerCase() === 'name',
	);

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
						className="text-lg text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
						className="text-lg text-green-600 dark:text-green-400 hover:underline font-medium"
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
						className="text-lg text-red-600 dark:text-red-500 hover:underline font-medium"
					>
						Delete
					</button>
				)}
			</div>
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
							className="px-4 py-3 border-b border-r border-gray-200 dark:border-gray-600 font-semibold text-sm text-gray-700 dark:text-gray-200 capitalize whitespace-nowrap"
						>
							{column.header}
						</div>
					))}
				</div>

				{/* Data Rows */}
				{data.map((item, rowIndex) => (
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
								className="group relative px-4 py-3 border-b border-r border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-300 truncate hover:overflow-visible hover:whitespace-normal flex flex-col justify-between"
							>
								{renderCellContent(column, item)}
								{column.actions && renderActionButtons(item)}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export default PostTable;
