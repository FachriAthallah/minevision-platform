"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type IndustrySelectOption = {
  value: string;
  label: string;
};

type IndustrySelectProps = {
  id: string;
  value: string;
  options: IndustrySelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
};

function optionId(selectId: string, optionValue: string) {
  return `${selectId}-option-${optionValue || "all"}`;
}

export function IndustrySelect({
  id,
  value,
  options,
  placeholder = "Pilih…",
  onChange,
  className,
}: IndustrySelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const selectedOption = options.find((option) => option.value === value);
  const activeOption = options[activeIndex];

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !activeOption || !listRef.current) {
      return;
    }

    const activeElement = listRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;

    activeElement?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, activeOption, open]);

  function openList() {
    const selectedIndex = selectedOption
      ? options.indexOf(selectedOption)
      : -1;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function selectOption(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        if (activeOption) {
          selectOption(activeOption.value);
        }
      } else {
        openList();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((current) =>
        current + 1 < options.length ? current + 1 : current,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((current) => (current > 0 ? current - 1 : current));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-activedescendant={
          open && activeOption ? optionId(id, activeOption.value) : undefined
        }
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-4 text-left text-sm text-foreground outline-none transition-colors hover:border-brand-cyan/40 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 motion-reduce:transition-none"
      >
        <span className={cn("truncate", !selectedOption && "text-muted-foreground/75")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          id={`${id}-listbox`}
          ref={listRef}
          role="listbox"
          aria-label={placeholder}
          className="mv-select-panel absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-[#08172a] p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.42)]"
        >
          {options.map((option, optionIndex) => {
            const selected = option.value === value;
            const active = optionIndex === activeIndex;

            return (
              <li
                key={option.value}
                id={optionId(id, option.value)}
                role="option"
                aria-selected={selected}
                data-active={active || undefined}
                onPointerDown={(event) => {
                  event.preventDefault();
                  selectOption(option.value);
                }}
                onPointerEnter={() => setActiveIndex(optionIndex)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors motion-reduce:transition-none",
                  selected
                    ? "bg-brand-cyan/15 font-bold text-brand-cyan"
                    : active
                      ? "bg-brand-cyan/10 text-foreground"
                      : "text-muted-foreground hover:bg-brand-cyan/10 hover:text-foreground",
                )}
              >
                <span className="truncate">{option.label}</span>
                {selected ? (
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}