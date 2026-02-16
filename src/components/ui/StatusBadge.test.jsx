import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders In Stock for in_stock', () => {
    render(<StatusBadge status="in_stock" />);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders Out for out', () => {
    render(<StatusBadge status="out" />);
    expect(screen.getByText('Out')).toBeInTheDocument();
  });

  it('renders Reserved for reserved', () => {
    render(<StatusBadge status="reserved" />);
    expect(screen.getByText('Reserved')).toBeInTheDocument();
  });

  it('renders unknown status as-is', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});
