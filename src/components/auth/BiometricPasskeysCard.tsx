import React, { useCallback, useEffect, useState } from 'react';
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, KeyRound, Plus, ShieldCheck, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ClientDataStore } from '../../utils/clientDataStore';

interface CredentialItem {
  id: string;
  credentialId: string;
  deviceLabel: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export const BiometricPasskeysCard: React.FC = () => {
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supported = typeof window !== 'undefined' && browserSupportsWebAuthn();

  const loadCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/webauthn/credentials', {
        credentials: 'include',
        headers: ClientDataStore.getAuthHeaders(),
      });
      if (!res.ok) {
        setCredentials([]);
        return;
      }
      const body = await res.json();
      setCredentials(Array.isArray(body.credentials) ? body.credentials : []);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCredentials();
  }, [loadCredentials]);

  const handleEnrollBiometric = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!supported) {
      setErrorMsg('WebAuthn / Biometric passkeys are not supported in this browser or context.');
      return;
    }

    setRegistering(true);
    try {
      const optRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        credentials: 'include',
        headers: ClientDataStore.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({}),
      });
      const optBody = await optRes.json().catch(() => ({}));
      if (!optRes.ok || !optBody?.options) {
        setErrorMsg(optBody?.error || 'Could not start biometric registration.');
        return;
      }

      const attestation = await startRegistration({ optionsJSON: optBody.options });
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        credentials: 'include',
        headers: ClientDataStore.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          challengeId: optBody.challengeId,
          attestationResponse: attestation,
          deviceLabel: deviceLabel.trim() || undefined,
        }),
      });
      const verifyBody = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyBody?.success) {
        setErrorMsg(verifyBody?.error || 'Device biometric verification did not complete.');
        return;
      }

      setDeviceLabel('');
      setSuccessMsg(`Biometric passkey "${verifyBody.credential?.deviceLabel}" registered on this device.`);
      await loadCredentials();
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setErrorMsg('Biometric prompt was dismissed or blocked by browser permissions.');
      } else {
        setErrorMsg(err?.message || 'Unable to register biometric passkey.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleRemove = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/auth/webauthn/credentials/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: ClientDataStore.getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body?.error || 'Failed removing passkey.');
        return;
      }
      setSuccessMsg('Passkey removed from your account.');
      await loadCredentials();
    } catch {
      setErrorMsg('Network error removing passkey.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">Biometric & Passkey Sign-In (FaceID / TouchID)</h4>
            <p className="text-xs text-slate-500">
              Use your device fingerprint sensor, FaceID, Windows Hello, or hardware security key to sign in faster without typing your password.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" />
          WebAuthn FIDO2
        </span>
      </div>

      {!supported ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Your current browser or embedded preview frame does not expose hardware WebAuthn authenticators. Open the portal in HTTPS Chrome, Safari, or Edge to register FaceID or TouchID.
        </div>
      ) : (
        <form onSubmit={handleEnrollBiometric} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={deviceLabel}
            onChange={(e) => setDeviceLabel(e.target.value)}
            placeholder="Optional device label (e.g. MacBook TouchID, iPhone FaceID)"
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={registering}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-60 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{registering ? 'Waiting for Biometric Sensor...' : 'Register FaceID / TouchID'}</span>
          </button>
        </form>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Registered Biometric Devices ({credentials.length})
        </div>
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            Loading registered passkeys...
          </div>
        ) : credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
            No biometric passkey registered yet. Enroll this device above to enable one-tap FaceID/TouchID login.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {credentials.map((cred) => (
              <div key={cred.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <KeyRound className="h-4 w-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{cred.deviceLabel}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {cred.deviceType} · Added {new Date(cred.createdAt).toLocaleDateString('en-KE')}
                      {cred.lastUsedAt ? ` · Last used ${new Date(cred.lastUsedAt).toLocaleDateString('en-KE')}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemove(cred.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
