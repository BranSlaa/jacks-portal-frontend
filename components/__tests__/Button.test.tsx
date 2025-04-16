import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
	it('renders the button with correct text', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByText('Click me')).toBeInTheDocument();
	});

	it('applies the correct className when variant is provided', () => {
		render(<Button variant="primary">Primary Button</Button>);
		const button = screen.getByText('Primary Button');
		expect(button).toHaveClass('bg-primary');
	});
});
