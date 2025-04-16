export interface Column<T> {
	key: string;
	header: string;
	actions?: boolean;
	render?: (item: T) => React.ReactNode;
	isActionColumn?: boolean;
	sortable?: boolean;
}

export interface PostTableProps<T> {
	data: T[];
	columns: Column<T>[];
	onEdit?: (item: T) => void;
	onDuplicate?: (item: T) => void;
	onDelete?: (item: T) => void;
}

export type SortDirection = 'asc' | 'desc';
