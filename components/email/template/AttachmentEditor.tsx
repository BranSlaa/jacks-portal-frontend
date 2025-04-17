'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { FileCategory } from '@/app/types/templateEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/button';
import { AttachmentEditorProps } from '@/app/types/templates';

export default function AttachmentEditor({
	file,
	onChange,
	onClose,
}: AttachmentEditorProps) {
	const [category, setCategory] = useState<FileCategory>('other');
	const [width, setWidth] = useState<number | undefined>();
	const [height, setHeight] = useState<number | undefined>();
	const [altText, setAltText] = useState<string>('');
	const [aspectRatio, setAspectRatio] = useState<number>(1);
	const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);

	// Determine initial file category based on mime type
	useEffect(() => {
		if (file.type.startsWith('image/')) {
			setCategory('image');

			// For images, get dimensions to set default values and aspect ratio
			if (file instanceof File && file.type.startsWith('image/')) {
				const img = new window.Image();
				img.onload = () => {
					setWidth(img.width);
					setHeight(img.height);
					setAspectRatio(img.width / img.height);
				};
				img.src = URL.createObjectURL(file);
			}
		} else if (
			file.type.includes('pdf') ||
			file.type.includes('doc') ||
			file.type.includes('word')
		) {
			setCategory('document');
		} else if (
			file.type.includes('sheet') ||
			file.type.includes('excel') ||
			file.type.includes('csv')
		) {
			setCategory('spreadsheet');
		} else if (
			file.type.includes('presentation') ||
			file.type.includes('powerpoint')
		) {
			setCategory('presentation');
		} else {
			setCategory('other');
		}

		// Set default alt text to filename without extension
		setAltText(file.name.replace(/\.[^/.]+$/, ''));
	}, [file]);

	// Handle width change and maintain aspect ratio if needed
	const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newWidth = parseInt(e.target.value);
		setWidth(newWidth || undefined);

		if (maintainAspectRatio && newWidth && aspectRatio) {
			setHeight(Math.round(newWidth / aspectRatio));
		}
	};

	// Handle height change and maintain aspect ratio if needed
	const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newHeight = parseInt(e.target.value);
		setHeight(newHeight || undefined);

		if (maintainAspectRatio && newHeight && aspectRatio) {
			setWidth(Math.round(newHeight * aspectRatio));
		}
	};

	// Save settings
	const handleSave = () => {
		onChange({
			category,
			width: category === 'image' ? width : undefined,
			height: category === 'image' ? height : undefined,
			alt_text: category === 'image' ? altText : undefined,
		});
		onClose();
	};

	return (
		<div className="p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm">
			<h3 className="text-lg font-medium mb-4">File Settings</h3>

			<div className="space-y-4">
				<FormField label="File Type" htmlFor="file-category">
					<select
						id="file-category"
						value={category}
						onChange={e =>
							setCategory(e.target.value as FileCategory)
						}
						className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
					>
						<option value="image">Image</option>
						<option value="document">Document</option>
						<option value="spreadsheet">Spreadsheet</option>
						<option value="presentation">Presentation</option>
						<option value="other">Other</option>
					</select>
				</FormField>

				{category === 'image' && (
					<>
						<FormField label="Alt Text" htmlFor="alt-text">
							<Input
								id="alt-text"
								type="text"
								value={altText}
								onChange={e => setAltText(e.target.value)}
								placeholder="Describe the image"
							/>
						</FormField>

						<div className="flex items-center mb-4">
							<input
								type="checkbox"
								id="maintain-ratio"
								checked={maintainAspectRatio}
								onChange={e =>
									setMaintainAspectRatio(e.target.checked)
								}
								className="mr-2"
							/>
							<label
								htmlFor="maintain-ratio"
								className="text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Maintain aspect ratio
							</label>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField label="Width (px)" htmlFor="width">
								<Input
									id="width"
									type="number"
									value={width || ''}
									onChange={handleWidthChange}
									placeholder="Width in pixels"
								/>
							</FormField>

							<FormField label="Height (px)" htmlFor="height">
								<Input
									id="height"
									type="number"
									value={height || ''}
									onChange={handleHeightChange}
									placeholder="Height in pixels"
								/>
							</FormField>
						</div>
					</>
				)}

				<div className="flex justify-end space-x-2 mt-4">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="button" onClick={handleSave}>
						Save Settings
					</Button>
				</div>
			</div>
		</div>
	);
}
