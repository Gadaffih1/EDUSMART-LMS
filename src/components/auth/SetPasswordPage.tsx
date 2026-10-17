import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function SetPasswordPage() {
  const [hasSession, setHasSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setErrorMessage(`Unable to validate invitation: ${error.message}`);
      setHasSession(Boolean(data.session));
      setIsCheckingSession(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!supabase || !hasSession) {
      setErrorMessage('Your invitation session is no longer valid. Open the latest invitation email.');
      return;
    }
    if (password.length < 12) {
      setErrorMessage('Use a password with at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (error) {
      setErrorMessage(`Unable to set your password: ${error.message}`);
      return;
    }
    setSuccessMessage('Password set. Redirecting to EduSmart…');
    window.setTimeout(() => window.location.replace('/'), 900);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose a strong password for your EduSmart account. Your password is stored and verified by Supabase Auth.
        </p>

        {isCheckingSession ? (
          <p className="mt-6 text-sm text-slate-600" role="status">Validating your invitation…</p>
        ) : !hasSession ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
            {errorMessage || 'No active invitation session was found. Open the latest invitation email to continue.'}
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              New password
              <span className="relative mt-1.5 block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Confirm password
              <span className="relative mt-1.5 block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </span>
            </label>

            {errorMessage && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {successMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || Boolean(successMessage)}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving password…' : 'Set password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
