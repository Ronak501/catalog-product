import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Package, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '', role: 'user' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(loginData.email, loginData.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/catalog');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await register(registerData.email, registerData.password, registerData.name, registerData.role);
      toast.success(`Account created successfully!`);
      navigate(user.role === 'admin' ? '/admin' : '/catalog');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      {/* Hero Section */}
      <div className="hidden lg:block relative">
        <img
          src="https://images.pexels.com/photos/7147460/pexels-photo-7147460.jpeg"
          alt="Fashion design studio"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="hero-overlay absolute inset-0 flex flex-col justify-end p-12">
          <div className="animate-in stagger-1 opacity-0">
            <h1 className="font-serif text-5xl font-light text-white tracking-tight mb-4">
              The Atelier Archive
            </h1>
            <p className="text-white/80 text-lg font-sans max-w-md">
              Precision inventory management for textile excellence. Organize, track, and showcase your collection.
            </p>
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div className="flex items-center justify-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md animate-in stagger-2 opacity-0">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-2xl font-light">Atelier Archive</span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-border/60">
                <CardHeader className="space-y-1">
                  <CardTitle className="font-serif text-3xl font-light">Welcome back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="name@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="input-underline"
                        data-testid="login-email-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="input-underline pr-10"
                          data-testid="login-password-input"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-press rounded-sm" 
                      disabled={isLoading}
                      data-testid="login-submit-btn"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-border/60">
                <CardHeader className="space-y-1">
                  <CardTitle className="font-serif text-3xl font-light">Create account</CardTitle>
                  <CardDescription>Enter your details to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="input-underline"
                        data-testid="register-name-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Email
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="name@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="input-underline"
                        data-testid="register-email-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Password
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="input-underline"
                        data-testid="register-password-input"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Account Type
                      </Label>
                      <Select value={registerData.role} onValueChange={(value) => setRegisterData({ ...registerData, role: value })}>
                        <SelectTrigger data-testid="register-role-select" className="input-underline">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User (View Only)</SelectItem>
                          <SelectItem value="admin">Admin (Full Access)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full btn-press rounded-sm" 
                      disabled={isLoading}
                      data-testid="register-submit-btn"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
