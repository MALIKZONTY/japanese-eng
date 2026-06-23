import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Save, X, ArrowLeft, Languages, Heart } from 'lucide-react';
import { wordService, aiService, groupService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const AddWord: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Form Field States
  const [english, setEnglish] = React.useState('');
  const [telugu, setTelugu] = React.useState('');
  const [japanese, setJapanese] = React.useState('');
  const [romaji, setRomaji] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const [isFavorite, setIsFavorite] = React.useState(false);

  // AI Autofill Query Input
  const [aiQuery, setAiQuery] = React.useState('');

  // Fetch groups for assignment
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupService.getGroups()
  });

  // AI Autofill Mutation
  const autofillMutation = useMutation({
    mutationFn: (q: string) => aiService.autofill(q),
    onSuccess: (data) => {
      setEnglish(data.english);
      setTelugu(data.telugu);
      setJapanese(data.romaji); // Map to romaji
      setRomaji(data.romaji);
      setNotes(prev => data.notes ? data.notes : prev);
      
      // Store related words temporarily if needed
      if (data.relatedWords && data.relatedWords.length > 0) {
        // Stringify and append them to notes, excluding Japanese characters
        const listStr = data.relatedWords.map(rw => `- ${rw.english}: ${rw.romaji}`).join('\n');
        setNotes(prev => {
          const baseNotes = data.notes || prev;
          return `${baseNotes}\n\n[AI Suggested Related Expressions]\n${listStr}`;
        });
      }
      
      toast.success('Fields auto-filled successfully! Review and edit before saving.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'AI autofill failed. Please enter fields manually.');
    }
  });

  // Create Word Mutation
  const createWordMutation = useMutation({
    mutationFn: (newWord: any) => wordService.createWord(newWord),
    onSuccess: (data) => {
      toast.success('Word saved to dictionary successfully!');
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
      queryClient.invalidateQueries({ queryKey: ['words-count'] });
      navigate(`/dictionary/${data._id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save vocabulary.');
    }
  });

  const handleAutofillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) {
      toast.info('Please enter a word or query to autofill.');
      return;
    }
    autofillMutation.mutate(aiQuery.trim());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !romaji.trim()) {
      toast.error('English and Romaji are required fields.');
      return;
    }

    createWordMutation.mutate({
      english: english.trim(),
      telugu: telugu.trim(),
      japanese: romaji.trim(), // Map to romaji
      romaji: romaji.trim(),
      notes: notes.trim(),
      isFavorite,
      groupIds: selectedGroups
    });
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      
      {/* Header and Back navigation */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-3xl font-extrabold tracking-tight">Add Vocabulary</h2>
      </div>

      {/* AI Helper Banner Form */}
      <Card className="border-indigo-800/40 bg-indigo-950/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse-subtle" />
            <h3 className="font-bold text-base text-indigo-300">AI Auto Fill Helper</h3>
          </div>
          <p className="text-xs text-indigo-300/80 leading-relaxed">
            Enter a query (English, Japanese kana/kanji, Romaji, or Telugu) and hit "Auto Fill". Grok will translate, romanize, write Telugu, and draft usage notes instantly.
          </p>
          
          <form onSubmit={handleAutofillSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="e.g. excuse me, sumimasen, ధన్యవాదాలు..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="pl-4 pr-10 border-indigo-900 bg-background focus:ring-indigo-500 text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400">
                <Languages className="h-4 w-4" />
              </div>
            </div>
            <Button
              type="submit"
              isLoading={autofillMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
            >
              Auto Fill
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Main Vocabulary Entry Form */}
      <Card className="bg-card/45 border-border/40">
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  English Translation <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Friend / Goodbye"
                  value={english}
                  onChange={(e) => setEnglish(e.target.value)}
                  className="bg-background border-border"
                  required
                />
              </div>

              {/* Telugu */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Telugu Translation
                </label>
                <Input
                  type="text"
                  placeholder="e.g. స్నేహితుడు / వీడ్కోలు"
                  value={telugu}
                  onChange={(e) => setTelugu(e.target.value)}
                  className="bg-background border-border"
                />
              </div>

              {/* Romaji */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">
                  Romaji Pronunciation <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Tomodachi / Sayounara"
                  value={romaji}
                  onChange={(e) => setRomaji(e.target.value)}
                  className="bg-background border-border"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Usage Notes / Examples</label>
              <textarea
                placeholder="Describe usage context, honorific levels, or standard sample sentences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>

            {/* Favorite check */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isFavorite"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-border text-indigo-600 bg-background focus:ring-indigo-500"
              />
              <label htmlFor="isFavorite" className="text-sm font-semibold text-foreground select-none cursor-pointer flex items-center gap-1">
                <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'text-rose-500 fill-current' : 'text-muted-foreground'}`} />
                Mark as Favorite
              </label>
            </div>

            {/* Assign Groups */}
            {groups && groups.length > 0 && (
              <div className="space-y-2 border-t border-border/10 pt-4">
                <label className="text-sm font-semibold text-foreground">Assign to Groups</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {groups.map((group) => {
                    const isSelected = selectedGroups.includes(group._id);
                    return (
                      <button
                        key={group._id}
                        type="button"
                        onClick={() => handleGroupToggle(group._id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-indigo-950 border-indigo-600 text-indigo-400'
                            : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions Form Button */}
            <div className="flex items-center justify-end gap-3 border-t border-border/10 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dictionary')}
                disabled={createWordMutation.isPending}
              >
                <X className="h-4 w-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createWordMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-950/20"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Vocabulary
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};
