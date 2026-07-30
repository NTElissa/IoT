import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ value, onChange, placeholder, required, minLength, className = '' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-border/10 px-3 py-2.5 pr-10 text-sm outline-none focus:border-teal-500 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

export default PasswordInput;
