import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Plus, Trash2, Eye, Folder, Bookmark, X } from 'lucide-react';
import { groupService, wordService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Word } from '../types';

export const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [searchInner, setSearchInner] = React.useState('');
  const [selectedWordToAdd, setSelectedWordToAdd] = React.useState('');

  // Fetch Group details (populating wordIds list)
  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupService.getGroupById(id!),
    enabled: !!id
  });

  // Fetch all words in dictionary for the "Add Existing Word" dropdown selection
  const { data: allWordsData } = useQuery({
    queryKey: ['all-words-lookup'],
    queryFn: () => wordService.getWords({ limit: 100 }) // Fetch up to 100 for lookup
  });

  // Update Group Membership (Add/Remove words)
  const updateMembershipMutation = useMutation({
    mutationFn: (updatedWordIds: string[]) => groupService.updateGroup(id!, { wordIds: updatedWordIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['word'] }); // Invalidate word details group list
      setSelectedWordToAdd('');
      toast.success('Group membership updated.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update group membership.');
    }
  });

  const handleAddWord = () => {
    if (!selectedWordToAdd || !group) return;

    const currentWordIds = (group.wordIds as Word[]).map(w => w._id);
    if (currentWordIds.includes(selectedWordToAdd)) {
      toast.info('Word is already in this group.');
      return;
    }

    const newWordIds = [...currentWordIds, selectedWordToAdd];
    updateMembershipMutation.mutate(newWordIds);
  };

  const handleRemoveWord = (wordId: string) => {
    if (!group) return;
    const currentWordIds = (group.wordIds as Word[]).map(w => w._id);
    const newWordIds = currentWordIds.filter(id => id !== wordId);
    updateMembershipMutation.mutate(newWordIds);
  };

  if (isLoadingGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading group details...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-2xl">
        <p className="text-base text-muted-foreground font-bold">Group not found.</p>
        <Button onClick={() => navigate('/groups')} className="mt-4 bg-indigo-600">
          Go back to Groups
        </Button>
      </div>
    );
  }

  const groupWords = (group.wordIds as Word[]) || [];

  // Filter words inside group based on search input
  const filteredWords = groupWords.filter(w => {
    if (!searchInner.trim()) return true;
    const regex = new RegExp(searchInner.trim(), 'i');
    return regex.test(w.english) || regex.test(w.romaji) || (w.telugu && regex.test(w.telugu));
  });

  // Filter available words for addition (exclude words already in group)
  const existingWordIds = groupWords.map(w => w._id);
  const availableWords = (allWordsData?.words || []).filter(w => !existingWordIds.includes(w._id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Header and Back navigation */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/groups')}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Groups
        </Button>
        <h2 className="text-3xl font-extrabold tracking-tight">Group Details</h2>
      </div>

      {/* Group Title and description */}
      <Card className="glass relative overflow-hidden">
        <div className="absolute right-4 top-4 text-violet-400 opacity-5">
          <Folder className="h-32 w-32" />
        </div>
        <CardContent className="p-6 md:p-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Folder className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-foreground">{group.name}</h3>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                {groupWords.length} {groupWords.length === 1 ? 'word' : 'words'} cataloged
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pt-2">
            {group.description || 'No description provided for this group.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Words cataloged in group */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base">Words in Group</h4>
            
            {/* Quick search within group */}
            {groupWords.length > 0 && (
              <div className="relative w-48 sm:w-64">
                <Input
                  type="text"
                  placeholder="Search group..."
                  value={searchInner}
                  onChange={(e) => setSearchInner(e.target.value)}
                  className="pl-3 pr-8 h-9 text-xs border-border bg-background"
                />
                {searchInner ? (
                  <button onClick={() => setSearchInner('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          {filteredWords.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-border/20 rounded-2xl bg-card/10 text-muted-foreground text-sm">
              <Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              {groupWords.length === 0 
                ? 'This group is empty. Add existing words using the panel.' 
                : 'No matches found within this group.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWords.map((item) => (
                <div 
                  key={item._id}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/40 hover:border-indigo-500/20 transition-all"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-baseline space-x-2">
                      <Link to={`/dictionary/${item._id}`} className="font-extrabold text-indigo-400 hover:underline text-lg">
                        {item.romaji}
                      </Link>
                    </div>
                    <p className="text-xs font-semibold text-foreground/80 mt-1 truncate">
                      {item.english} {item.telugu && `| ${item.telugu}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <Link to={`/dictionary/${item._id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-indigo-400 hover:bg-indigo-950/20">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveWord(item._id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Remove from group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add Existing Words */}
        <div className="space-y-4">
          <Card className="bg-card/45 border-border/40">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">Add Words to Group</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add vocabulary already stored in your dictionary to this group.
              </p>

              {availableWords.length === 0 ? (
                <div className="text-xs text-muted-foreground/60 bg-secondary/20 p-3 rounded-lg border border-border/20">
                  No other words available to add. Create new words in the Dictionary first!
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedWordToAdd}
                    onChange={(e) => setSelectedWordToAdd(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus:ring-indigo-500"
                  >
                    <option value="">Select a word...</option>
                    {availableWords.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.romaji} ({w.english})
                      </option>
                    ))}
                  </select>
                  
                  <Button
                    onClick={handleAddWord}
                    disabled={!selectedWordToAdd || updateMembershipMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Word to Group
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
