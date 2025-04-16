import { Contact } from '@/app/types/contacts';
import Link from 'next/link';
import PostTable from '@/components/PostTable';

interface ContactListContactsProps {
	contacts: Contact[];
	contactListId: string;
}

export default function ContactListContacts({
	contacts,
	contactListId,
}: ContactListContactsProps) {
	const contactColumns = [
		{
			key: 'name',
			header: 'Name',
			render: (contact: Contact) => (
				<Link
					href={`/email/contacts/${contact.id}`}
					className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
				>
					{`${contact.first_name} ${contact.last_name}`}
				</Link>
			),
		},
		{
			key: 'email',
			header: 'Email',
			render: (contact: Contact) => (
				<span className="text-gray-600 dark:text-gray-300">
					{contact.email}
				</span>
			),
		},
		{
			key: 'client_name',
			header: 'Client',
			render: (contact: Contact) => (
				<span className="text-gray-600 dark:text-gray-300">
					{contact.client_name || 'Unknown Client'}
				</span>
			),
		},
	];

	return (
		<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold text-gray-900 dark:text-white">
					Contacts in this List
				</h2>
				<div className="flex space-x-2">
					<Link
						href={`/email/contacts/new?list=${contactListId}`}
						className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center"
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
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							></path>
						</svg>
						Add Contact
					</Link>
				</div>
			</div>

			{contacts.length > 0 ? (
				<PostTable data={contacts} columns={contactColumns} />
			) : (
				<div className="text-center py-8 text-gray-500 dark:text-gray-400">
					No contacts in this list.
				</div>
			)}
		</div>
	);
}
