import request from '@/utils/request';

const PAGE_LOAD_OPTIONS = Object.freeze({ loading: false });

export function resolveLegacyLink({ namespace, type, legacyId }) {
  return request.get('/legacy-links/resolve/', {
    namespace,
    type,
    legacy_id: legacyId,
  }, false, PAGE_LOAD_OPTIONS);
}

export default { resolveLegacyLink };
