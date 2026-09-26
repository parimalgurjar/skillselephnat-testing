import { forwardRef } from "react";
import "./Input.css";

const Input = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder = "",
      value,
      onChange,
      onBlur,
      error = "",
      hint = "",
      required = false,
      disabled = false,
      autoComplete,
      icon = null,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`se-input-group ${className}`}>
        {label && (
          <label
            htmlFor={name}
            className="se-input-label"
          >
            {label}

            {required && (
              <span className="se-input-required">
                *
              </span>
            )}
          </label>
        )}

        <div
          className={`se-input-wrapper ${
            error ? "se-input-wrapper-error" : ""
          }`}
        >
          {icon && (
            <span className="se-input-icon">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`se-input ${
              icon ? "se-input-with-icon" : ""
            }`}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${name}-error`
                : hint
                  ? `${name}-hint`
                  : undefined
            }
            {...props}
          />
        </div>

        {error ? (
          <p
            id={`${name}-error`}
            className="se-input-error"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${name}-hint`}
            className="se-input-hint"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;