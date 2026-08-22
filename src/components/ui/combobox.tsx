"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  options: { value: string; label: string; searchTerms?: string }[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

const customFilter = (value: string, search: string) => {
  if (!search) return 1;
  const searchClean = search.toLowerCase().trim();
  if (!searchClean) return 1;

  const valueLower = value.toLowerCase();
  const tokens = searchClean.split(/\s+/).filter(Boolean);
  const allMatch = tokens.every((token) => valueLower.includes(token));
  return allMatch ? 1 : 0;
};

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const filteredOptions = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    const tokens = q.split(/\s+/).filter(Boolean);

    return options.filter((option) => {
      const haystack = `${option.label} ${option.value} ${option.searchTerms || ""}`.toLowerCase();

      return tokens.every((token) => {
        // If token consists of digits (e.g. phone number or agreement number), require exact digit substring match
        const digitsOnly = token.replace(/\D/g, "");
        if (digitsOnly.length >= 3) {
          const haystackDigits = haystack.replace(/\D/g, "");
          if (haystackDigits.includes(digitsOnly)) return true;
        }

        // Substring / word match
        return haystack.includes(token);
      });
    });
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal bg-background h-10 text-[13px] px-3 border-border/60 hover:bg-muted/10", className)}
        >
          <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 border border-border-strong bg-popover shadow-elevated rounded-lg overflow-hidden" 
        align="start"
        side="bottom"
        sideOffset={4}
        style={{ width: "var(--radix-popover-trigger-width)", minWidth: "max(100%, 340px)" }}
      >
        <Command className="w-full" shouldFilter={false}>
          <CommandInput 
            value={search} 
            onValueChange={setSearch} 
            placeholder={searchPlaceholder} 
            className="text-[13px] h-9 border-none focus:ring-0" 
          />
          <CommandList className="max-h-[250px] overflow-y-auto w-full p-1">
            {filteredOptions.length === 0 && (
              <CommandEmpty className="py-3.5 text-center text-[12.5px] text-muted-foreground">{emptyText}</CommandEmpty>
            )}
            <CommandGroup className="p-0">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between text-[12.5px] px-2.5 py-2 cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground transition-colors"
                >
                  <span className="truncate flex-1 pr-2">{option.label}</span>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 opacity-70",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
