/**
 * Reusable form field component with icon, label, error display.
 * Supports input and select types.
 */
const FormField = ({
  id,
  name,
  label,
  type = 'text',
  icon,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options,
  autoComplete,
  maxLength,
  ...rest
}) => {
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';
  const hasError = !!error;

  return (
    <div className="input-group">
      <label htmlFor={id} className={`field-label${required ? ' required' : ''}`}>
        {label}
      </label>
      <div className={`input-wrapper${hasError ? ' invalid' : ''}`}>
        <i className={`${icon} input-icon`}></i>
        {isSelect ? (
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>
        ) : isTextarea ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            maxLength={maxLength}
            {...rest}
          />
        ) : (
          <input
            type={type}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            maxLength={maxLength}
            {...rest}
          />
        )}
      </div>
      {hasError && (
        <span className="error-msg visible" id={`${id}Error`}>
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;
