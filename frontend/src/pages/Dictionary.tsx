import * as React from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Heart, 
  Trash2, 
  Eye, 
  Sparkles, 
  Bookmark, 
  Folder, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Edit2,
  ArrowLeftRight
} from 'lucide-react';
import { wordService, groupService, searchService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { Word, AIResponse } from '../types';

export const Dictionary: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search parameters from URL
  const searchQuery = searchParams.get('search') || '';
  const selectedGroup = searchParams.get('groupId') || '';
  const filterFavorite = searchParams.get('isFavorite') === 'true';
  const dictionaryMode = (searchParams.get('mode') as 'romaji' | 'english') || 'romaji';

  // Scroll container ref and alphabet list
  const containerRef = React.useRef<HTMLDivElement>(null);
  const alphabet = React.useMemo(() => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
  }, []);

  // Input state for search
  const [searchInput, setSearchInput] = React.useState(searchQuery);

  // Dialog State
  const [deleteWordId, setDeleteWordId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch groups for filter dropdown
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupService.getGroups()
  });

  // Query: Either fetch general words (alphabetical index) OR perform search query (AI or local)
  const { data: wordsData, isLoading: isLoadingWords, refetch: refetchWords, isRefetching } = useQuery({
    queryKey: ['words-list', searchQuery, selectedGroup, filterFavorite, dictionaryMode],
    queryFn: async () => {
      // If there is an active search, call search endpoint
      if (searchQuery.trim()) {
        const searchResult = await searchService.search(searchQuery.trim());
        // Sort search results alphabetically on the frontend based on active mode
        const sortedResults = [...searchResult.results].sort((a, b) => {
          const valA = dictionaryMode === 'romaji' ? (a.romaji || '') : (a.english || '');
          const valB = dictionaryMode === 'romaji' ? (b.romaji || '') : (b.english || '');
          return valA.localeCompare(valB, 'en', { sensitivity: 'base' });
        });
        return {
          source: searchResult.source,
          words: sortedResults,
          totalWords: searchResult.results.length,
          totalPages: 1,
          page: 1
        };
      } else {
        // Fetch ALL matched local words (using limit: 0) sorted alphabetically by dictionaryMode
        const res = await wordService.getWords({
          page: 1,
          limit: 0,
          groupId: selectedGroup || undefined,
          isFavorite: filterFavorite || undefined,
          sortBy: dictionaryMode,
          sortOrder: 'asc'
        });
        return {
          source: 'local' as const,
          words: res.words,
          totalWords: res.totalWords,
          totalPages: 1,
          page: 1
        };
      }
    }
  });

  // Update input when search query param changes
  React.useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Handle filter changes
  const updateFilters = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, val);
      }
    });
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  // Toggle Favorite Mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFav }: { id: string; isFav: boolean }) => {
      if (isFav) {
        return wordService.removeFavorite(id);
      } else {
        return wordService.addFavorite(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      queryClient.invalidateQueries({ queryKey: ['favorites-count'] });
      queryClient.invalidateQueries({ queryKey: ['words-count'] });
      toast.success('Favorite status updated!');
    },
    onError: () => {
      toast.error('Failed to update favorite status.');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => wordService.deleteWord(id),
    onSuccess: () => {
      toast.success('Word deleted successfully.');
      setDeleteWordId(null);
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      queryClient.invalidateQueries({ queryKey: ['words-count'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete word.');
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleDeleteConfirm = () => {
    if (!deleteWordId) return;
    setIsDeleting(true);
    deleteMutation.mutate(deleteWordId);
  };

  // Save AI word mutation
  const saveAIWordMutation = useMutation({
    mutationFn: (word: Partial<Word>) => wordService.createWord(word),
    onSuccess: (data) => {
      toast.success('Word saved to local library!');
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      queryClient.invalidateQueries({ queryKey: ['words-count'] });
      
      // Clear search to show local list, or redirect to details
      updateFilters({ search: null });
      navigate(`/dictionary/${data._id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save word.');
    }
  });

  const source = wordsData?.source || 'local';
  const words = wordsData?.words || [];
  const totalPages = wordsData?.totalPages || 1;

  // Group words alphabetically by selected mode
  const groupedWords = React.useMemo(() => {
    const groups: { [key: string]: Array<Word | AIResponse> } = {};
    const keyField = dictionaryMode === 'romaji' ? 'romaji' : 'english';
    
    words.forEach(item => {
      let char = '#';
      const val = item[keyField];
      if (val && val.trim().length > 0) {
        const firstLetter = val.trim().charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter)) {
          char = firstLetter;
        }
      }
      if (!groups[char]) {
        groups[char] = [];
      }
      groups[char].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => ({
      letter: key,
      words: groups[key]
    }));
  }, [words, dictionaryMode]);

  const groupedLetters = React.useMemo(() => {
    return groupedWords.map(g => g.letter);
  }, [groupedWords]);

  const scrollToSection = (letter: string) => {
    const element = document.getElementById(`section-${letter}`);
    const container = containerRef.current;
    if (element && container) {
      const topPos = element.offsetTop - container.offsetTop;
      container.scrollTo({ top: topPos, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner and Navigation Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/10 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Japanese Vocabulary</h2>
          <p className="text-muted-foreground text-sm font-medium mt-0.5">
            {source === 'ai' ? 'AI Generated Results' : 'Search and manage Japanese vocabulary'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Segmented Control Tabs */}
          <div className="flex bg-secondary/60 p-1 rounded-xl border border-border/15">
            <button
              onClick={() => updateFilters({ mode: 'romaji' })}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dictionaryMode === 'romaji'
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold cursor-pointer'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
            >
              Romaji Dict
            </button>
            <button
              onClick={() => updateFilters({ mode: 'english' })}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                dictionaryMode === 'english'
                  ? 'bg-indigo-600 text-white shadow-sm font-extrabold cursor-pointer'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
            >
              English Dict
            </button>
          </div>

          <Button
            onClick={() => navigate('/add')}
            className="bg-indigo-600 hover:bg-indigo-700 w-fit shrink-0 shadow-md shadow-indigo-950/20 h-9 text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Word
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search English, Telugu, Japanese, or Romaji..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-4 pr-10 border-border bg-background focus:ring-indigo-500"
              />
              <button 
                type="submit" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedGroup}
                onChange={(e) => updateFilters({ groupId: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-[160px]"
              >
                <option value="">All Groups</option>
                {groups?.map((g) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => updateFilters({ isFavorite: filterFavorite ? null : 'true' })}
                className={`h-10 w-10 flex items-center justify-center rounded-lg border transition-all ${
                  filterFavorite 
                    ? 'bg-rose-950/40 border-rose-800 text-rose-400' 
                    : 'border-border bg-background hover:bg-secondary text-muted-foreground'
                }`}
                title="Filter Favorites"
              >
                <Heart className={`h-4 w-4 ${filterFavorite ? 'fill-current' : ''}`} />
              </button>

              {(searchQuery || selectedGroup || filterFavorite) && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearFilters}
                  className="shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Results Section */}
      {isLoadingWords ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-border/40 bg-card/40 h-20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-8 bg-muted rounded w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/20 rounded-2xl bg-card/10">
          <Bookmark className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-bold text-foreground">No vocabulary matches</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            We couldn't find any words fitting your filter criteria. Try adding one or searching another term.
          </p>
          <Button onClick={() => navigate('/add')} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
            Add New Word
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* AI Banner */}
          {source === 'ai' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-950/20 border border-indigo-800 text-indigo-300">
              <Sparkles className="h-5 w-5 animate-pulse-subtle shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold">No local matches found!</span> Below is the translation generated by the AI. You can review and save this translation permanently to your dictionary.
              </div>
            </div>
          )}

          {/* Premium Scrollable Dictionary View with Sidebar Index */}
          <div className="flex gap-2 sm:gap-4 bg-card/30 border border-border/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-6 overflow-hidden">
            {/* Scrollable list */}
            <div 
              ref={containerRef} 
              className="flex-1 h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto pr-2 sm:pr-4 scroll-smooth space-y-6"
            >
              {groupedWords.map((group) => (
                <div key={group.letter} id={`section-${group.letter}`} className="relative">
                  {/* Floating alphabetical header */}
                  <div className="sticky top-0 bg-background/95 backdrop-blur-md z-10 py-2 border-b border-border/20 text-xl font-black text-indigo-400 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="bg-indigo-950/60 border border-indigo-850 text-indigo-400 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold shadow-sm shadow-indigo-950/40">
                        {group.letter}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold font-mono">
                        {group.words.length} {group.words.length === 1 ? 'word' : 'words'}
                      </span>
                    </div>
                  </div>

                  {/* List of words */}
                  <div className="space-y-2">
                    {group.words.map((item, idx) => {
                      const isAI = !('_id' in item);
                      if (isAI) {
                        const aiWord = item as AIResponse;
                        const primaryTitle = dictionaryMode === 'romaji' ? aiWord.romaji : aiWord.english;
                        const secondaryTitle = dictionaryMode === 'romaji' ? '' : aiWord.romaji;

                        return (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-900/30 bg-indigo-950/5 hover:bg-indigo-950/15 hover:border-indigo-800/50 transition-all duration-150 group"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-baseline gap-2.5">
                                <span className="text-lg font-black text-indigo-400">{primaryTitle}</span>
                                {secondaryTitle && (
                                  <span className="text-sm font-medium text-muted-foreground">{secondaryTitle}</span>
                                )}
                                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-900 shadow-sm shadow-indigo-950/20">
                                  AI
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                                {dictionaryMode === 'romaji' ? (
                                  <>
                                    <div><span className="font-bold text-foreground/80">Eng:</span> {aiWord.english}</div>
                                    {aiWord.telugu && (
                                      <div><span className="font-bold text-foreground/80">Tel:</span> {aiWord.telugu}</div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {aiWord.telugu && (
                                      <div><span className="font-bold text-foreground/80">Tel:</span> {aiWord.telugu}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveAIWordMutation.mutate(aiWord);
                                }}
                                isLoading={saveAIWordMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-xs shadow-md shadow-indigo-950/20 py-1 px-3"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        );
                      } else {
                        const localWord = item as Word;
                        const grpNames = localWord.groupIds
                          ?.map(g => typeof g === 'object' ? g.name : '')
                          .filter(Boolean)
                          .join(', ');
                        
                        const primaryTitle = dictionaryMode === 'romaji' ? localWord.romaji : localWord.english;
                        const secondaryTitle = dictionaryMode === 'romaji' ? '' : localWord.romaji;
                        
                        return (
                          <div 
                            key={localWord._id}
                            onClick={() => navigate(`/dictionary/${localWord._id}`)}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-border/20 bg-card/25 hover:bg-secondary/40 hover:border-indigo-500/30 transition-all duration-150 group cursor-pointer"
                          >
                            {/* Term and translations */}
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-baseline gap-2.5">
                                <span className="text-lg font-black text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                  {primaryTitle}
                                </span>
                                {secondaryTitle && (
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {secondaryTitle}
                                  </span>
                                )}
                                {grpNames && (
                                  <span className="text-[10px] text-indigo-400/90 font-semibold bg-indigo-950/40 border border-indigo-900/30 px-1.5 py-0.5 rounded-md truncate max-w-[120px] inline-block align-middle">
                                    {grpNames}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                                {dictionaryMode === 'romaji' ? (
                                  <>
                                    <div><span className="font-bold text-foreground/80">Eng:</span> {localWord.english}</div>
                                    {localWord.telugu && (
                                      <div><span className="font-bold text-foreground/80">Tel:</span> {localWord.telugu}</div>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {localWord.telugu && (
                                      <div><span className="font-bold text-foreground/80">Tel:</span> {localWord.telugu}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions and Chevron */}
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                              {/* Favorite Heart button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteMutation.mutate({ id: localWord._id, isFav: localWord.isFavorite });
                                }}
                                className={`p-1.5 rounded-lg hover:bg-secondary transition-all ${
                                  localWord.isFavorite ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground/45 hover:text-rose-450'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${localWord.isFavorite ? 'fill-current' : ''}`} />
                              </button>

                              {/* Edit & Delete Actions (hover on desktop, always visible on mobile) */}
                              <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 opacity-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/dictionary/${localWord._id}?edit=true`);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-indigo-400 transition-all"
                                  title="Edit Word"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteWordId(localWord._id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-rose-500 transition-all"
                                  title="Delete Word"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Details right chevron */}
                              <div className="p-1 text-muted-foreground/30 group-hover:text-indigo-400 transition-colors">
                                <ChevronRight className="h-5 w-5" />
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* A-Z Jump Sidebar Index */}
            <div className="flex flex-col justify-center items-center gap-0.5 text-[8px] sm:text-[10px] font-extrabold text-muted-foreground select-none border-l border-border/20 pl-1.5 sm:pl-3 shrink-0">
              {alphabet.map((letter) => {
                const isAvailable = groupedLetters.includes(letter);
                return (
                  <button
                    key={letter}
                    disabled={!isAvailable}
                    onClick={() => scrollToSection(letter)}
                    className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center rounded-full transition-all text-center ${
                      isAvailable 
                        ? 'text-indigo-400 hover:bg-indigo-950/60 hover:text-indigo-300 font-black cursor-pointer' 
                        : 'text-muted-foreground/20 cursor-default pointer-events-none'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Box */}
      <ConfirmDialog
        isOpen={deleteWordId !== null}
        title="Delete Vocabulary"
        description="Are you absolutely sure you want to delete this word from your dictionary? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteWordId(null)}
      />
    </div>
  );
};
