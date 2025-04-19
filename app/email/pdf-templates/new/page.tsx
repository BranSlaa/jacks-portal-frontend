import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PdfTemplateForm from '@/components/pdf/PdfTemplateForm';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function NewPdfTemplatePage() {
	return (
		<div className="container py-8">
			<Breadcrumb
				items={[
					{ label: 'Email', href: '/email' },
					{ label: 'PDF Templates', href: '/email/pdf-templates' },
					{ label: 'New Template' },
				]}
				homeHref="/dashboard"
			/>
			<Card>
				<CardHeader>
					<CardTitle>Create New PDF Template</CardTitle>
				</CardHeader>
				<CardContent>
					<PdfTemplateForm />
				</CardContent>
			</Card>
		</div>
	);
}
