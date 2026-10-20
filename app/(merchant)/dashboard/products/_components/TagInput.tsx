"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { tr } from "@/lib/i18n/dashboard";

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
        className="apple-field flex min-h-11 cursor-text flex-wrap items-center gap-1.5 px-2 py-1.5"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex h-7 items-center gap-1 rounded-full bg-card ps-3 pe-1 text-[13px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={tr("شيل {0}", tag)}
              className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" strokeWidth={2.4} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="min-w-20 flex-1 bg-transparent px-1.5 text-[15px] outline-none placeholder:text-muted-foreground"
          placeholder={tags.length === 0 ? placeholder : tr("أضف المزيد...")}
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
      {hint && <p className="px-1 text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
