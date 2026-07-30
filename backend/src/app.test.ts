import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalCorsOrigins = process.env.CORS_ORIGINS;

describe('CORS configuration', () => {
  beforeEach(() => {
    process.env.CORS_ORIGINS = [
      'http://localhost:8081',
      'http://192.168.18.50:8081',
      'http://192.168.18.50:3000',
    ].join(',');
    vi.resetModules();
  });

  afterEach(() => {
    process.env.CORS_ORIGINS = originalCorsOrigins;
  });

  it('returns only the requesting allowed origin on a preflight request', async () => {
    const { default: app } = await import('./app');

    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:8081')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:8081');
  });
});
