import * as React from "react";
import { useTranslation } from "react-i18next";
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
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/i18n";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LanguageSwitcher({
  className,
  variant = "outline",
  size = "default",
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (languageCode: LanguageCode) => {
    i18n.changeLanguage(languageCode);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          role="combobox"
          aria-expanded={open}
          aria-label="Select language"
          className={cn("w-[140px] justify-between", className)}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="truncate">{currentLanguage.name}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {SUPPORTED_LANGUAGES.map((language) => (
                <CommandItem
                  key={language.code}
                  value={language.code}
                  onSelect={() => handleLanguageChange(language.code)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{language.flag}</span>
                    <span>{language.name}</span>
                  </span>
                  {i18n.language === language.code && (
                    <Check className="h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}