import { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchResult } from './stockAnalyzer.types';
import { searchTickers } from './stockAnalyzer.api';

interface UseStockSearchOptions {
  onClear?: () => void;
  onSelect?: (stock: SearchResult) => void;
}

interface UseStockSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  setQueryWithoutSearch: (query: string) => void;
  suggestions: SearchResult[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectedStock: SearchResult | null;
  searchLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
  handleSelect: (stock: SearchResult) => void;
  handleClear: () => void;
  resetForNewSearch: () => void;
}

export function useStockSearch(
  options?: UseStockSearchOptions
): UseStockSearchReturn {
  const { onClear, onSelect } = options ?? {};
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  // Permet de définir la query sans déclencher de recherche (ex: chargement depuis URL)
  const setQueryWithoutSearch = useCallback((newQuery: string) => {
    // On marque un selectedStock factice pour bloquer la recherche
    setSelectedStock({ symbol: newQuery, name: '', type: '', region: '', currency: '' });
    setQuery(newQuery);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length >= 2 && !selectedStock) {
      setSearchLoading(true);
      searchTimeout.current = setTimeout(async () => {
        const results = await searchTickers(query);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSearchLoading(false);
      }, 400);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);
    }
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, selectedStock]);

  const handleSelect = useCallback((stock: SearchResult) => {
    setSelectedStock(stock);
    setQuery(`${stock.symbol} — ${stock.name}`);
    setShowSuggestions(false);
    setSuggestions([]);
    onSelect?.(stock);
  }, [onSelect]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedStock(null);
    setSuggestions([]);
    inputRef.current?.focus();
    onClear?.();
  }, [onClear]);

  // Reset pour permettre une nouvelle recherche après une analyse
  const resetForNewSearch = useCallback(() => {
    setSelectedStock(null);
    setSuggestions([]);
  }, []);

  return {
    query,
    setQuery,
    setQueryWithoutSearch,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectedStock,
    searchLoading,
    inputRef,
    suggestionsRef,
    handleSelect,
    handleClear,
    resetForNewSearch,
  };
}
