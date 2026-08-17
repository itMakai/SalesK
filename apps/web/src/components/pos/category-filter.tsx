"use client";

import { usePosStore } from "@/stores/pos-store";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);
  const setActiveCategory = usePosStore((state) => state.setActiveCategory);

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
      <Button
        variant={activeCategoryId === null ? "default" : "secondary"}
        className="rounded-full whitespace-nowrap shrink-0"
        onClick={() => setActiveCategory(null)}
      >
        All Products
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeCategoryId === cat.id ? "default" : "secondary"}
          className="rounded-full whitespace-nowrap shrink-0"
          onClick={() => setActiveCategory(cat.id)}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
