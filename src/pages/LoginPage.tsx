import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const sessionExpired = (location.state as { sessionExpired?: boolean } | null)?.sessionExpired;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: 'admin@infnova.tech', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs tracking-widest text-ink-muted uppercase mb-2">INFNOVA Technologies</p>
          <h1 className="text-2xl font-semibold text-ink">Applicant Review</h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface border border-border rounded-lg p-6 shadow-sm space-y-4"
        >
          {sessionExpired && (
            <div className="text-sm bg-status-pending-bg text-status-pending border border-status-pending/30 rounded-md px-3 py-2">
              Your session expired. Please log in again.
            </div>
          )}
          {formError && (
            <div className="text-sm bg-status-rejected-bg text-status-rejected border border-status-rejected/30 rounded-md px-3 py-2">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-xs text-status-rejected mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="text-xs text-status-rejected mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md py-2 transition-colors disabled:opacity-60"
          >
            <LogIn size={16} />
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
