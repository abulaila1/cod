import { ShieldOff, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export function AccountSuspended() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Account Suspended
          </h1>

          <p className="text-zinc-600 mb-6">
            Your workspace has been temporarily suspended. This may be due to a policy
            violation, payment issue, or administrative action.
          </p>

          <div className="bg-zinc-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">What you can do:</h3>
            <ul className="text-sm text-zinc-600 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-zinc-400 mt-0.5">1.</span>
                <span>Check your email for details about the suspension</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-400 mt-0.5">2.</span>
                <span>Contact our support team for assistance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-400 mt-0.5">3.</span>
                <span>Resolve any outstanding issues mentioned</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <a
              href="mailto:support@example.com"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          If you believe this is an error, please contact our support team immediately.
        </p>
      </div>
    </div>
  );
}
