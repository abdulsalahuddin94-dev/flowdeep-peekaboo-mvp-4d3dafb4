import { useState, type KeyboardEvent } from "react";
import { X } from "@/lib/icons";

interface SkillsTagsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  id?: string;
}

export function SkillsTagsInput({ value, onChange, placeholder = "Type a skill and press Enter, Tab or double space", id }: SkillsTagsInputProps) {
  const [input, setInput] = useState("");
  const [lastSpace, setLastSpace] = useState(false);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) {
      setInput("");
      setLastSpace(false);
      return;
    }
    onChange([...value, tag]);
    setInput("");
    setLastSpace(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((v) => v !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addTag(input);
      return;
    }
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }
  }

  function handleChange(text: string) {
    if (text.endsWith("  ")) {
      const candidate = text.slice(0, -2);
      addTag(candidate);
      return;
    }
    if (text.endsWith(" ")) {
      setLastSpace(true);
    } else {
      setLastSpace(false);
    }
    setInput(text);
  }

  return (
    <div className="rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring focus-within:outline-none">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center justify-center rounded-full hover:bg-accent/20 focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
