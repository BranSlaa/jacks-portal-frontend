'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import CodeEditor from './CodeEditor';
import ClientSelector from './SimpleClientSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './SimpleTabs';
import { contactVariables } from '@/app/constants/pdfTemplateVariables';
import {
	PdfTemplateFormProps,
	VariableCategory,
} from '@/app/types/pdfTemplate';

export default function PdfTemplateForm({
	id,
	initialData,
}: PdfTemplateFormProps) {
	const router = useRouter();
	const supabase = createClient();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		html_content: '',
		css_content: '',
		client_id: 0,
	});
	const [variableCategories] = useState<VariableCategory[]>([
		{
			category: 'Contact',
			variables: contactVariables,
		},
		{
			category: 'System',
			variables: [{ label: 'Current Date', value: '{{date}}' }],
		},
	]);
	const [activeEditor, setActiveEditor] = useState<'html' | 'css'>('html');

	useEffect(() => {
		if (initialData) {
			setFormData(initialData);
		}
	}, [initialData]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleCodeChange = (name: string, value: string) => {
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleClientChange = (value: number | null) => {
		setFormData(prev => ({ ...prev, client_id: value || 0 }));
	};

	const insertVariable = (variable: string) => {
		const targetField =
			activeEditor === 'html' ? 'html_content' : 'css_content';
		const currentValue = formData[targetField];
		setFormData(prev => ({
			...prev,
			[targetField]: currentValue + variable,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name) {
			alert('Template name is required');
			return;
		}

		setLoading(true);

		try {
			if (id) {
				const { error } = await supabase
					.from('pdf_templates')
					.update({
						name: formData.name,
						description: formData.description,
						html_content: formData.html_content,
						css_content: formData.css_content,
						client_id: formData.client_id || null,
					})
					.eq('id', id);

				if (error) throw error;
				alert('PDF template updated successfully');
			} else {
				const { error } = await supabase.from('pdf_templates').insert([
					{
						name: formData.name,
						description: formData.description,
						html_content: formData.html_content,
						css_content: formData.css_content,
						client_id: formData.client_id || null,
					},
				]);

				if (error) throw error;
				alert('PDF template created successfully');
			}

			router.push('/email/pdf-templates');
			router.refresh();
		} catch (error: any) {
			alert(error.message || 'Failed to save template');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="name">Template Name</Label>
					<Input
						id="name"
						name="name"
						value={formData.name}
						onChange={handleInputChange}
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="client_id">Client</Label>
					<ClientSelector
						value={formData.client_id}
						onChange={handleClientChange}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<textarea
					id="description"
					name="description"
					value={formData.description || ''}
					onChange={handleInputChange}
					rows={3}
					className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				/>
			</div>

			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
					<span className="font-medium text-sm">
						Template Variables:
					</span>
					{variableCategories.map(category => (
						<div key={category.category} className="relative group">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="text-xs"
							>
								{category.category} Variables
							</Button>
							<div className="absolute z-10 left-0 mt-0 pt-1 w-48 invisible group-hover:visible">
								<div className="bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-2 max-h-60 overflow-auto">
									{category.variables.map(variable => (
										<Button
											key={variable.value}
											type="button"
											variant="ghost"
											size="sm"
											className="w-full justify-start text-xs"
											onClick={() =>
												insertVariable(variable.value)
											}
										>
											{variable.label}
										</Button>
									))}
								</div>
							</div>
						</div>
					))}
				</div>

				<Tabs
					defaultValue="html"
					onValueChange={(value: string) =>
						setActiveEditor(value as 'html' | 'css')
					}
				>
					<TabsList className="mb-2">
						<TabsTrigger value="html">HTML Content</TabsTrigger>
						<TabsTrigger value="css">CSS Content</TabsTrigger>
					</TabsList>

					<TabsContent value="html" className="space-y-2">
						<CodeEditor
							language="html"
							value={formData.html_content || ''}
							onChange={value =>
								handleCodeChange('html_content', value)
							}
						/>
						<p className="text-sm text-gray-500">
							Use template variables like {'{{firstname}}'} to
							insert dynamic content.
						</p>
					</TabsContent>

					<TabsContent value="css" className="space-y-2">
						<CodeEditor
							language="css"
							value={formData.css_content || ''}
							onChange={value =>
								handleCodeChange('css_content', value)
							}
						/>
						<p className="text-sm text-gray-500">
							Add custom CSS to style your PDF template.
						</p>
					</TabsContent>
				</Tabs>
			</div>

			<div className="flex justify-end space-x-4">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					{id ? 'Update Template' : 'Create Template'}
				</Button>
			</div>
		</form>
	);
}
