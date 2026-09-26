import { forwardRef } from "react";
import "./Select.css";

const Select = forwardRef(
  (
    {
      label,
      name,
      value,
      onChange,
      onBlur,
      options = [],
      placeholder = "Select an option",
      error = "",
      hint = "",
      required = false,
      disabled = false,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`se-select-group ${className}`}>
        {label && (
          <label
            htmlFor={name}
            className="se-select-label"
          >
            {label}

            {required && (
              <span className="se-select-required">
                *
              </span>
            )}
          </label>
        )}

        <div
          className={`se-select-wrapper ${
            error ? "se-select-wrapper-error" : ""
          }`}
        >
          <select
            ref={ref}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            className="se-select"
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${name}-error`
                : hint
                  ? `${name}-hint`
                  : undefined
            }
            {...props}
          >
            <option value="">
              {placeholder}
            </option>

            {options.map((option) => {
              const optionValue =
                typeof option === "object"
                  ? option.value
                  : option;

              const optionLabel =
                typeof option === "object"
                  ? option.label
                  : option;

              return (
                <option
                  key={String(optionValue)}
                  value={optionValue}
                >
                  {optionLabel}
                </option>
              );
            })}
          </select>
        </div>

        {error ? (
          <p
            id={`${name}-error`}
            className="se-select-error"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${name}-hint`}
            className="se-select-hint"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;