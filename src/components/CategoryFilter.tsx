'use client';

interface CategoryFilterProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
    }} id="category-filter">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`tag ${cat === active ? 'active' : ''}`}
          onClick={() => onChange(cat)}
          style={{
            fontWeight: cat === active ? 600 : 400,
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
