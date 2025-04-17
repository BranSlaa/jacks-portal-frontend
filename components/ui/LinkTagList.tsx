import Link from 'next/link';
import React from 'react';

type ItemWithIdAndName = {
	id: string;
	name: string;
	[key: string]: any; // Allow for other properties
};

export interface LinkTagListProps<T extends ItemWithIdAndName> {
	items: T[];
	emptyMessage?: string;
	basePath: string;
	className?: string;
	tagClassName?: string;
	emptyClassName?: string;
	renderTag?: (item: T) => React.ReactNode;
}

/**
 * A component for displaying a list of items as linked tags
 * @param items - Array of items to display as tags
 * @param emptyMessage - Message to display when there are no items
 * @param basePath - Base path for the links (e.g., '/email/contact-lists/')
 * @param className - Additional CSS classes for the container
 * @param tagClassName - Additional CSS classes for each tag
 * @param emptyClassName - Additional CSS classes for the empty message
 * @param renderTag - Optional custom render function for each tag
 */
export function LinkTagList<T extends ItemWithIdAndName>({
	items,
	emptyMessage = 'None',
	basePath,
	className = '',
	tagClassName = '',
	emptyClassName = '',
	renderTag,
}: LinkTagListProps<T>) {
	// Default tag styling
	const defaultTagClass =
		'inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200';
	const tagClass = tagClassName || defaultTagClass;

	// Default empty message styling
	const defaultEmptyClass = 'text-gray-500';
	const emptyClass = emptyClassName || defaultEmptyClass;

	if (items.length === 0) {
		return <p className={emptyClass}>{emptyMessage}</p>;
	}

	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{items.map(item =>
				renderTag ? (
					renderTag(item)
				) : (
					<Link
						key={item.id}
						href={`${basePath}${item.id}`}
						className={tagClass}
					>
						{item.name}
					</Link>
				),
			)}
		</div>
	);
}
