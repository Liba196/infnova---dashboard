import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">INFNOVA Technologies</p>
            <h1 className="text-lg font-semibold text-ink leading-tight">Applicant Review</h1>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-ink-muted hidden sm:inline">{user.fullName}</span>}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink border border-border rounded-md px-3 py-1.5 transition-colors"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
