import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Folder, Edit2, Trash2, ArrowRight, FolderHeart, X, Save } from 'lucide-react';
import { groupService } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { Group } from '../types';

export const Groups: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Mode & Edit States
  const [isOpenForm, setIsOpenForm] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null);
  const [groupName, setGroupName] = React.useState('');
  const [groupDesc, setGroupDesc] = React.useState('');
  const [deleteGroupId, setDeleteGroupId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch groups
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupService.getGroups()
  });

  // Create Group Mutation
  const createMutation = useMutation({
    mutationFn: (newGroup: Partial<Group>) => groupService.createGroup(newGroup),
    onSuccess: () => {
      toast.success('Group created successfully!');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups-count'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create group.');
    }
  });

  // Update Group Mutation
  const updateMutation = useMutation({
    mutationFn: (updatedFields: Partial<Group>) => groupService.updateGroup(editingGroup!._id, updatedFields),
    onSuccess: () => {
      toast.success('Group updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update group.');
    }
  });

  // Delete Group Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => groupService.deleteGroup(id),
    onSuccess: () => {
      toast.success('Group deleted successfully.');
      setDeleteGroupId(null);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups-count'] });
      // Invalidate words list because word group references might have changed
      queryClient.invalidateQueries({ queryKey: ['words-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete group.');
    },
    onSettled: () => {
      setIsDeleting(false);
    }
  });

  const handleEditClick = (group: any) => {
    // Cast because word count from list endpoint isn't fully nested
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDesc(group.description || '');
    setIsOpenForm(true);
  };

  const resetForm = () => {
    setGroupName('');
    setGroupDesc('');
    setEditingGroup(null);
    setIsOpenForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required.');
      return;
    }

    if (editingGroup) {
      updateMutation.mutate({
        name: groupName.trim(),
        description: groupDesc.trim()
      });
    } else {
      createMutation.mutate({
        name: groupName.trim(),
        description: groupDesc.trim(),
        wordIds: []
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteGroupId) return;
    setIsDeleting(true);
    deleteMutation.mutate(deleteGroupId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Vocabulary Groups</h2>
          <p className="text-muted-foreground text-sm font-medium mt-0.5">
            Organize Japanese vocabulary into custom categories, JLPT levels, or topics
          </p>
        </div>

        {!isOpenForm && (
          <Button
            onClick={() => setIsOpenForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-950/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Group
          </Button>
        )}
      </div>

      {/* Inline Creation/Editing Form Card */}
      {isOpenForm && (
        <Card className="border-indigo-800/40 bg-indigo-950/5">
          <CardContent className="p-6">
            <h3 className="font-extrabold text-base mb-4 flex items-center gap-1.5 text-indigo-300">
              <FolderHeart className="h-5 w-5" />
              {editingGroup ? 'Edit Group Properties' : 'Create New Vocabulary Group'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-indigo-300">Group Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Greetings, Travel, JLPT N5..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-indigo-300">Short Description</label>
                  <Input
                    type="text"
                    placeholder="e.g. Essential everyday greetings..."
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-indigo-950/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {editingGroup ? 'Save changes' : 'Create Group'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid of Groups */}
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
      ) : !groups || groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/20 rounded-2xl bg-card/10">
          <Folder className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-lg font-bold text-foreground">No groups created</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Organize words by creating groupings for Travel, Greetings, Food, Anime Vocabulary, etc.
          </p>
          <Button onClick={() => setIsOpenForm(true)} className="mt-4 bg-indigo-600">
            Create First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group._id} className="bg-card/45 border-border/45 hover:border-indigo-500/20 flex flex-col justify-between group relative overflow-hidden">
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <Link to={`/groups/${group._id}`} className="text-xl font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors">
                    {group.name}
                  </Link>
                  <span className="text-xs font-semibold bg-indigo-950/60 border border-indigo-900 px-2 py-0.5 rounded-full text-indigo-300">
                    {group.wordCount} {group.wordCount === 1 ? 'word' : 'words'}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                  {group.description || 'No description provided.'}
                </p>
              </CardContent>

              <div className="p-6 pt-0 border-t border-border/10 flex items-center justify-between gap-1.5 mt-2 bg-secondary/10 px-6 py-3">
                <Link to={`/groups/${group._id}`}>
                  <Button size="sm" variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 px-2.5">
                    Open Group
                    <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>

                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(group)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteGroupId(group._id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Box */}
      <ConfirmDialog
        isOpen={deleteGroupId !== null}
        title="Delete Group"
        description="Are you sure you want to delete this group? The words inside the group will NOT be deleted, only the group itself."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteGroupId(null)}
      />
    </div>
  );
};
