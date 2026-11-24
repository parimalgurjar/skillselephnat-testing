
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const CustomDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`custom-dropdown ${className}`}
    >
      <button
        type="button"
        className={`custom-dropdown-trigger ${
          open ? "is-open" : ""
        }`}
        onClick={() => setOpen((previous) => !previous)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={!selectedOption ? "placeholder" : ""}>
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`custom-dropdown-chevron ${
            open ? "rotated" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="custom-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected =
              String(option.value) === String(value);

            return (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-dropdown-option ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>

                {isSelected && (
                  <Check size={16} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
