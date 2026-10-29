import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { useAccess } from '../src/hooks/useAccess';
import { resetAccessPreview, signOut, startPreview, submitAccessRequest } from '../src/services/access-service';

beforeEach(() => resetAccessPreview());
afterEach(() => { cleanup(); resetAccessPreview(); });

test('useAccess reflete entrada, solicitação e saída sem loop de renderização', async () => {
  const { result } = renderHook(() => useAccess());
  expect(result.current.session).toBeNull();
  expect(result.current.snapshot).toEqual({ requests: [], users: [], audit: [] });
  act(() => { startPreview('master'); });
  expect(result.current.session?.role).toBe('master');
  await act(async () => {
    await submitAccessRequest({ name: 'Pessoa do Teste', email: 'hook@empresa.example', department: 'Operações', reason: 'Consultar contratos.' });
  });
  expect(result.current.snapshot.requests).toHaveLength(1);
  act(() => { signOut(); });
  expect(result.current.session).toBeNull();
  expect(result.current.snapshot.requests).toHaveLength(1);
});

test('duas instâncias do hook acompanham a mesma sessão e removem assinaturas ao desmontar', () => {
  const first = renderHook(() => useAccess());
  const second = renderHook(() => useAccess());
  act(() => { startPreview('reader'); });
  expect(first.result.current.session?.role).toBe('reader');
  expect(second.result.current.session?.role).toBe('reader');
  first.unmount();
  act(() => { startPreview('master'); });
  expect(second.result.current.session?.role).toBe('master');
  second.unmount();
  expect(() => signOut()).not.toThrow();
});
