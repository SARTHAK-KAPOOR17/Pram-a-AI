import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card.jsx';
import api from '../services/api.js';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.token) {
        localStorage.setItem('pramana_token', response.data.token);
      }
      navigate('/dashboard');
    } catch (err) {
      // For local development when backend MongoDB is offline, allow demo bypass
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('qa.lead@pramana.ai');
    setPassword('PramanaSecure2026!');
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-800/80 items-center justify-center text-teal-400 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
            Sign in to Pramāṇa AI
          </h2>
          <p className="text-xs text-slate-400">
            Intelligent Verification & Self-Healing Testing Console
          </p>
        </div>

        <Card className="border-slate-800 bg-surface-900/90 shadow-xl">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Enter your credentials to access your testing workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="mt-1 text-teal-400 underline hover:text-teal-300 block font-mono text-[11px]"
                  >
                    Continue to Dashboard in Preview Mode &rarr;
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="developer@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="text-teal-400 hover:text-teal-300 font-mono transition-colors"
                >
                  Fill Demo Credentials
                </button>
                <a href="#forgot" className="text-slate-400 hover:text-slate-300">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-teal-400 hover:text-teal-300 font-medium">
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
