import React from 'react';
import { AlertCircle } from 'lucide-react';

export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  options = [],
  rows = 3,
  className = '',
  autoComplete
}) => {
  const isTextarea = type === 'textarea';
  const isSelect = type === 'select';

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          <span>{label}</span>
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      <div className={`input-wrapper ${Icon ? 'with-icon' : ''}`}>
        {Icon && <Icon size={18} className="input-icon" />}

        {isTextarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`form-control ${error ? 'is-invalid' : ''}`}
          />
        ) : isSelect ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`form-control form-select ${error ? 'is-invalid' : ''}`}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`form-control ${error ? 'is-invalid' : ''}`}
          />
        )}
      </div>

      {error ? (
        <div className="field-error-text" role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div className="field-helper-text">{helperText}</div>
      ) : null}
    </div>
  );
};
