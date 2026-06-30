import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthCheck } from './HealthCheck';
import * as healthService from '../services/healthService';

vi.mock('../services/healthService');

describe('HealthCheck', () => {
  beforeEach(() => {
    vi.mocked(healthService.runHealthCheck).mockResolvedValue({
      healthy: true,
      timestamp: '2024-01-01T00:00:00.000Z',
      version: '1.0.0',
      checks: {
        sanity: { ok: true, latencyMs: 50, error: null },
        auth: { ok: true, authenticated: false, error: null },
        contentStats: { ok: true, data: { items: 1, transactions: 0, users: 1 } },
      },
    });
  });

  it('shows loading state initially', async () => {
    vi.mocked(healthService.runHealthCheck).mockImplementation(
      () => new Promise(() => {})
    );
    const { container } = render(<HealthCheck />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays healthy status when all checks pass', async () => {
    render(<HealthCheck />);
    expect(await screen.findByText(/all systems operational/i)).toBeInTheDocument();
  });

  it('displays Sanity check result', async () => {
    render(<HealthCheck />);
    expect(await screen.findByText(/sanity/i)).toBeInTheDocument();
  });

  it('displays Auth check result', async () => {
    render(<HealthCheck />);
    expect(await screen.findByText(/auth/i)).toBeInTheDocument();
  });
});
