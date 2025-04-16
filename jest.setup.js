// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock next/router
jest.mock('next/router', () => ({
	useRouter() {
		return {
			route: '/',
			pathname: '',
			query: {},
			asPath: '',
			push: jest.fn(),
			replace: jest.fn(),
		};
	},
}));

// Mock next/image
jest.mock('next/image', () => ({
	__esModule: true,
	default: props => {
		// eslint-disable-next-line jsx-a11y/alt-text
		return <img {...props} />;
	},
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
	createClient: jest.fn(),
}));

// Increase timeout for async operations
jest.setTimeout(30000);
