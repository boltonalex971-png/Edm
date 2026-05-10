// Logistics's entity-refresh primitive lives in @microprojects/edm-components
// since Phase 2. This file is a re-export shim so existing call sites keep
// working without churn while Phase 3b/3c migrates Logistics screens onto
// the package directly.

export {
    EntityRefreshProvider,
    useEntityToken,
    useInvalidateEntities,
    listTag,
    type EntityTag,
} from '@microprojects/edm-components/hooks';
