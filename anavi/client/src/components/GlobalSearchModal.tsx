import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Target, FolderOpen, Users, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";

const RECENT_KEY = "anavi_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try {
    const s = localStorage.getItem(RECENT_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

const typeIcons = {
  intent: Target,
  deal: FolderOpen,
  relationship: Users,
  match: FileText,
};

export function GlobalSearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isLoading } = trpc.search.global.useQuery(
    { query: debouncedQuery, limit: 20 },
    { enabled: debouncedQuery.length >= 2 }
  );

  const recentSearches = getRecentSearches();

  const handleSelect = useCallback(
    (url: string, q?: string) => {
      if (q) addRecentSearch(q);
      onOpenChange(false);
      setQuery("");
      setLocation(url);
    },
    [onOpenChange, setLocation]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Global Search</DialogTitle>
        <DialogDescription>Search intents, deals, relationships, matches</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 gap-0" showCloseButton>
        <Command className="rounded-lg border-0 [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-group]]:px-2" shouldFilter={false}>
      <CommandInput
        placeholder="Search intents, deals, relationships..."
        value={query}
        onValueChange={setQuery}
        aria-label="Search"
      />
      <CommandList>
        <CommandEmpty>
          {!debouncedQuery ? (
            recentSearches.length > 0 ? (
              <div className="py-4 px-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recent searches</p>
                {recentSearches.map((q) => (
                  <CommandItem
                    key={q}
                    value={q}
                    onSelect={() => {
                      setQuery(q);
                      setDebouncedQuery(q);
                    }}
                  >
                    {q}
                  </CommandItem>
                ))}
              </div>
            ) : (
              "Your recent searches will appear here."
            )
          ) : debouncedQuery.length < 2 ? (
            "Type at least 2 characters..."
          ) : isLoading ? (
            "Searching..."
          ) : (
            `No results for "${debouncedQuery}". Try a different search.`
          )}
        </CommandEmpty>
        {results && results.length > 0 && (
          <>
            <CommandGroup heading="Results">
              {results.map((r) => {
                const Icon = typeIcons[r.type];
                return (
                  <CommandItem
                    key={`${r.type}-${r.id}`}
                    value={`${r.type}-${r.id}-${r.title}`}
                    onSelect={() => handleSelect(r.url, debouncedQuery)}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{r.title}</span>
                      {r.subtitle && (
                        <span className="text-xs text-muted-foreground truncate">{r.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
