import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  FolderHeart, 
  Heart, 
  History, 
  Plus, 
  Search, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Bookmark,
  Languages
} from 'lucide-react';
import { wordService, groupService, historyService, searchService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Word, AIResponse } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch words total
  const { data: wordsData } = useQuery({
    queryKey: ['words-count'],
    queryFn: () => wordService.getWords({ limit: 1 })
  });

  // Fetch favorites total
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites-count'],
    queryFn: () => wordService.getWords({ isFavorite: true, limit: 1 })
  });

  // Fetch groups total
  const { data: groupsData } = useQuery({
    queryKey: ['groups-count'],
    queryFn: () => groupService.getGroups()
  });

  // Fetch search history
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['history'],
    queryFn: () => historyService.getHistory(6)
  });

  // Save AI translations mutation
  const saveWordMutation = useMutation({
    mutationFn: (newWord: Partial<Word>) => wordService.createWord(newWord),
    onSuccess: (data) => {
      toast.success('Vocabulary saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['words-count'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      navigate(`/dictionary/${data._id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save vocabulary.');
    }
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Redirect to dictionary page with search query
    navigate(`/dictionary?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRecentSearchClick = (q: string) => {
    navigate(`/dictionary?search=${encodeURIComponent(q)}`);
  };

  const totalWords = wordsData?.totalWords || 0;
  const totalFavorites = favoritesData?.totalWords || 0;
  const totalGroups = groupsData?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">
            Konnichiwa!
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">
            Welcome back to your personal Japanese learning dashboard.
          </p>
        </div>

        <Button 
          onClick={() => navigate('/add')}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-md shadow-indigo-950/20 w-fit self-start md:self-center transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Quick Add Word
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="glass relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="absolute right-4 top-4 opacity-15 group-hover:scale-110 transition-transform duration-300 text-indigo-400">
              <BookOpen className="h-14 w-14" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Total Words</p>
            <h3 className="text-4xl font-extrabold text-foreground mt-2">{totalWords}</h3>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mt-4">
              <span>View dictionary</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
            <Link to="/dictionary" className="absolute inset-0" aria-label="Go to Dictionary" />
          </CardContent>
        </Card>

        <Card className="glass relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="absolute right-4 top-4 opacity-15 group-hover:scale-110 transition-transform duration-300 text-rose-400">
              <Heart className="h-14 w-14" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Favorites</p>
            <h3 className="text-4xl font-extrabold text-foreground mt-2">{totalFavorites}</h3>
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mt-4">
              <span>View favorites</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
            <Link to="/favorites" className="absolute inset-0" aria-label="Go to Favorites" />
          </CardContent>
        </Card>

        <Card className="glass relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="absolute right-4 top-4 opacity-15 group-hover:scale-110 transition-transform duration-300 text-violet-400">
              <FolderHeart className="h-14 w-14" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Word Groups</p>
            <h3 className="text-4xl font-extrabold text-foreground mt-2">{totalGroups}</h3>
            <div className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold mt-4">
              <span>View groups</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
            <Link to="/groups" className="absolute inset-0" aria-label="Go to Groups" />
          </CardContent>
        </Card>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Search & AI Hub */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/35 border-border/45 backdrop-blur-md hover:border-indigo-500/20 transition-all duration-300">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-400" />
                Quick Dictionary Search
              </h4>
              <p className="text-sm text-muted-foreground">
                Search local database first. If not found, AI translates automatically. Supports English, Telugu, Japanese, and Romaji.
              </p>

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Type e.g., friend, arigatou, ధన్యవాదాలు..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4 pr-10 border-border bg-background focus:ring-indigo-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Languages className="h-4 w-4" />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all shadow-md shrink-0"
                >
                  Search
                </Button>
              </form>
              <div className="flex flex-wrap gap-2 text-xs items-center pt-2">
                <span className="text-muted-foreground font-medium">Try:</span>
                {['friend', 'arigatou', 'ధన్యవాదాలు', 'bye'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSearchQuery(s)}
                    className="bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground px-2 py-0.5 rounded-md transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Learning Tip */}
          <Card className="bg-gradient-to-tr from-indigo-950/35 via-violet-950/20 to-card/60 border-indigo-900/35 overflow-hidden relative hover:scale-[1.005] hover:border-indigo-500/20 transition-all duration-300">
            <div className="absolute -right-12 -bottom-12 opacity-10 text-indigo-400">
              <Sparkles className="h-44 w-44 animate-pulse-subtle" />
            </div>
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                AI Smart Search System
              </div>
              <h4 className="font-extrabold text-lg text-foreground">How Search Works</h4>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                When you search a term not in your local library, the dictionary fetches a complete, professional translation card from the **Grok AI engine**, complete with Telugu translations, Romaji pronunciation, contextual usage notes, and related expressions. You can save any translation with a single click.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Search History */}
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/40 h-full flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <h4 className="font-bold text-lg flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-violet-400" />
                Recent Searches
              </h4>

              {!historyData || historyData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border/20 rounded-xl">
                  <Bookmark className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground/60">No recent searches</p>
                  <p className="text-xs text-muted-foreground/40 mt-0.5">Search queries log here</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
                  {historyData.map((hist) => (
                    <button
                      key={hist._id}
                      onClick={() => handleRecentSearchClick(hist.query)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/40 hover:border-indigo-500/50 hover:bg-accent/40 text-left transition-all duration-200 group active:scale-[0.99]"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <p className="font-semibold text-sm text-foreground truncate group-hover:text-indigo-400 transition-colors">
                          {hist.query}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(hist.searchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronArrowIcon />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

// Tiny subcomponent icon helper
const ChevronArrowIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className="h-4 w-4 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
  >
    <path 
      fillRule="evenodd" 
      d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.64 10 7.21 6.56a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z" 
      clipRule="evenodd" 
    />
  </svg>
);
