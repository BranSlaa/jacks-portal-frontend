'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ContactListDetails from '@/components/email/contactLists/ContactListDetails';
import ContactListContacts from '@/components/email/contactLists/ContactListContacts';
import { useContactListDetails } from '@/hooks/useContactListDetails';

export default function ContactListDetailedPage() {
	const params = useParams();
	const contactListId = params.id as string;
	const { contactList, contacts, clientName, loading } =
		useContactListDetails(contactListId);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<LoadingSpinner />
			</div>
		);
	}

	if (!contactList) {
		return (
			<div className="p-4">
				<div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
					Contact list not found
				</div>
			</div>
		);
	}

	return (
		<div className="p-4">
			<div className="mb-6">
				<Link
					href="/email/contact-lists"
					className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
				>
					<svg
						className="w-4 h-4 mr-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						></path>
					</svg>
					Back to Contact Lists
				</Link>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-1">
					<ContactListDetails
						contactList={contactList}
						clientName={clientName}
					/>
				</div>

				<div className="lg:col-span-2">
					<ContactListContacts
						contacts={contacts}
						contactListId={contactListId}
					/>
				</div>
			</div>
		</div>
	);
}
