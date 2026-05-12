// Logistics's lock primitive lives in @microprojects/edm-components since
// Phase 2. The package's acquire hooks broadcast through an injected
// `LockPublisher` (mounted on <LockProvider> in index.tsx); this shim adds
// Logistics's parseEntityType validation guard around the entity-lock
// acquire hook so a typo in `type` doesn't publish garbage onto the bus.

import {
    useAcquireEntityLock as packageAcquireEntityLock,
} from '@microprojects/edm-components/hooks';
import { parseEntityType } from './logisticsEvents';

export {
    LockProvider,
    useLockSetters,
    useEntityLockState,
    useOrderClaimState,
    useAcquireOrderClaim,
    type LockState,
    type LockPublisher,
} from '@microprojects/edm-components/hooks';

export function useAcquireEntityLock(
    type: string | undefined,
    id: string | undefined,
    active: boolean,
    username: string,
) {
    const validType = type ? parseEntityType(type) ?? undefined : undefined;
    packageAcquireEntityLock(validType, id, active, username);
}
