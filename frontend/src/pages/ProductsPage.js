import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Pencil, Trash2, Search, Loader2, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    photo: '',
    category_id: '',
    sub_category_id: '',
    embroidery: false,
    jacquard: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filterCategory]);

  const fetchData = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/subcategories`),
      ]);
      setCategories(catRes.data);
      setSubcategories(subRes.data);
      await fetchProducts();
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategory) params.append('category_id', filterCategory);
      
      const response = await axios.get(`${API}/products?${params}`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, formData);
        toast.success('Product created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/products/${deletingProduct.id}`);
      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      photo: product.photo,
      category_id: product.category_id,
      sub_category_id: product.sub_category_id,
      embroidery: product.embroidery,
      jacquard: product.jacquard,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      photo: '',
      category_id: '',
      sub_category_id: '',
      embroidery: false,
      jacquard: false,
    });
  };

  const filteredSubcategories = subcategories.filter(
    sub => sub.category_id === formData.category_id
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in" data-testid="products-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl lg:text-5xl font-light tracking-tight text-primary">
              Products
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your product inventory
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="btn-press rounded-sm gap-2" data-testid="add-product-btn">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl font-light">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    SKU
                  </Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PROD-001"
                    className="font-mono"
                    data-testid="product-sku-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Photo URL
                  </Label>
                  <Input
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    data-testid="product-photo-input"
                    required
                  />
                  {formData.photo && (
                    <div className="mt-2 relative w-24 h-24 rounded-sm overflow-hidden border border-border">
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Category
                    </Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData({ ...formData, category_id: value, sub_category_id: '' })}
                    >
                      <SelectTrigger data-testid="product-category-select">
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
                      Sub-category
                    </Label>
                    <Select 
                      value={formData.sub_category_id} 
                      onValueChange={(value) => setFormData({ ...formData, sub_category_id: value })}
                      disabled={!formData.category_id}
                    >
                      <SelectTrigger data-testid="product-subcategory-select">
                        <SelectValue placeholder="Select sub-category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubcategories.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-sm">
                    <Label className="font-mono text-xs uppercase tracking-widest">Embroidery</Label>
                    <Switch
                      checked={formData.embroidery}
                      onCheckedChange={(checked) => setFormData({ ...formData, embroidery: checked })}
                      data-testid="product-embroidery-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-sm">
                    <Label className="font-mono text-xs uppercase tracking-widest">Jacquard</Label>
                    <Switch
                      checked={formData.jacquard}
                      onCheckedChange={(checked) => setFormData({ ...formData, jacquard: checked })}
                      data-testid="product-jacquard-switch"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="rounded-sm">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="btn-press rounded-sm" disabled={saving} data-testid="product-submit-btn">
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingProduct ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[200px]" data-testid="filter-category-select">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="border-border/60">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state py-16">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-serif text-xl">No products found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm || filterCategory ? 'Try adjusting your filters' : 'Add your first product to get started'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-mono text-xs uppercase tracking-widest">Photo</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest">SKU</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest">Category</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest">Sub-category</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest">Features</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="table-row-hover" data-testid={`product-row-${product.id}`}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-sm overflow-hidden border border-border">
                          <img src={product.photo} alt={product.sku} className="w-full h-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell>{product.sub_category_name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {product.embroidery && (
                            <Badge variant="secondary" className="badge-embroidery text-xs">Embroidery</Badge>
                          )}
                          {product.jacquard && (
                            <Badge variant="secondary" className="badge-jacquard text-xs">Jacquard</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            data-testid={`edit-product-${product.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setDeletingProduct(product); setIsDeleteDialogOpen(true); }}
                            data-testid={`delete-product-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-light">Delete Product</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{deletingProduct?.sku}</strong>? This action cannot be undone.
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
