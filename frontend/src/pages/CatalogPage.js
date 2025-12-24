import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { 
  Package, 
  Search, 
  Loader2, 
  Filter, 
  X,
  LogOut,
  User,
  LayoutDashboard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    sub_category_id: '',
    embroidery: null,
    jacquard: null,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filters]);

  const fetchInitialData = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/subcategories`),
      ]);
      setCategories(catRes.data);
      setSubcategories(subRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.sub_category_id) params.append('sub_category_id', filters.sub_category_id);
      if (filters.embroidery !== null) params.append('embroidery', filters.embroidery);
      if (filters.jacquard !== null) params.append('jacquard', filters.jacquard);
      
      const response = await axios.get(`${API}/products?${params}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const clearFilters = () => {
    setFilters({
      category_id: '',
      sub_category_id: '',
      embroidery: null,
      jacquard: null,
    });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.category_id || filters.sub_category_id || filters.embroidery !== null || filters.jacquard !== null || searchTerm;

  const filteredSubcategories = subcategories.filter(
    sub => !filters.category_id || sub.category_id === filters.category_id
  );

  const FilterPanel = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Category
        </Label>
        <Select 
          value={filters.category_id} 
          onValueChange={(value) => setFilters({ ...filters, category_id: value, sub_category_id: '' })}
        >
          <SelectTrigger data-testid="catalog-category-filter">
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

      <div className="space-y-2">
        <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Sub-category
        </Label>
        <Select 
          value={filters.sub_category_id} 
          onValueChange={(value) => setFilters({ ...filters, sub_category_id: value })}
          disabled={!filters.category_id}
        >
          <SelectTrigger data-testid="catalog-subcategory-filter">
            <SelectValue placeholder="All Sub-categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sub-categories</SelectItem>
            {filteredSubcategories.map(sub => (
              <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Features
        </Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="embroidery"
              checked={filters.embroidery === true}
              onCheckedChange={(checked) => setFilters({ ...filters, embroidery: checked ? true : null })}
              data-testid="embroidery-checkbox"
            />
            <label htmlFor="embroidery" className="text-sm cursor-pointer">
              Embroidery
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="jacquard"
              checked={filters.jacquard === true}
              onCheckedChange={(checked) => setFilters({ ...filters, jacquard: checked ? true : null })}
              data-testid="jacquard-checkbox"
            />
            <label htmlFor="jacquard" className="text-sm cursor-pointer">
              Jacquard
            </label>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <Button 
          variant="outline" 
          className="w-full rounded-sm" 
          onClick={clearFilters}
          data-testid="clear-filters-btn"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background" data-testid="catalog-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/catalog" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-light hidden sm:block">Atelier Archive</span>
            </Link>

            <div className="flex items-center gap-4">
              {isAdmin() && (
                <Button 
                  variant="outline" 
                  className="rounded-sm hidden sm:flex"
                  onClick={() => navigate('/admin')}
                  data-testid="admin-dashboard-btn"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="user-menu-btn">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div>
                      <p>{user?.name}</p>
                      <p className="font-mono text-xs text-muted-foreground uppercase">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin() && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="sm:hidden">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 filter-panel">
              <h2 className="font-serif text-xl font-light mb-6">Filters</h2>
              <FilterPanel />
            </div>
          </aside>

          {/* Products Section */}
          <div className="flex-1">
            {/* Search and Mobile Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="catalog-search-input"
                />
              </div>
              
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden rounded-sm" data-testid="mobile-filter-btn">
                    <Filter className="w-4 h-4" />
                    {hasActiveFilters && (
                      <span className="ml-2 w-2 h-2 bg-accent rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle className="font-serif text-xl font-light">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{products.length}</span> products
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state py-24">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="font-serif text-2xl">No products found</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  {hasActiveFilters 
                    ? 'Try adjusting your filters or search term' 
                    : 'Products will appear here once added by an admin'}
                </p>
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    className="mt-6 rounded-sm" 
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="masonry-grid">
                {products.map((product, index) => (
                  <Card 
                    key={product.id}
                    className={`product-card border-border/60 overflow-hidden animate-in stagger-${(index % 4) + 1} opacity-0`}
                    data-testid={`catalog-product-${product.id}`}
                  >
                    <div className="aspect-product relative overflow-hidden bg-muted">
                      <img 
                        src={product.photo} 
                        alt={product.sku}
                        className="w-full h-full object-cover"
                      />
                      {(product.embroidery || product.jacquard) && (
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.embroidery && (
                            <Badge className="badge-embroidery text-xs">Embroidery</Badge>
                          )}
                          {product.jacquard && (
                            <Badge className="badge-jacquard text-xs">Jacquard</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="sku-badge mb-2">{product.sku}</p>
                      <div className="space-y-1">
                        <p className="font-medium">{product.category_name}</p>
                        <p className="text-sm text-muted-foreground">{product.sub_category_name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
