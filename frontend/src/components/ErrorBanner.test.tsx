import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner', () => {
  it('renders error message when provided', () => {
    render(<ErrorBanner message="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('does not render when message is empty', () => {
    const { container } = render(<ErrorBanner message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('has proper accessibility role', () => {
    render(<ErrorBanner message="Error occurred" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});
