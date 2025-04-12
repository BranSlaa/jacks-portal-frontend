import { EnvVarWarning } from '@/components/env-var-warning';
import HeaderAuth from '@/components/header-auth';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { hasEnvVars } from '@/utils/supabase/check-env-vars';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Link from 'next/link';
import './globals.css';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationTray from '@/components/NotificationTray';

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: 'http://localhost:3000';

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: 'Jacks Portal',
	description: 'Jacks Portal',
};

const geistSans = Geist({
	display: 'swap',
	subsets: ['latin'],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={geistSans.className}
			suppressHydrationWarning
		>
			<body className="bg-background text-foreground">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<NotificationProvider>
						<main className="min-h-screen flex flex-col">
							<div className="flex-1 w-full flex flex-col">
								<nav className="w-full flex justify-center items-center border-b border-b-foreground/10 h-16">
									<div className="w-full max-w-5xl flex justify-between items-center p-4 text-sm">
										<div className="flex gap-4 items-center font-semibold">
											<Link href={'/'}>Portal Home</Link>
										</div>
										<div className="flex gap-4 items-center">
											{!hasEnvVars ? (
												<EnvVarWarning />
											) : (
												<HeaderAuth />
											)}
											<ThemeSwitcher />
										</div>
									</div>
								</nav>
								<div className="mx-auto w-full max-w-5xl p-4">
									{children}
								</div>
							</div>
						</main>
						<NotificationTray />
					</NotificationProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
