'use client';

import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeaderAuthClient() {
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		async function getUser() {
			try {
				const { data, error } = await supabase.auth.getUser();
				if (error) {
					console.error('Error fetching user:', error);
					setLoading(false);
					return;
				}

				setUser(data.user);
			} catch (err) {
				console.error('Exception fetching user:', err);
			} finally {
				setLoading(false);
			}
		}

		getUser();

		// Set up auth state change listener
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user || null);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [supabase, router]);

	const handleSignOut = async () => {
		try {
			await supabase.auth.signOut();
			setUser(null);
			router.refresh();
		} catch (error) {
			console.error('Error signing out:', error);
		}
	};

	if (loading) {
		return <div className="h-9">Loading...</div>; // Show loading indicator
	}

	return user ? (
		<div className="flex items-center gap-4 text-white">
			<Button
				onClick={handleSignOut}
				type="button"
				variant={'outline'}
				className="text-white border-white hover:bg-gray-800"
			>
				Sign out
			</Button>
		</div>
	) : (
		<div className="flex gap-2">
			<Button
				asChild
				size="sm"
				variant={'outline'}
				className="text-white border-white hover:bg-gray-800"
			>
				<Link href="/sign-in">Sign in</Link>
			</Button>
			<Button asChild size="sm" variant={'default'}>
				<Link href="/sign-up">Sign up</Link>
			</Button>
		</div>
	);
}
