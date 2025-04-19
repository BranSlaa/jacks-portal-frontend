'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import React, { FC } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import {
	LinkNode,
	AutoLinkNode,
	$isLinkNode,
	$createLinkNode,
} from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	LexicalEditor,
	COMMAND_PRIORITY_LOW,
	PASTE_COMMAND,
	FORMAT_TEXT_COMMAND,
} from 'lexical';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin';
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { Variable } from '@/app/types/templateEditor';
import { URL_REGEX } from '@/app/constants/templateEditor';
import { Button } from '@/components/ui/button';
import { ImageNode } from './editor/ImageNode';
import ImagesPlugin from './editor/ImagePlugin';
import ImageUploadButton from './editor/ImageUploadButton';
import '@/styles/_scrollbar.scss';

// Simple toolbar component
function ToolbarPlugin() {
	const [editor] = useLexicalComposerContext();

	const formatText = (format: 'bold' | 'italic' | 'underline') => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
	};

	const insertList = (listType: 'ordered' | 'unordered') => {
		if (listType === 'ordered') {
			editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
		} else {
			editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
		}
	};

	return (
		<div className="flex items-center p-2">
			<Button
				type="button"
				onClick={() => formatText('bold')}
				variant="ghost"
				size="sm"
				aria-label="Format Bold"
				className="font-bold"
			>
				B
			</Button>
			<Button
				type="button"
				onClick={() => formatText('italic')}
				variant="ghost"
				size="sm"
				aria-label="Format Italic"
				className="italic"
			>
				I
			</Button>
			<Button
				type="button"
				onClick={() => formatText('underline')}
				variant="ghost"
				size="sm"
				aria-label="Format Underline"
				className="underline"
			>
				U
			</Button>
			<div className="h-6 mx-1 border-r border-gray-300"></div>
			<Button
				type="button"
				onClick={() => insertList('unordered')}
				variant="ghost"
				size="sm"
				aria-label="Insert Bullet List"
				title="Bullet List"
			>
				&#8226; List
			</Button>
			<Button
				type="button"
				onClick={() => insertList('ordered')}
				variant="ghost"
				size="sm"
				aria-label="Insert Numbered List"
				title="Numbered List"
			>
				1. List
			</Button>
		</div>
	);
}

// Define a simple function component that satisfies the ErrorBoundaryType
const ErrorBoundaryComponent: FC<{
	children: React.ReactElement;
	onError: (error: Error) => void;
}> = ({ children, onError }) => {
	return (
		<LexicalErrorBoundary onError={onError}>
			{children}
		</LexicalErrorBoundary>
	);
};

// Inner editor component that manages Lexical context
const Editor = memo(
	({
		onChange,
		placeholder,
		variables = [],
	}: {
		onChange: (html: string) => void;
		placeholder?: string;
		variables?: Array<Variable>;
	}) => {
		const [editor] = useLexicalComposerContext();
		const initializedRef = useRef(false);
		const contentRef = useRef<string>('');

		// Handle editor changes without causing focus issues
		const handleEditorChange = useCallback(() => {
			editor.update(() => {
				if (!initializedRef.current) return;

				// Get HTML and only update if it changed
				const html = $generateHtmlFromNodes(editor);
				if (html === contentRef.current) return;

				contentRef.current = html;
				onChange(html);
			});
		}, [editor, onChange]);

		// Insert variable without losing focus
		const insertVariable = useCallback(
			(variable: string) => {
				editor.update(() => {
					const selection = $getSelection();
					if (selection) {
						selection.insertText(variable);
					}
				});
			},
			[editor],
		);

		// Add link handling
		const insertLink = useCallback(() => {
			editor.update(() => {
				const selection = $getSelection();
				if (!selection) return;

				const linkNode = selection
					.getNodes()
					.find(node => $isLinkNode(node)) as LinkNode | undefined;

				if (linkNode) {
					const url = prompt('Edit URL:', linkNode.getURL());
					if (url === null) return;
					linkNode.setURL(url);
				} else {
					const selectedText = selection.getTextContent();
					const url = prompt('Enter the URL:');
					if (!url) return;

					const text = selectedText || prompt('Enter the link text:');
					if (!text) return;

					const linkNode = $createLinkNode(url);
					const textNode = $createTextNode(text);
					linkNode.append(textNode);
					selection.insertNodes([linkNode]);
				}
			});
		}, [editor]);

		// Prevent focus stealing during initialization
		useEffect(() => {
			initializedRef.current = true;
			return () => {
				initializedRef.current = false;
			};
		}, []);

		return (
			<div className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
				<div className="flex flex-col lg:flex-row justify-between lg:items-center gap-2 p-2 border-b bg-gray-50 dark:bg-gray-700">
					<div className="flex gap-2 items-center">
						<ToolbarPlugin />
						<Button
							type="button"
							onClick={insertLink}
							variant="outline"
							size="sm"
						>
							Insert Link
						</Button>
						<ImageUploadButton />
					</div>
					<div className="relative max-w-[300px] overflow-hidden">
						<div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700 z-10"></div>
						<div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-700 z-10"></div>
						<div className="flex gap-2 overflow-x-auto py-1 px-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
							{variables.map(variable => (
								<Button
									key={variable.value}
									type="button"
									onClick={() =>
										insertVariable(variable.value)
									}
									variant="secondary"
									size="sm"
									className="text-xs whitespace-nowrap"
								>
									{`{{${variable.label}}}`}
								</Button>
							))}
						</div>
					</div>
				</div>
				<div className="relative bg-white dark:bg-gray-800">
					<LinkPlugin />
					<AutoLinkPlugin
						matchers={[
							createLinkMatcherWithRegExp(
								URL_REGEX,
								(text: string) => text,
							),
						]}
					/>
					<ImagesPlugin />
					<RichTextPlugin
						contentEditable={
							<ContentEditable className="min-h-[200px] px-4 py-3 resize-none text-base outline-none dark:text-white" />
						}
						placeholder={
							typeof window !== 'undefined' && placeholder ? (
								<div className="absolute top-4 left-4 text-gray-400 select-none pointer-events-none dark:text-gray-500">
									{placeholder}
								</div>
							) : null
						}
						ErrorBoundary={ErrorBoundaryComponent}
					/>
					<OnChangePlugin onChange={handleEditorChange} />
					<HistoryPlugin />
					<ListPlugin />
				</div>
			</div>
		);
	},
);

Editor.displayName = 'Editor';

// Main wrapper component for the Lexical editor
export const EditorWrapper = memo(
	({
		value,
		onChange,
		placeholder,
		variables,
	}: {
		value: string;
		onChange: (value: string) => void;
		placeholder?: string;
		variables?: Array<Variable>;
	}) => {
		// Create stable namespace that doesn't change between renders
		const id = useRef(`editor-${Math.random().toString(36).slice(2, 9)}`);
		const valueRef = useRef(value);

		// Update ref when value changes from external source
		useEffect(() => {
			valueRef.current = value;
		}, [value]);

		// Prevent unnecessary re-renders by comparing values
		const handleStableChange = useCallback(
			(html: string) => {
				if (html !== valueRef.current) {
					valueRef.current = html;
					onChange(html);
				}
			},
			[onChange],
		);

		// Create stable configuration that won't change between renders
		const initialConfig = {
			namespace: id.current,
			editorKey: id.current,
			onError: (error: Error) => console.error(error),
			editable: true,
			theme: {
				text: {
					bold: 'font-bold',
					italic: 'italic',
					underline: 'underline',
				},
				link: 'text-blue-600 underline hover:text-blue-800',
				list: {
					nested: {
						listitem: 'list-item ms-6',
					},
					ol: 'list-decimal ms-5 my-2 ps-1',
					ul: 'list-disc ms-4 my-2 ps-1',
					listitem: 'my-1',
					listitemChecked: 'checked',
					listitemUnchecked: 'unchecked',
				},
				paragraph: 'my-2',
				image: 'my-4',
			},
			nodes: [
				HeadingNode,
				ListNode,
				ListItemNode,
				QuoteNode,
				LinkNode,
				AutoLinkNode,
				ImageNode,
			],
			// Initialize editor with current content
			editorState: (editor: LexicalEditor) => {
				const root = $getRoot();

				try {
					if (valueRef.current) {
						if (typeof window !== 'undefined') {
							const parser = new DOMParser();
							const doc = parser.parseFromString(
								`<div>${valueRef.current}</div>`,
								'text/html',
							);
							const nodes = $generateNodesFromDOM(editor, doc);

							root.clear();
							nodes.forEach(node => root.append(node));
						} else {
							// Server-side fallback
							const paragraph = $createParagraphNode();
							paragraph.append($createTextNode(valueRef.current));
							root.append(paragraph);
						}
					} else {
						const paragraph = $createParagraphNode();
						root.append(paragraph);
					}
				} catch (e) {
					console.error('Error initializing editor:', e);
					const paragraph = $createParagraphNode();
					if (valueRef.current) {
						paragraph.append($createTextNode(valueRef.current));
					}
					root.append(paragraph);
				}
			},
		};

		return (
			<LexicalComposer initialConfig={initialConfig}>
				<Editor
					onChange={handleStableChange}
					placeholder={placeholder}
					variables={variables}
				/>
			</LexicalComposer>
		);
	},
);

EditorWrapper.displayName = 'EditorWrapper';
