import { useEffect, useState } from 'react';
import { getAccessSnapshot, getSession, subscribeAccess } from '../services/access-service';
import type { AccessSnapshot, Session } from '../types';

export interface AccessHookState {
  session: Session | null;
  snapshot: AccessSnapshot;
}

const read = (): AccessHookState => ({ session: getSession(), snapshot: getAccessSnapshot() });

/** React state holds service copies; fresh getter objects never drive a render loop. */
export function useAccess(): AccessHookState {
  const [access, setAccess] = useState<AccessHookState>(read);
  useEffect(() => {
    const unsubscribe = subscribeAccess(({ session, ...snapshot }) => setAccess({ session, snapshot }));
    // Also capture a transition that happened between render and subscription.
    setAccess(read());
    return unsubscribe;
  }, []);
  return access;
}
