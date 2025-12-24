import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Badge } from '../components/ui/badge';
import { Plus, Trash2, Loader2, FolderTree, Layers } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategory, setNewSubcategory] = useState({ name: '', category_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/subcategories`),
      ]);
      setCategories(catRes.data);
      setSubcategories(subRes.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/categories`, { name: newCategoryName });
      toast.success('Category created successfully');
      setIsCategoryDialogOpen(false);
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/subcategories`, newSubcategory);
      toast.success('Sub-category created successfully');
      setIsSubcategoryDialogOpen(false);
      setNewSubcategory({ name: '', category_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create sub-category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (deletingItem.type === 'category') {
        await axios.delete(`${API}/categories/${deletingItem.id}`);
        toast.success('Category deleted successfully');
      } else {
        await axios.delete(`${API}/subcategories/${deletingItem.id}`);
        toast.success('Sub-category deleted successfully');
      }
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getSubcategoriesForCategory = (categoryId) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in" data-testid="categories-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl lg:text-5xl font-light tracking-tight text-primary">
              Categories
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage product categories and sub-categories
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-sm gap-2" data-testid="add-category-btn">
                  <FolderTree className="w-4 h-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl font-light">Add Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCategory} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Category Name
                    </Label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Fabrics"
                      data-testid="category-name-input"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="rounded-sm">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" className="btn-press rounded-sm" disabled={saving} data-testid="category-submit-btn">
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-press rounded-sm gap-2" data-testid="add-subcategory-btn">
                  <Plus className="w-4 h-4" />
                  Add Sub-category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl font-light">Add Sub-category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSubcategory} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Parent Category
                    </Label>
                    <Select 
                      value={newSubcategory.category_id} 
                      onValueChange={(value) => setNewSubcategory({ ...newSubcategory, category_id: value })}
                    >
                      <SelectTrigger data-testid="subcategory-parent-select">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Sub-category Name
                    </Label>
                    <Input
                      value={newSubcategory.name}
                      onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                      placeholder="e.g., Cotton"
                      data-testid="subcategory-name-input"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="rounded-sm">Cancel</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      className="btn-press rounded-sm" 
                      disabled={saving || !newSubcategory.category_id}
                      data-testid="subcategory-submit-btn"
                    >
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-sm bg-primary flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Categories</p>
                <p className="font-serif text-3xl font-light">{categories.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-sm bg-accent flex items-center justify-center">
                <Layers className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sub-categories</p>
                <p className="font-serif text-3xl font-light">{subcategories.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-light">Category Structure</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-state py-12">
                <FolderTree className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-serif text-xl">No categories yet</h3>
                <p className="text-muted-foreground mt-2">Create your first category to get started</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {categories.map((category) => {
                  const subs = getSubcategoriesForCategory(category.id);
                  return (
                    <AccordionItem 
                      key={category.id} 
                      value={category.id}
                      className="border border-border/60 rounded-sm px-4"
                      data-testid={`category-${category.id}`}
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <FolderTree className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {subs.length} sub-categories
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-8 pb-2 space-y-2">
                          {subs.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No sub-categories</p>
                          ) : (
                            subs.map((sub) => (
                              <div 
                                key={sub.id}
                                className="flex items-center justify-between py-2 px-3 rounded-sm hover:bg-muted/50"
                                data-testid={`subcategory-${sub.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-muted-foreground" />
                                  <span>{sub.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => { setDeletingItem({ ...sub, type: 'subcategory' }); setIsDeleteDialogOpen(true); }}
                                  data-testid={`delete-subcategory-${sub.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))
                          )}
                          <div className="pt-2 border-t border-border/60 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { setDeletingItem({ ...category, type: 'category' }); setIsDeleteDialogOpen(true); }}
                              data-testid={`delete-category-${category.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Category
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-light">
                Delete {deletingItem?.type === 'category' ? 'Category' : 'Sub-category'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{deletingItem?.name}</strong>?
              {deletingItem?.type === 'category' && (
                <span className="block mt-2 text-destructive">
                  This will also delete all associated sub-categories.
                </span>
              )}
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="rounded-sm">Cancel</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                className="rounded-sm" 
                onClick={handleDelete}
                data-testid="confirm-delete-btn"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
