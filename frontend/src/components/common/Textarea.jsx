import { forwardRef } from "react";
import "./Textarea.css";

const Textarea = forwardRef(
  (
    {
      label,
      name,
      value,
      onChange,
      onBlur,
      placeholder = "",
      rows = 5,
      error = "",
      hint = "",
      required = false,
      disabled = false,
      maxLength,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`se-textarea-group ${className}`}>
        {label && (
          <label
            htmlFor={name}
            className="se-textarea-label"
          >
            {label}

            {required && (
              <span className="se-textarea-required">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          className={`se-textarea ${
            error ? "se-textarea-error-input" : ""
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

        {error ? (
          <p
            id={`${name}-error`}
            className="se-textarea-error"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${name}-hint`}
            className="se-textarea-hint"
          >
            {hint}
          </p>
        ) : null}

        {maxLength && (
          <div className="se-textarea-counter">
            {String(value || "").length}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;