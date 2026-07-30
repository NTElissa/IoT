import React from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border/10 bg-surface py-2 pl-9 pr-8 text-sm outline-none focus:border-teal-500"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60"
        aria-label="Clear search"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export default SearchInput;
