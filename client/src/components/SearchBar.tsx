import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search your recordings' }: SearchBarProps) {
    return (
        <div className="relative">
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                size={20}
            />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="
          w-full pl-10 pr-4 py-2.5 
          bg-[var(--color-bg-secondary)] 
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-tertiary)]
          border border-[var(--color-border)]
          rounded-full
          outline-none
          transition-all duration-200
          focus:border-[var(--color-accent)]
        "
            />
        </div>
    );
}
