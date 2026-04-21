'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480 }} id="search-bar">
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        className="input"
        placeholder="Search posts, tags, or topics..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ paddingLeft: 44 }}
      />
    </div>
  );
}
