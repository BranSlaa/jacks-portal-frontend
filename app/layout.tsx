import { MainNav } from '@/components/layout/MainNav';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationTray from '@/components/NotificationTray';

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
							<MainNav />
							<div className="flex-1 w-full flex flex-col">
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
