'use client';

import { useParams } from 'next/navigation';
import ContactForm from '@/components/email/contact/ContactForm';

export default function ContactEditPage() {
	const params = useParams();
	const id = params?.id as string;

	return <ContactForm contactId={id} isEdit={true} />;
}
