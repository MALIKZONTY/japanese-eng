import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, HeartOff, Eye, Bookmark } from 'lucide-react';
import { wordService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch only favorites (fetch limit 100 for offline feel)
  const { data: favoritesData, isLoading } = useQuery({
    queryKey: ['favorites-list'],
    queryFn: () => wordService.getWords({ isFavorite: true, limit: 100 })
  });

  // Remove Favorite Mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (id: string) => wordService.removeFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites-list'] });
      queryClient.invalidateQueries({ queryKey: ['favorites-count'] });
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      toast.success('Removed from favorites.');
    },
    onError: () => {
      toast.error('Failed to update favorite status.');
    }
  });

  const favorites = favoritesData?.words || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Heart className="h-7 w-7 text-rose-500 fill-current" />
          Favorite Vocabulary
        </h2>
        <p className="text-muted-foreground text-sm font-medium mt-0.5">
          Your bookmarked Japanese expressions and vocabulary words
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-border/40 bg-card/45 h-36">
              <CardContent className="p-6 space-y-4">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/20 rounded-2xl bg-card/10">
          <Heart className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-bold text-foreground">No favorite words</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Tap the heart icon on any word in the dictionary to keep them handy here.
          </p>
          <Button onClick={() => navigate('/dictionary')} className="mt-4 bg-indigo-600">
            Browse Dictionary
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((word) => {
            const grpNames = word.groupIds?.map(g => typeof g === 'object' ? g.name : '').filter(Boolean).join(', ');
            
            return (
              <Card key={word._id} className="bg-card/45 border-border/45 hover:border-indigo-500/20 flex flex-col justify-between group">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <Link to={`/dictionary/${word._id}`} className="text-3xl font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors">
                        {word.romaji}
                      </Link>
                      
                      <button
                        onClick={() => removeFavoriteMutation.mutate(word._id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-950/20 transition-all"
                        title="Remove from favorites"
                      >
                        <Heart className="h-4.5 w-4.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">English: <span className="font-medium text-muted-foreground">{word.english}</span></p>
                    {word.telugu && (
                      <p className="text-sm font-bold text-foreground">Telugu: <span className="font-medium text-muted-foreground">{word.telugu}</span></p>
                    )}
                  </div>
                </CardContent>

                <div className="p-6 pt-0 border-t border-border/10 flex items-center justify-between gap-1.5 mt-2 bg-secondary/10 px-6 py-3">
                  <Link to={`/dictionary/${word._id}`}>
                    <Button size="sm" variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 px-2.5">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFavoriteMutation.mutate(word._id)}
                    className="text-xs text-muted-foreground hover:text-rose-400"
                  >
                    <HeartOff className="h-3.5 w-3.5 mr-1" />
                    Unfavorite
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
