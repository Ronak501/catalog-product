import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Package, FolderTree, Users, Layers } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Products', value: stats?.products || 0, icon: Package, color: 'bg-primary' },
    { label: 'Categories', value: stats?.categories || 0, icon: FolderTree, color: 'bg-accent' },
    { label: 'Sub-categories', value: stats?.subcategories || 0, icon: Layers, color: 'bg-primary' },
    { label: 'Users', value: stats?.users || 0, icon: Users, color: 'bg-accent' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in" data-testid="admin-dashboard">
        {/* Header */}
        <div>
          <h1 className="font-serif text-4xl lg:text-5xl font-light tracking-tight text-primary">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Overview of your product inventory
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.label} 
                className={`stat-card border-border/60 animate-in stagger-${index + 1} opacity-0`}
                data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`w-8 h-8 rounded-sm ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-serif text-4xl font-light">
                    {loading ? (
                      <div className="w-16 h-10 bg-muted animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Product Type Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-light">Embroidery Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl font-light text-accent">
                  {loading ? '...' : stats?.embroidery_products || 0}
                </span>
                <span className="text-muted-foreground">items</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Products with embroidery detailing
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-light">Jacquard Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl font-light text-primary">
                  {loading ? '...' : stats?.jacquard_products || 0}
                </span>
                <span className="text-muted-foreground">items</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Products with jacquard weaving
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
