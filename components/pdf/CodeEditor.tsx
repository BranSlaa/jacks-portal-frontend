'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

type CodeEditorProps = {
	language: string;
	value: string;
	onChange: (value: string) => void;
};

export default function CodeEditor({
	language,
	value,
	onChange,
}: CodeEditorProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="border rounded-md p-4 h-[300px] w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
				Loading editor...
			</div>
		);
	}

	return (
		<div className="border rounded-md overflow-hidden h-[300px]">
			<Editor
				height="300px"
				language={language}
				value={value}
				onChange={(value: string | undefined) => onChange(value || '')}
				options={{
					minimap: { enabled: false },
					scrollBeyondLastLine: false,
					automaticLayout: true,
					tabSize: 2,
					wordWrap: 'on',
				}}
				theme="vs-dark"
			/>
		</div>
	);
}
