'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface EmailPageLayoutProps {
	title: string;
	createLink: string;
	createButtonText: string;
	breadcrumbItems: { label: string; href?: string }[];
	children: ReactNode;
	additionalActions?: ReactNode;
}

export default function EmailPageLayout({
	title,
	createLink,
	createButtonText,
	breadcrumbItems,
	children,
	additionalActions,
}: EmailPageLayoutProps) {
	return (
		<div className="container py-8">
			<Breadcrumb items={breadcrumbItems} homeHref="/dashboard" />

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>{title}</CardTitle>
					<div className="flex space-x-2">
						<Link href={createLink}>
							<Button>
								<PlusCircle className="mr-2 h-4 w-4" />
								{createButtonText}
							</Button>
						</Link>
						{additionalActions}
					</div>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</div>
	);
}
