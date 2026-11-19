import { useEffect, useState } from 'react';
import {
  applyPwaUpdate,
  checkForPwaUpdate,
  dismissPwaPrompt,
  getPwaState,
  initPwaLifecycle,
  sendPwaTelemetry,
  subscribePwaState,
  triggerNativeInstall,
  type PwaRuntimeState,
} from '../utils/pwaManager';

export function usePWAInstall() {
  const [state, setState] = useState<PwaRuntimeState>(() => getPwaState());

  useEffect(() => {
    initPwaLifecycle();
    setState(getPwaState());
    return subscribePwaState(() => {
      setState(getPwaState());
    });
  }, []);

  return {
    ...state,
    triggerNativeInstall,
    dismissPrompt: dismissPwaPrompt,
    applyUpdate: applyPwaUpdate,
    checkForUpdate: checkForPwaUpdate,
    trackTelemetry: sendPwaTelemetry,
  };
}
