'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { INSERT_IMAGE_COMMAND } from './ImagePlugin';

export default function ImageUploadButton() {
	const [editor] = useLexicalComposerContext();
	const [isUploading, setIsUploading] = useState(false);
	const supabase = createClient();

	const uploadImage = async (file: File) => {
		if (!file) return;

		try {
			setIsUploading(true);

			// Create a unique file name
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
			const filePath = `template-images/${fileName}`;

			// Try to upload to the "uploads" bucket - this name must match your Supabase storage bucket name
			const { error } = await supabase.storage
				.from('uploads')
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: false,
				});

			if (error) {
				console.error('Error uploading image:', error);
				return;
			}

			// Get public URL for the file
			const { data: publicUrlData } = supabase.storage
				.from('uploads')
				.getPublicUrl(filePath);

			if (!publicUrlData?.publicUrl) {
				console.error('Failed to get public URL for uploaded image');
				return;
			}

			// Insert image into the editor
			editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
				src: publicUrlData.publicUrl,
				altText: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
			});
		} catch (error) {
			console.error('Image upload error:', error);
		} finally {
			setIsUploading(false);
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			uploadImage(e.target.files[0]);
			// Reset input value so same file can be selected again
			e.target.value = '';
		}
	};

	return (
		<div className="relative">
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={isUploading}
				onClick={() => {
					document.getElementById('imageUpload')?.click();
				}}
			>
				{isUploading ? 'Uploading...' : 'Insert Image'}
			</Button>
			<input
				id="imageUpload"
				type="file"
				accept="image/*"
				onChange={handleFileUpload}
				className="hidden"
			/>
		</div>
	);
}
