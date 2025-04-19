'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitcher } from '@/components/theme-switcher';
import HeaderAuthClient from '@/components/header-auth-client';
import MegaMenu from './MegaMenu';
import { Menu, X } from 'lucide-react';
import '@/styles/_navigation.scss';

export function MainNav() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [activeMenu, setActiveMenu] = useState<string | null>(null);
	const headerRef = useRef<HTMLElement>(null);

	const navItems = [
		{
			title: 'Campaigns',
			href: '/email/campaigns',
			megaMenu: {
				type: 'campaigns',
				title: 'Email Campaigns',
				createLink: '/email/campaigns/new',
			},
		},
		{
			title: 'Templates',
			href: '/email/templates',
			megaMenu: {
				type: 'templates',
				title: 'Email Templates',
				createLink: '/email/templates/new',
			},
		},
		{
			title: 'Contact Lists',
			href: '/email/contact-lists',
			megaMenu: {
				type: 'contact-lists',
				title: 'Contact Lists',
				createLink: '/email/contact-lists/new',
			},
		},
		{
			title: 'Contacts',
			href: '/email/contacts',
			megaMenu: {
				type: 'contacts',
				title: 'Contacts',
				createLink: '/email/contacts/new',
			},
		},
	];

	// Set CSS variable for header height
	useEffect(() => {
		const updateHeaderHeight = () => {
			if (headerRef.current) {
				const height = headerRef.current.offsetHeight;
				document.documentElement.style.setProperty(
					'--headerHeight',
					`${height}px`,
				);
			}
		};

		// Set initial value
		updateHeaderHeight();

		// Update on window resize
		window.addEventListener('resize', updateHeaderHeight);
		return () => {
			window.removeEventListener('resize', updateHeaderHeight);
		};
	}, []);

	// Close mobile menu when route changes
	useEffect(() => {
		setMobileMenuOpen(false);
	}, [pathname]);

	const isActive = (href: string) => {
		if (href === '/') {
			return pathname === '/';
		}
		return pathname.startsWith(href);
	};

	return (
		<>
			<header
				ref={headerRef}
				className="sticky top-0 z-40 w-full border-b bg-black text-white"
			>
				<div className="container flex h-16 gap-4 items-stretch">
					<div className="mr-4 flex md:hidden">
						<button
							className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-gray-800 hover:text-white"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							<span className="sr-only">Open main menu</span>
							{mobileMenuOpen ? (
								<X className="h-6 w-6" aria-hidden="true" />
							) : (
								<Menu className="h-6 w-6" aria-hidden="true" />
							)}
						</button>
					</div>

					<Link href="/" className="flex items-center space-x-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="inline-block h-6 w-6"
						>
							<path d="M3 9.5L12 3l9 6.5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11z" />
							<polyline points="9 22 9 12 15 12 15 22" />
						</svg>
					</Link>

					{/* Desktop navigation with Stripe-style hover effect */}
					<div
						className="hidden md:flex flex-1 h-full items-center relative nav-container"
						onMouseLeave={() => setActiveMenu(null)}
					>
						<nav className="flex h-full items-stretch space-x-6 lg:space-x-8">
							{navItems.map(item => (
								<div
									key={item.title}
									className="relative nav-item"
									onMouseEnter={() =>
										item.megaMenu &&
										setActiveMenu(item.megaMenu.type)
									}
								>
									<Link
										href={item.href}
										className={`py-4 h-full text-sm font-medium transition-colors hover:text-gray-300 flex items-center whitespace-nowrap ${
											isActive(item.href)
												? 'text-white font-semibold'
												: 'text-gray-300'
										}`}
									>
										{item.title}
										{item.megaMenu && (
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												className={`ml-1 h-4 w-4 transition-transform ${
													activeMenu ===
													item.megaMenu.type
														? 'rotate-180'
														: ''
												}`}
											>
												<polyline points="6 9 12 15 18 9"></polyline>
											</svg>
										)}
									</Link>
								</div>
							))}
						</nav>

						{/* Mega menu container - preload all menus but only show active one */}
						<div
							className={`fixed left-0 right-0 bg-gray-900 border-b border-gray-800 transition-all duration-300 z-30 overflow-hidden ${
								activeMenu
									? 'mega-menu-active'
									: 'mega-menu-inactive'
							}`}
						>
							{activeMenu && (
								<div className="container mx-auto relative">
									{navItems.map(
										item =>
											item.megaMenu && (
												<div
													key={item.megaMenu.type}
													className={`${
														activeMenu ===
														item.megaMenu.type
															? 'block'
															: 'hidden'
													}`}
												>
													<MegaMenu
														type={
															item.megaMenu
																.type as
																| 'campaigns'
																| 'templates'
																| 'contact-lists'
																| 'contacts'
														}
														title={
															item.megaMenu.title
														}
														createLink={
															item.megaMenu
																.createLink
														}
													/>
												</div>
											),
									)}
								</div>
							)}
						</div>

						{/* Preload all mega menus in the background */}
						<div className="hidden">
							{navItems.map(
								item =>
									item.megaMenu && (
										<MegaMenu
											key={item.megaMenu.type}
											type={
												item.megaMenu.type as
													| 'campaigns'
													| 'templates'
													| 'contact-lists'
													| 'contacts'
											}
											title={item.megaMenu.title}
											createLink={
												item.megaMenu.createLink
											}
										/>
									),
							)}
						</div>
					</div>

					<div className="ml-auto flex items-center space-x-4">
						<HeaderAuthClient />
						<ThemeSwitcher />
					</div>
				</div>
			</header>

			{/* Mobile Menu */}
			<div
				className={`${
					mobileMenuOpen ? 'block' : 'hidden'
				} fixed inset-x-0 top-16 z-50 md:hidden bg-gray-900 shadow-lg`}
			>
				<div className="px-2 pt-2 pb-3 space-y-1">
					{navItems.map(item => (
						<div key={item.title}>
							<Link
								href={item.href}
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									isActive(item.href)
										? 'bg-gray-800 text-white font-semibold'
										: 'text-gray-300 hover:bg-gray-700 hover:text-white'
								}`}
							>
								{item.title}
							</Link>
							{item.megaMenu && (
								<div className="ml-4 pb-2">
									<Link
										href={item.megaMenu.createLink}
										className="block px-3 py-2 text-sm text-blue-400 hover:underline"
									>
										Create New{' '}
										{item.megaMenu.type === 'contact-lists'
											? 'List'
											: item.megaMenu.type.replace(
													/s$/,
													'',
												)}
									</Link>
									<Link
										href={`/email/${item.megaMenu.type}`}
										className="block px-3 py-2 text-sm text-blue-400 hover:underline"
									>
										View All{' '}
										{item.megaMenu.type
											.charAt(0)
											.toUpperCase() +
											item.megaMenu.type.slice(1)}
									</Link>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</>
	);
}
