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
        supabase: { ok: true, latencyMs: 50, error: null },
        auth: { ok: true, authenticated: false, error: null },
      },
    });
  });

  it('shows loading state initially', async () => {
    vi.mocked(healthService.runHealthCheck).mockImplementation(
      () => new Promise(() => {})
    );
    render(<HealthCheck />);
    expect(screen.getByText(/running health checks/i)).toBeInTheDocument();
  });

  it('displays healthy status when all checks pass', async () => {
    render(<HealthCheck />);
    expect(await screen.findByText(/all systems operational/i)).toBeInTheDocument();
  });

  it('displays Supabase check result', async () => {
    render(<HealthCheck />);
    expect(await screen.findByText(/supabase/i)).toBeInTheDocument();
  });

  it('displays Auth check result', async () => {
    render(<HealthCheck />);
    expect(await screen.findByText(/auth/i)).toBeInTheDocument();
  });
});
