"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

type TagInputProps = {
  name: string;
  placeholder: string;
  hint?: string;
  defaultValues?: string[];
};

export default function TagInput({
  name,
  placeholder,
  hint,
  defaultValues = [],
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>(defaultValues);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-xl border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-sm text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="text-primary/50 hover:text-primary"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={tags.length === 0 ? placeholder : "أضف المزيد..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
              setInputValue("");
            }
          }}
        />
        <input type="hidden" name={name} value={tags.join(", ")} />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
