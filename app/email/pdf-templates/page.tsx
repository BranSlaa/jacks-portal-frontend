import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { formatDate } from '@/app/utils/date';
import { FormattedTemplate } from '@/app/types/pdfTemplate';
import PostTable from '@/components/PostTable';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export const metadata: Metadata = {
	title: 'PDF Templates',
	description: 'Manage your PDF templates',
};

export default async function PdfTemplatesPage() {
	const supabase = await createClient();

	const { data: templates, error } = await supabase
		.from('pdf_templates')
		.select(
			`
			id,
			name,
			description,
			client_id,
			clients (
				name
			),
			created_at,
			updated_at
		`,
		)
		.order('updated_at', { ascending: false });

	const formattedTemplates = templates?.map((template: any) => ({
		...template,
		client_name: template.clients?.name || 'Unknown',
		created_at_formatted: formatDate(template.created_at),
		updated_at_formatted: formatDate(template.updated_at),
	})) as FormattedTemplate[];

	return (
		<div className="container py-8">
			<Breadcrumb
				items={[
					{ label: 'Email', href: '/email' },
					{ label: 'PDF Templates' },
				]}
				homeHref="/dashboard"
			/>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>PDF Templates</CardTitle>
					<Link href="/email/pdf-templates/new">
						<Button>
							<PlusCircle className="mr-2 h-4 w-4" />
							Create New
						</Button>
					</Link>
				</CardHeader>
				<CardContent>
					<PostTable
						data={formattedTemplates}
						columns={columns}
						onEdit={handleEdit}
						onDuplicate={handleDuplicate}
						onDelete={handleDelete}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
