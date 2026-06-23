import * as React from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Heart, 
  Trash2, 
  Edit2, 
  FolderPlus, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  Save, 
  X, 
  Plus, 
  Folder 
} from 'lucide-react';
import { wordService, groupService, searchService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { Word, RelatedWord } from '../types';

export const WordDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode States
  const [isEditing, setIsEditing] = React.useState(searchParams.get('edit') === 'true');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = React.useState(false);

  // Edit Field States
  const [editEnglish, setEditEnglish] = React.useState('');
  const [editTelugu, setEditTelugu] = React.useState('');
  const [editJapanese, setEditJapanese] = React.useState('');
  const [editRomaji, setEditRomaji] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');

  // AI Related Expressions State
  const [aiRelated, setAiRelated] = React.useState<RelatedWord[]>([]);
  const [isFetchingRelated, setIsFetchingRelated] = React.useState(false);

  // Group selection state for Add to Group
  const [selectedGroupToAdd, setSelectedGroupToAdd] = React.useState('');

  // Update edit fields when edit state toggled
  React.useEffect(() => {
    setIsEditing(searchParams.get('edit') === 'true');
  }, [searchParams]);

  // Fetch word details
  const { data: word, isLoading: isLoadingWord, refetch: refetchWord } = useQuery({
    queryKey: ['word', id],
    queryFn: () => wordService.getWordById(id!),
    enabled: !!id
  });

  // Derived filtered suggestions list
  const linkedRomaji = React.useMemo(() => {
    if (!word) return [];
    return word.relatedWordIds.map((w: any) => typeof w === 'object' ? w.romaji : '');
  }, [word]);

  const suggestionsToShow = React.useMemo(() => {
    return aiRelated.filter(item => !linkedRomaji.includes(item.romaji));
  }, [aiRelated, linkedRomaji]);

  // Fetch groups for add to group options
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupService.getGroups()
  });

  // Populate edit fields when word data loads
  React.useEffect(() => {
    if (word) {
      setEditEnglish(word.english);
      setEditTelugu(word.telugu || '');
      setEditJapanese(word.japanese);
      setEditRomaji(word.romaji);
      setEditNotes(word.notes || '');
    }
  }, [word]);

  // Toggle Favorite Mutation
  const favoriteMutation = useMutation({
    mutationFn: (isFav: boolean) => {
      return isFav ? wordService.removeFavorite(id!) : wordService.addFavorite(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word', id] });
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      toast.success('Favorite status updated.');
    }
  });

  // Update Word Mutation
  const updateMutation = useMutation({
    mutationFn: (updatedFields: Partial<Word>) => wordService.updateWord(id!, updatedFields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word', id] });
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      setIsEditing(false);
      setSearchParams({});
      toast.success('Word updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update word.');
    }
  });

  // Delete Word Mutation
  const deleteMutation = useMutation({
    mutationFn: () => wordService.deleteWord(id!),
    onSuccess: () => {
      toast.success('Word deleted.');
      navigate('/dictionary');
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      queryClient.invalidateQueries({ queryKey: ['words-count'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete word.');
    }
  });

  // Add to Group Mutation
  const addToGroupMutation = useMutation({
    mutationFn: async ({ groupId, wordId }: { groupId: string; wordId: string }) => {
      const targetGroup = await groupService.getGroupById(groupId);
      const updatedWordIds = [...targetGroup.wordIds.map(w => typeof w === 'object' ? w._id : w), wordId];
      // Filter duplicates
      const uniqueWordIds = Array.from(new Set(updatedWordIds));
      return groupService.updateGroup(groupId, { wordIds: uniqueWordIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['word', id] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setIsGroupDialogOpen(false);
      setSelectedGroupToAdd('');
      toast.success('Added to group successfully.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add word to group.');
    }
  });

  // Save Related Word from AI suggestions
  const saveRelatedMutation = useMutation({
    mutationFn: async (rel: RelatedWord) => {
      // 1. Create the new word mapping japanese to romaji
      const created = await wordService.createWord({
        english: rel.english,
        japanese: rel.romaji, // Map to romaji
        romaji: rel.romaji,
        notes: `Related expression of "${word?.english}"`,
        relatedWordIds: [id as any] // Link to current word
      });

      // 2. Link this new word to current word
      if (word) {
        const currentRelated = word.relatedWordIds.map(w => typeof w === 'object' ? w._id : w);
        await wordService.updateWord(id!, {
          relatedWordIds: [...currentRelated, created._id]
        });
      }

      return created;
    },
    onSuccess: (created, variables) => {
      setAiRelated(prev => prev.filter(item => item.romaji !== variables.romaji));
      queryClient.invalidateQueries({ queryKey: ['word', id] });
      toast.success('Related expression saved and linked!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save related expression.');
    }
  });

  // Fetch AI Related Expressions
  const handleFindRelatedAI = async () => {
    if (!word) return;
    setIsFetchingRelated(true);
    try {
      const res = await searchService.searchRelated(word.english);
      
      // Filter out expressions that might already exist in our linked related expressions list
      const existingRomaji = word.relatedWordIds.map(w => typeof w === 'object' ? w.romaji : '');
      const filtered = res.relatedWords.filter(rw => !existingRomaji.includes(rw.romaji));
      
      setAiRelated(filtered);
      if (filtered.length === 0) {
        toast.info('No new related expressions suggestions found.');
      } else {
        toast.success(`Found ${filtered.length} related expressions suggestions!`);
      }
    } catch (err) {
      toast.error('Failed to fetch related expressions using AI.');
    } finally {
      setIsFetchingRelated(false);
    }
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEnglish.trim() || !editRomaji.trim()) {
      toast.error('English and Romaji are required.');
      return;
    }
    updateMutation.mutate({
      english: editEnglish.trim(),
      telugu: editTelugu.trim(),
      japanese: editRomaji.trim(), // Map to editRomaji
      romaji: editRomaji.trim(),
      notes: editNotes.trim(),
    });
  };

  if (isLoadingWord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading word details...</p>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl">
        <p className="text-base text-muted-foreground font-bold">Vocabulary word not found.</p>
        <Button onClick={() => navigate('/dictionary')} className="mt-4 bg-indigo-600">
          Go to Dictionary
        </Button>
      </div>
    );
  }

  // Format Dates
  const createdDate = new Date(word.createdAt).toLocaleDateString([], { dateStyle: 'medium' });
  const updatedDate = new Date(word.updatedAt).toLocaleDateString([], { dateStyle: 'medium' });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Navigation Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dictionary')}
          className="h-8 px-2 text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dictionary
        </Button>

        {!isEditing && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => favoriteMutation.mutate(word.isFavorite)}
              className={word.isFavorite ? 'text-rose-500 hover:text-rose-600 border-rose-950/20 bg-rose-950/10' : ''}
            >
              <Heart className={`h-4 w-4 mr-1.5 ${word.isFavorite ? 'fill-current' : ''}`} />
              {word.isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGroupDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1.5" />
              Add to Group
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Main Details Panel */}
      {isEditing ? (
        <Card className="bg-card/45 border-border/40">
          <CardContent className="p-6">
            <h3 className="font-extrabold text-lg mb-6 border-b border-border/10 pb-3 flex items-center gap-1.5">
              <Edit2 className="h-5 w-5 text-indigo-400" />
              Edit Word Details
            </h3>
            
            <form onSubmit={handleSaveUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">English Translation</label>
                  <Input
                    type="text"
                    value={editEnglish}
                    onChange={(e) => setEditEnglish(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Telugu Translation</label>
                  <Input
                    type="text"
                    value={editTelugu}
                    onChange={(e) => setEditTelugu(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Romaji Pronunciation</label>
                  <Input
                    type="text"
                    value={editRomaji}
                    onChange={(e) => setEditRomaji(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Usage Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setSearchParams({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Card details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass relative overflow-hidden">
              <div className="absolute right-4 top-4 text-indigo-400 opacity-5">
                <BookOpen className="h-40 w-40" />
              </div>
              
              <CardContent className="p-6 md:p-8 space-y-6">
                <div>
                  <span className="text-6xl font-extrabold tracking-tight text-indigo-400">
                    {word.romaji}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-border/10">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">English Meaning</span>
                    <p className="text-lg font-bold text-foreground mt-1">{word.english}</p>
                  </div>
                  {word.telugu && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telugu Meaning</span>
                      <p className="text-lg font-bold text-foreground mt-1">{word.telugu}</p>
                    </div>
                  )}
                </div>

                {word.notes && (
                  <div className="pt-6 border-t border-border/10">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usage Notes</span>
                    <p className="text-sm leading-relaxed text-foreground bg-secondary/20 p-4 rounded-xl border border-border/20 mt-2 whitespace-pre-wrap">
                      {word.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related expressions cards section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <span>Related Expressions</span>
                  <span className="text-xs font-semibold bg-secondary px-2.5 py-0.5 rounded-full text-muted-foreground">
                    {word.relatedWordIds.length} Linked
                  </span>
                </h3>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFindRelatedAI}
                  isLoading={isFetchingRelated}
                  className="bg-indigo-950/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 border-indigo-900 text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Find Suggestions with AI
                </Button>
              </div>

              {/* Linked Related Words grid */}
              {word.relatedWordIds.length === 0 && suggestionsToShow.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-border/20 rounded-xl bg-card/10 text-muted-foreground text-sm">
                  No related expressions linked. Click above to generate suggestions using AI.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Local linked ones */}
                  {word.relatedWordIds.map((item: any) => (
                    <Card key={item._id} className="border-border/40 hover:border-indigo-500/20 bg-card/25 flex flex-col justify-between">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <Link to={`/dictionary/${item._id}`} className="text-xl font-bold text-indigo-400 hover:underline">
                            {item.romaji}
                          </Link>
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            Linked
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-2">{item.english}</p>
                      </CardContent>
                    </Card>
                  ))}

                  {/* AI temporary suggestions */}
                  {suggestionsToShow.map((item, idx) => (
                    <Card key={idx} className="border-indigo-800/40 bg-indigo-950/5 hover:border-indigo-500/30 flex flex-col justify-between">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <span className="text-xl font-bold text-indigo-400">{item.romaji}</span>
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            Suggested
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground mt-2">{item.english}</p>
                      </CardContent>
                      <div className="p-4 pt-0 flex border-t border-border/10 justify-end gap-1.5 mt-2 bg-indigo-950/10">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => saveRelatedMutation.mutate(item)}
                          isLoading={saveRelatedMutation.isPending}
                          className="text-xs text-indigo-400 hover:text-indigo-300 p-0 h-8"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Save & Link
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Group and Date Meta */}
          <div className="space-y-6">
            
            {/* Groups List card */}
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">Word Groups</h4>
                
                {word.groupIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">This word is not in any groups.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {word.groupIds.map((g: any) => (
                      <Link 
                        key={g._id} 
                        to={`/groups/${g._id}`}
                        className="flex items-center space-x-2 text-xs font-semibold px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground transition-all border border-border/30"
                      >
                        <Folder className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{g.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date Details card */}
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-6 space-y-4 text-xs font-semibold">
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wide mb-2">History Log</h4>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created:</span>
                  <span className="text-foreground">{createdDate}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground border-t border-border/10 pt-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Modified:</span>
                  <span className="text-foreground">{updatedDate}</span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      )}

      {/* Delete Confirmation Box */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Word"
        description="Are you absolutely sure you want to delete this word? This will remove references to it from all groups."
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      {/* Add To Group overlay */}
      <ConfirmDialog
        isOpen={isGroupDialogOpen}
        title="Add to Group"
        description="Select a group to add this word to:"
        confirmText="Add to Group"
        cancelText="Cancel"
        variant="default"
        isLoading={addToGroupMutation.isPending}
        onConfirm={() => {
          if (!selectedGroupToAdd) {
            toast.error('Please select a group.');
            return;
          }
          addToGroupMutation.mutate({ groupId: selectedGroupToAdd, wordId: id! });
        }}
        onCancel={() => {
          setIsGroupDialogOpen(false);
          setSelectedGroupToAdd('');
        }}
      >
        <select
          value={selectedGroupToAdd}
          onChange={(e) => setSelectedGroupToAdd(e.target.value)}
          className="mt-4 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500"
        >
          <option value="">Select a Group...</option>
          {groups?.map((g) => (
            <option key={g._id} value={g._id}>{g.name}</option>
          ))}
        </select>
      </ConfirmDialog>
    </div>
  );
};
