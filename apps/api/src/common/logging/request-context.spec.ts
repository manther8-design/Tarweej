import { getCorrelationId, resolveCorrelationId, runWithRequestContext } from './request-context';

describe('request-context', () => {
  it('prefers x-correlation-id header', () => {
    expect(resolveCorrelationId({ 'x-correlation-id': 'corr-1', 'x-request-id': 'req-1' })).toBe(
      'corr-1',
    );
  });

  it('falls back to x-request-id then mints uuid', () => {
    expect(resolveCorrelationId({ 'x-request-id': 'req-2' })).toBe('req-2');
    expect(resolveCorrelationId({})).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('exposes correlation id inside async local storage', () => {
    expect(getCorrelationId()).toBeUndefined();
    runWithRequestContext({ correlationId: 'c-1', requestId: 'c-1' }, () => {
      expect(getCorrelationId()).toBe('c-1');
    });
  });
});
