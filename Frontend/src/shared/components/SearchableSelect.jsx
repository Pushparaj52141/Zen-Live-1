import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  required = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filterTerm = (inputValue || "").trim().toLowerCase();
  const filteredOptions = options.filter((opt) =>
    String(opt.label).toLowerCase().includes(filterTerm)
  );

  const handleFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    setInputValue("");
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue("");
      inputRef.current?.blur();
    }
  };

  const displayValue = isOpen ? inputValue : (selectedOption ? (selectedOption.shortLabel ?? selectedOption.label) : placeholder);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full border rounded-md px-2.5 py-1.5 pr-8 text-xs bg-white ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          } ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} ${
            isOpen ? "ring-2 ring-blue-500 border-blue-500" : ""
          } focus:outline-none`}
          autoComplete="off"
        />
        <FaChevronDown className="absolute right-2.5 text-gray-400 text-xs pointer-events-none flex-shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto left-0 ring-1 ring-black/5">
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                    String(option.value) === String(value)
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <span className="truncate">{option.label}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-500 text-center">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
