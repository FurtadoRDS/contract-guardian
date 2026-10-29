import type { HTMLInputTypeAttribute, HTMLAttributes } from 'react';

interface FormFieldProps {
  label: string; name: string; value: string; onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute; placeholder?: string; maxLength?: number; inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  min?: string; step?: string; options?: string[]; emptyOption?: string; textarea?: boolean; wide?: boolean; hint?: string; manual?: boolean; needsReview?: boolean; extracted?: boolean;
}
export function FormField({ label, name, value, onChange, type = 'text', placeholder = '', maxLength, inputMode, min, step, options, emptyOption = 'Selecione uma categoria', textarea = false, wide = false, hint, manual = false, needsReview = false, extracted = false }: FormFieldProps) {
  const id = `cf-${name.replaceAll('.', '-')}`;
  const optionValues = options && value && !options.includes(value) ? [...options, value] : options;
  const shared = { id, name, value, required: true, 'aria-describedby': hint ? `${id}-hint` : undefined };
  return <div className={`cf-field ${wide ? 'cf-field-wide' : ''} ${manual ? 'cf-manual-field' : ''} ${needsReview ? 'cf-needs-review' : ''} ${extracted && !manual ? 'cf-filled' : ''}`}>
    <label htmlFor={id}>{label}<span className="cf-required">*</span>{manual && <span className="cf-manual-badge">Preenchimento manual</span>}</label>
    {optionValues ? <select {...shared} onChange={event => { event.currentTarget.setCustomValidity(''); onChange(event.target.value); }}><option value="">{emptyOption}</option>{optionValues.map(option => <option value={option} key={option}>{option}</option>)}</select> : textarea ? <textarea {...shared} placeholder={placeholder} rows={3} maxLength={maxLength} onChange={event => { event.currentTarget.setCustomValidity(''); onChange(event.target.value); }} /> : <input {...shared} type={type} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode} min={min} step={step} onInput={type === 'date' ? event => { event.currentTarget.setCustomValidity(''); onChange(event.currentTarget.value); } : undefined} onChange={event => { event.currentTarget.setCustomValidity(''); onChange(event.target.value); }} />}
    {hint && <span id={`${id}-hint`} className="cf-field-hint">{hint}</span>}
  </div>;
}
