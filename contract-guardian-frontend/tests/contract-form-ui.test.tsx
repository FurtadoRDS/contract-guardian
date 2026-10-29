import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ContractFormPage } from '../src/pages/ContractFormPage';
import type { Contract } from '../src/types';

afterEach(cleanup);

// Editing fixture stays in the tests; the application has no seeded contracts.
const editingContract: Contract = {
  id: 'contract-date-regression',
  company: 'Contratada do teste',
  initials: 'CT',
  color: '#c1f66b',
  category: 'Tecnologia',
  scope: 'Validar edição de vigência e preservação dos campos controlados.',
  start: '2026-10-01',
  end: '2027-09-30',
  monthly: 1000,
  total: 12000,
  signature: 'Assinado',
  renewal: 'Sem renovação automática.',
  contractor: { name: 'Contratante do teste', cnpj: '00.000.000/0000-00', type: 'Matriz', city: 'São Paulo, SP' },
  provider: { name: 'Contratada do teste', cnpj: '11.111.111/0001-11', category: 'Tecnologia', email: 'formulario@empresa.example', phone: '(11) 3333-4444' },
  createdAt: '2026-10-01',
};

test('eventos input de datas atualizam o estado, sobrevivem à edição de outro campo e são enviados ao salvar', () => {
  const save = vi.fn();
  render(<ContractFormPage contract={editingContract} onSave={save} onCancel={vi.fn()} onToast={vi.fn()} />);
  const start = screen.getByLabelText(/^Início da vigência/) as HTMLInputElement;
  const end = screen.getByLabelText(/^Fim da vigência/) as HTMLInputElement;
  fireEvent.input(start, { target: { value: '2026-11-01' } });
  fireEvent.input(end, { target: { value: '2027-10-31' } });
  fireEvent.change(screen.getByLabelText(/^Valor mensal/), { target: { value: '2000' } });

  expect(start.value).toBe('2026-11-01');
  expect(end.value).toBe('2027-10-31');
  expect(screen.getByText('01 nov 2026 → 31 out 2027')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  expect(save).toHaveBeenCalledOnce();
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ start: '2026-11-01', end: '2027-10-31', monthly: 2000, signature: 'Assinado' }));
});

test('corrigir a data por evento input limpa a validação anterior e permite salvar após outra edição', () => {
  const save = vi.fn();
  render(<ContractFormPage contract={editingContract} onSave={save} onCancel={vi.fn()} onToast={vi.fn()} />);
  const end = screen.getByLabelText(/^Fim da vigência/) as HTMLInputElement;
  fireEvent.input(end, { target: { value: '2026-09-30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  expect(save).not.toHaveBeenCalled();
  expect(end.validity.customError).toBe(true);
  expect(end.validationMessage).toBe('O fim da vigência deve ser igual ou posterior ao início.');

  fireEvent.input(end, { target: { value: '2027-10-31' } });
  expect(end.validity.customError).toBe(false);
  fireEvent.change(screen.getByLabelText(/^Objetivo \/ escopo/), { target: { value: 'Escopo revisado após corrigir a vigência.' } });
  expect(end.value).toBe('2027-10-31');
  expect(screen.getByText('01 out 2026 → 31 out 2027')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  expect(save).toHaveBeenCalledOnce();
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ end: '2027-10-31', scope: 'Escopo revisado após corrigir a vigência.' }));
});
