import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SupabaseTest() {
  const { user, session, signIn, signUp, signOut, signInWithGoogle } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Test User');

  const testSupabaseConnection = async () => {
    setLoading(true);
    try {
      // Test basic Supabase connection
      const { data, error } = await supabase.from('user_profiles').select('count');
      
      if (error) {
        setTestResult(`Connection test failed: ${error.message} (Code: ${error.code})`);
      } else {
        setTestResult('Supabase connection successful!');
      }
    } catch (error: any) {
      setTestResult(`Connection test error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        setTestResult(`Sign up failed: ${error.message} (Code: ${error.code})`);
      } else {
        setTestResult('Sign up successful! Check your email for confirmation.');
      }
    } catch (error: any) {
      setTestResult(`Sign up error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuthSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setTestResult(`Sign in failed: ${error.message} (Code: ${error.code})`);
      } else {
        setTestResult('Sign in successful!');
      }
    } catch (error: any) {
      setTestResult(`Sign in error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setTestResult(`Google sign in failed: ${error.message} (Code: ${error.code})`);
      } else {
        setTestResult('Google sign in initiated!');
      }
    } catch (error: any) {
      setTestResult(`Google sign in error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserProfile = async () => {
    if (!user) {
      setTestResult('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        setTestResult(`User profile test failed: ${error.message} (Code: ${error.code})`);
      } else {
        setTestResult(`User profile found: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      setTestResult(`User profile test error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateUserProfile = async () => {
    if (!user) {
      setTestResult('No user logged in');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          username: user.email?.split('@')[0],
        });
      
      if (error) {
        setTestResult(`Create user profile failed: ${error.message} (Code: ${error.code})`);
      } else {
        setTestResult('User profile created successfully!');
      }
    } catch (error: any) {
      setTestResult(`Create user profile error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Current User Status</h3>
            {user ? (
              <div className="bg-green-100 p-4 rounded">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
              </div>
            ) : (
              <div className="bg-red-100 p-4 rounded">
                <p>No user logged in</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Controls</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={testSupabaseConnection} disabled={loading}>
                {loading ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button onClick={testAuthSignUp} disabled={loading}>
                {loading ? 'Signing up...' : 'Test Sign Up'}
              </Button>
              <Button onClick={testAuthSignIn} disabled={loading}>
                {loading ? 'Signing in...' : 'Test Sign In'}
              </Button>
              <Button onClick={testGoogleSignIn} disabled={loading}>
                {loading ? 'Signing in...' : 'Test Google Sign In'}
              </Button>
              <Button onClick={testUserProfile} disabled={loading || !user}>
                {loading ? 'Testing...' : 'Test User Profile'}
              </Button>
              <Button onClick={testCreateUserProfile} disabled={loading || !user}>
                {loading ? 'Creating...' : 'Create User Profile'}
              </Button>
              <Button onClick={signOut} variant="destructive" disabled={!user}>
                Sign Out
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Test Result</h3>
            <div className="bg-muted p-4 rounded min-h-[100px] max-h-[300px] overflow-auto">
              <pre className="text-sm">{testResult || 'Run a test to see results'}</pre>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Login Form</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Test User"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}