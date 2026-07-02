import { render, screen } from '@testing-library/react';
import App from './app';

test('shows the sign-in screen when no one is logged in', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Burger Bonanza/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
});
