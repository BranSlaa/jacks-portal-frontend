import { ContactList } from '@/app/types/contactLists';
import Link from 'next/link';

interface ContactListDetailsProps {
	contactList: ContactList;
	clientName: string;
}

export default function ContactListDetails({
	contactList,
	clientName,
}: ContactListDetailsProps) {
	return (
		<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
			<div className="flex justify-between items-center mb-4">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					{contactList.name}
				</h1>
				<div className="flex space-x-2">
					<Link
						href={`/email/contact-lists/${contactList.id}/edit`}
						className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm"
					>
						Edit
					</Link>
				</div>
			</div>

			<div className="space-y-4">
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Description
					</p>
					<p className="text-gray-800 dark:text-gray-200">
						{contactList.description || 'No description'}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Client
					</p>
					<p className="text-gray-800 dark:text-gray-200">
						{clientName || 'Unknown Client'}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Tags
					</p>
					{contactList.tags &&
					typeof contactList.tags === 'object' &&
					Object.keys(contactList.tags).length > 0 ? (
						<div className="flex flex-wrap gap-2 mt-1">
							{Object.keys(contactList.tags).map(tag => (
								<span
									key={tag}
									className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
								>
									{tag}
								</span>
							))}
						</div>
					) : (
						<p className="text-gray-800 dark:text-gray-200">
							No tags
						</p>
					)}
				</div>
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Created
					</p>
					<p className="text-gray-800 dark:text-gray-200">
						{new Date(contactList.created_at).toLocaleDateString(
							'en-CA',
						)}
					</p>
				</div>
				<div>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Last Updated
					</p>
					<p className="text-gray-800 dark:text-gray-200">
						{new Date(contactList.updated_at).toLocaleDateString(
							'en-CA',
						)}
					</p>
				</div>
			</div>
		</div>
	);
}
