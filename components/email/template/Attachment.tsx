'use client';

import { useState } from 'react';
import {
	AttachmentProps,
	ExistingAttachmentProps,
} from '@/app/types/templates';

export default function Attachment({
	file,
	onRemove,
	isExisting,
	error,
}: AttachmentProps) {
	const [isConfirming, setIsConfirming] = useState(false);

	// Format file size in human-readable format
	const formatFileSize = (bytes?: number): string => {
		if (!bytes) return 'Unknown size';

		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(1)} ${units[unitIndex]}`;
	};

	// Get file icon based on type
	const getFileIcon = (type?: string): string => {
		if (!type) return '📄';

		if (type.includes('image')) return '🖼️';
		if (type.includes('pdf')) return '📑';
		if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
		if (type.includes('word') || type.includes('document')) return '📝';
		if (type.includes('presentation') || type.includes('powerpoint'))
			return '📑';
		if (type.includes('text')) return '📄';
		if (type.includes('zip') || type.includes('archive')) return '🗜️';

		return '📄';
	};

	// Handle remove button click with confirmation
	const handleRemove = () => {
		if (!isConfirming) {
			setIsConfirming(true);
			return;
		}

		onRemove();
		setIsConfirming(false);
	};

	// Handle cancel confirmation
	const handleCancelConfirm = () => {
		setIsConfirming(false);
	};

	// Get file properties based on whether it's an existing file or new file
	const fileName = isExisting
		? (file as ExistingAttachmentProps).file_name ||
			(file as ExistingAttachmentProps).name ||
			'Unknown file'
		: (file as File).name;

	const fileSize = isExisting
		? (file as ExistingAttachmentProps).file_size ||
			(file as ExistingAttachmentProps).size
		: (file as File).size;

	const fileType = isExisting
		? (file as ExistingAttachmentProps).mime_type ||
			(file as ExistingAttachmentProps).type
		: (file as File).type;

	const fileUrl = isExisting
		? (file as ExistingAttachmentProps).file_url ||
			(file as ExistingAttachmentProps).url
		: undefined;

	return (
		<div
			className={`p-3 rounded-md ${error ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600'}`}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3 overflow-hidden">
					{fileType?.includes('image') && fileUrl ? (
						<img
							src={fileUrl}
							alt={fileName || 'Image'}
							className="w-12 h-12 object-cover rounded"
						/>
					) : (
						<span className="text-xl" aria-hidden="true">
							{getFileIcon(fileType)}
						</span>
					)}
					<div className="overflow-hidden">
						<p className="font-medium text-sm truncate text-gray-700 dark:text-gray-200">
							{fileName}
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							{formatFileSize(fileSize)}
						</p>
					</div>
				</div>

				<div className="flex items-center">
					{fileUrl && (
						<a
							href={fileUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:text-blue-800 p-1 rounded mr-1 dark:text-blue-400 dark:hover:text-blue-300"
							title="View attachment"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								className="w-5 h-5"
							>
								<path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
								<path
									fillRule="evenodd"
									d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
									clipRule="evenodd"
								/>
							</svg>
						</a>
					)}

					{isConfirming ? (
						<>
							<button
								type="button"
								onClick={handleRemove}
								className="text-red-600 hover:text-red-800 p-1 rounded dark:text-red-400 dark:hover:text-red-300"
								title="Confirm removal"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className="w-5 h-5"
								>
									<path
										fillRule="evenodd"
										d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
							<button
								type="button"
								onClick={handleCancelConfirm}
								className="text-gray-600 hover:text-gray-800 p-1 rounded dark:text-gray-400 dark:hover:text-gray-300"
								title="Cancel removal"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className="w-5 h-5"
								>
									<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
								</svg>
							</button>
						</>
					) : (
						<button
							type="button"
							onClick={handleRemove}
							className="text-gray-600 hover:text-red-600 p-1 rounded dark:text-gray-400 dark:hover:text-red-400"
							title="Remove attachment"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								className="w-5 h-5"
							>
								<path
									fillRule="evenodd"
									d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					)}
				</div>
			</div>

			{error && (
				<div className="mt-2 text-sm text-red-600 dark:text-red-400">
					<p>Error: {error}</p>
				</div>
			)}
		</div>
	);
}
