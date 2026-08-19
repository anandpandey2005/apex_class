'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { showToast } from '../../redux/slices/toastSlice';
import { useLoginMutation } from '../../redux/api/authApi';
import { setCredentials } from '../../redux/slices/authSlice';

export default function StudentLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loginMutation, { isLoading }] = useLoginMutation();

  React.useEffect(() => {
    if (token && isAuthenticated) {
      router.replace('/');
    }
  }, [token, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginMutation({ email, password }).unwrap();

      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      dispatch(
        showToast({
          message: `Welcome back ${res.data.user.name}! Connected to live database.`,
          type: 'success',
        })
      );

      router.push('/');
    } catch (err: any) {
      dispatch(
        showToast({
          message: err?.data?.message || 'Invalid student email or password',
          type: 'error',
        })
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-0">
            {process.env.NEXT_PUBLIC_INSTITUTE_NAME || 'Apex Coaching Institute'}
          </h1>
          <p className="text-xs text-zinc-500">Student Portal Sign-In</p>
        </div>

        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle>Sign In as Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Student Email Address</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email address"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Password</label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                {isLoading ? 'Authenticating with Database...' : 'Sign In to Student Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
