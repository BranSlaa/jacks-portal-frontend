import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const updateSession = async (request: NextRequest) => {
	// This `try/catch` block is only here for the interactive tutorial.
	// Feel free to remove once you have Supabase connected.
	try {
		// Create an unmodified response
		let response = NextResponse.next({
			request: {
				headers: request.headers,
			},
		});

		const supabase = createServerClient(
			process.env.SUPABASE_URL!,
			process.env.SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return request.cookies.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value }) =>
							request.cookies.set(name, value),
						);
						response = NextResponse.next({
							request,
						});
						cookiesToSet.forEach(({ name, value, options }) =>
							response.cookies.set(name, value, options),
						);
					},
				},
			},
		);

		// This will refresh session if expired - required for Server Components
		// https://supabase.com/docs/guides/auth/server-side/nextjs
		const { data: { user } } = await supabase.auth.getUser();

		// protected routes - redirect to sign-in if not authenticated
		if (!user && 
		    !request.nextUrl.pathname.startsWith('/sign-in') && 
		    !request.nextUrl.pathname.startsWith('/sign-up') && 
		    !request.nextUrl.pathname.startsWith('/auth/callback') &&
		    !request.nextUrl.pathname.startsWith('/forgot-password')) {
			return NextResponse.redirect(new URL('/sign-in', request.url));
		}

		// redirect authenticated users away from auth pages
		if (user && 
		   (request.nextUrl.pathname === '/sign-in' || 
		    request.nextUrl.pathname === '/sign-up')) {
			return NextResponse.redirect(new URL('/', request.url));
		}

		return response;
	} catch (e) {
		// If there's an error, just continue to the page
		console.error('Middleware error:', e);
		return NextResponse.next({
			request: {
				headers: request.headers,
			},
		});
	}
};
