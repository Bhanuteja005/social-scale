import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, Card } from '../components/UI';
import { LogIn, TrendingUp, Users, BarChart3, Zap } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden md:block text-white space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                <TrendingUp size={32} className="text-white" />
              </div>
              <h1 className="text-5xl font-bold">Social Scale</h1>
            </div>
            <p className="text-2xl text-white/90 font-light">
              Admin Dashboard for Social Media Management
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Company Management</h3>
                <p className="text-white/80 text-sm">Create and manage multiple client companies</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Analytics & Reporting</h3>
                <p className="text-white/80 text-sm">Comprehensive insights and performance tracking</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-pink-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Order Management</h3>
                <p className="text-white/80 text-sm">Process and track social media service orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md mx-auto md:mx-0">
          <Card className="bg-white shadow-md rounded-xl p-6">
            <div className="text-center mb-6">
            <div className="md:hidden flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Social Scale</h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Login
            </h2>
            <p className="text-gray-600">
              Sign in to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@socialscale.com"
                required
                autoComplete="email"
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-12"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <div className="flex-1 text-sm">{error}</div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn size={20} />
                  Sign In
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">Admin Access Only:</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p>📧 Email: <span className="font-mono bg-white px-2 py-0.5 rounded">admin@socialscale.com</span></p>
              <p>🔑 Password: <span className="font-mono bg-white px-2 py-0.5 rounded">Admin@12345</span></p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              This system is restricted to administrators only.
            </p>
          </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
