import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
      toast('Page not found. Redirected to Dashboard.', {
        icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
      <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-2">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
      </div>
      <h1 className="text-4xl font-bold text-slate-200">404</h1>
      <p className="text-slate-400 text-lg">Page not found</p>
      <p className="text-slate-500 text-sm">Redirecting to Dashboard…</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium text-sm transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
