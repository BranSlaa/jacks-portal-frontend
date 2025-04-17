'use client';

import Link from 'next/link';

export type BreadcrumbItem = {
	label: string;
	href?: string;
};

interface BreadcrumbProps {
	items: BreadcrumbItem[];
	homeHref?: string;
	showHomeIcon?: boolean;
}

export function Breadcrumb({
	items,
	homeHref = '/',
	showHomeIcon = true,
}: BreadcrumbProps) {
	return (
		<nav
			className="flex items-center space-x-1 text-sm mb-4"
			aria-label="Breadcrumb"
		>
			<ol className="flex items-center space-x-1">
				{showHomeIcon && (
					<li>
						<Link
							href={homeHref}
							className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
						>
							<svg
								className="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								></path>
							</svg>
							<span className="sr-only">Home</span>
						</Link>
					</li>
				)}

				{items.map((item, index) => (
					<li key={index} className="flex items-center">
						<svg
							className="h-4 w-4 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M9 5l7 7-7 7"
							></path>
						</svg>
						{item.href ? (
							<Link
								href={item.href}
								className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
							>
								{item.label}
							</Link>
						) : (
							<span className="ml-1 text-gray-700 dark:text-gray-300">
								{item.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
