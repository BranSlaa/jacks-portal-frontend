'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ContactListForm from '@/components/email/contactLists/ContactListForm';

export default function EditContactListPage() {
	const params = useParams();
	const contactListId = params.id as string;

	return (
		<div className="p-4">
			<ContactListForm contactListId={contactListId} isEdit={true} />
		</div>
	);
}
