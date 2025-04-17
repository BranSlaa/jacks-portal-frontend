'use client';

import type {
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	LexicalEditor,
	LexicalNode,
	NodeKey,
	SerializedEditor,
	SerializedLexicalNode,
	Spread,
} from 'lexical';

import { createEditor, DecoratorNode } from 'lexical';
import * as React from 'react';
import { Suspense, lazy } from 'react';

const ImageComponent = lazy(() => import('./ImageComponent'));

export interface ImagePayload {
	src: string;
	altText: string;
	key?: NodeKey;
	height?: number;
	width?: number;
	maxHeight?: number;
	maxWidth?: number;
	showCaption?: boolean;
	captionsEnabled?: boolean;
}

function convertImageElement(domNode: Node): null | DOMConversionOutput {
	if (domNode instanceof HTMLImageElement) {
		const { alt: altText, src } = domNode;
		const node = $createImageNode({ altText, src });
		return { node };
	}
	return null;
}

export type SerializedImageNode = Spread<
	{
		altText: string;
		height?: number;
		maxWidth: number;
		showCaption: boolean;
		src: string;
		width?: number;
		type: 'image';
		version: 1;
	},
	SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.ReactElement> {
	__src: string;
	__altText: string;
	__width: 'inherit' | number;
	__height: 'inherit' | number;
	__maxHeight: number;
	__maxWidth: number;
	__showCaption: boolean;
	__captionsEnabled: boolean;

	static getType(): string {
		return 'image';
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			node.__altText,
			node.__width,
			node.__height,
			node.__maxHeight,
			node.__maxWidth,
			node.__showCaption,
			node.__captionsEnabled,
			node.__key,
		);
	}

	constructor(
		src: string,
		altText: string,
		width?: 'inherit' | number,
		height?: 'inherit' | number,
		maxHeight?: number,
		maxWidth?: number,
		showCaption?: boolean,
		captionsEnabled?: boolean,
		key?: NodeKey,
	) {
		super(key);
		this.__src = src;
		this.__altText = altText;
		this.__width = width || 'inherit';
		this.__height = height || 'inherit';
		this.__maxHeight = maxHeight || 240;
		this.__maxWidth = maxWidth || 420;
		this.__showCaption = showCaption || false;
		this.__captionsEnabled =
			captionsEnabled || captionsEnabled === undefined;
	}

	exportJSON(): SerializedImageNode {
		return {
			altText: this.getAltText(),
			height: this.__height === 'inherit' ? 0 : this.__height,
			maxWidth: this.__maxWidth,
			showCaption: this.__showCaption,
			src: this.getSrc(),
			type: 'image',
			version: 1,
			width: this.__width === 'inherit' ? 0 : this.__width,
		};
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const { altText, height, width, maxWidth, src, showCaption } =
			serializedNode;
		return $createImageNode({
			altText,
			height,
			maxWidth,
			showCaption,
			src,
			width,
		});
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('img');
		element.setAttribute('src', this.__src);
		element.setAttribute('alt', this.__altText);
		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		return {
			img: () => ({
				conversion: convertImageElement,
				priority: 0,
			}),
		};
	}

	getSrc(): string {
		return this.__src;
	}

	getAltText(): string {
		return this.__altText;
	}

	setWidthAndHeight(
		width: 'inherit' | number,
		height: 'inherit' | number,
	): void {
		const writable = this.getWritable();
		writable.__width = width;
		writable.__height = height;
	}

	createDOM(config: EditorConfig): HTMLElement {
		const span = document.createElement('span');
		const className = config.theme.image;
		if (className !== undefined) {
			span.className = className;
		}
		return span;
	}

	updateDOM(): false {
		return false;
	}

	decorate(): React.ReactElement {
		return (
			<Suspense fallback={null}>
				<ImageComponent
					src={this.__src}
					altText={this.__altText}
					height={this.__height}
					width={this.__width}
					maxHeight={this.__maxHeight}
					maxWidth={this.__maxWidth}
					nodeKey={this.getKey()}
					showCaption={this.__showCaption}
					captionsEnabled={this.__captionsEnabled}
					resizable={true}
				/>
			</Suspense>
		);
	}
}

export function $createImageNode({
	src,
	altText,
	height,
	width,
	maxHeight = 240,
	maxWidth = 420,
	captionsEnabled,
	showCaption,
	key,
}: ImagePayload): ImageNode {
	return new ImageNode(
		src,
		altText,
		width,
		height,
		maxHeight,
		maxWidth,
		showCaption,
		captionsEnabled,
		key,
	);
}

export function $isImageNode(
	node: LexicalNode | null | undefined,
): node is ImageNode {
	return node instanceof ImageNode;
}
