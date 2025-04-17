'use client';

import type { NodeKey } from 'lexical';
import Image from 'next/image';
import React, { Suspense } from 'react';

export default function ImageComponent({
	src,
	altText,
	width,
	height,
	maxWidth,
	maxHeight,
}: {
	src: string;
	altText: string;
	height: 'inherit' | number;
	width: 'inherit' | number;
	maxHeight: number;
	maxWidth: number;
	nodeKey: NodeKey;
	resizable: boolean;
	showCaption: boolean;
	captionsEnabled: boolean;
}): React.ReactElement {
	const imageStyle: React.CSSProperties = {
		width: width === 'inherit' ? '100%' : width,
		maxWidth: maxWidth ? `${maxWidth}px` : '420px',
		maxHeight: maxHeight ? `${maxHeight}px` : '240px',
		display: 'block',
		objectFit: 'contain' as const,
		height: 'auto',
	};

	return (
		<Suspense fallback={null}>
			<div
				style={{
					maxWidth: maxWidth ? `${maxWidth}px` : '420px',
					maxHeight: maxHeight ? `${maxHeight}px` : '240px',
					width: '100%',
				}}
			>
				<Image
					src={src}
					alt={altText}
					width={typeof width === 'number' ? width : 420}
					height={typeof height === 'number' ? height : 240}
					style={imageStyle}
					unoptimized={true}
				/>
			</div>
		</Suspense>
	);
}
