import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TEXAS_CITIES } from '../../data/texas-cities';
import styles from './CityAutocomplete.module.css';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) {
    return text;
  }

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <span className={styles.matchText}>{match}</span>
      {after}
    </>
  );
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Start typing a city...',
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = useMemo(() => {
    if (inputValue.length < 2) {
      return [];
    }
    const query = inputValue.toLowerCase();
    return TEXAS_CITIES.filter((city) =>
      city.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [inputValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      onChange(val);
      setActiveIndex(-1);
      setIsOpen(val.length >= 2);
    },
    [onChange]
  );

  const selectCity = useCallback(
    (city: string) => {
      setInputValue(city);
      onChange(city);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || filtered.length === 0) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex =
            activeIndex < filtered.length - 1 ? activeIndex + 1 : 0;
          setActiveIndex(nextIndex);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex =
            activeIndex > 0 ? activeIndex - 1 : filtered.length - 1;
          setActiveIndex(prevIndex);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < filtered.length) {
            selectCity(filtered[activeIndex]);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
        }
      }
    },
    [isOpen, filtered, activeIndex, selectCity]
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as
        | HTMLElement
        | undefined;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isOpen && inputValue.length >= 2;

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue.length >= 2) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `city-option-${activeIndex}` : undefined
        }
      />
      {showDropdown && (
        <ul ref={listRef} className={styles.dropdown} role="listbox">
          {filtered.length === 0 ? (
            <li className={styles.noResults}>No cities found</li>
          ) : (
            filtered.map((city, index) => (
              <li
                key={city}
                id={`city-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.item} ${index === activeIndex ? styles.itemActive : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCity(city);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {highlightMatch(city, inputValue)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
