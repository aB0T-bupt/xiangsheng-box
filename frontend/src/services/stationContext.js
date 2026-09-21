import {
  STATION_PROFILES,
  stationProfile,
  stationProfileByProduct,
} from '@/services/stationProfiles';

export const STATION_ROUTE = '/pages/stations/index';
export const LEGACY_ROUTE = '/pages/stations/legacy';

export const STATION_RETURN_TARGETS = Object.freeze({
  station: 'station',
  home: 'home',
});

const SAFE_SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const LEGACY_TYPES = new Set(['entry', 'recording']);

function scalar(value) {
  return Array.isArray(value) ? value[0] : value;
}

function safeSlug(value) {
  const normalized = String(scalar(value) || '').trim().toLowerCase();
  return SAFE_SLUG.test(normalized) ? normalized : '';
}

export function positiveId(value) {
  const normalized = String(scalar(value) || '').trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseStationContext(query = {}, profiles = STATION_PROFILES) {
  const stationKey = safeSlug(query.station);
  const profileKey = safeSlug(query.profile);
  const byStation = stationKey ? stationProfile(stationKey, profiles) : null;
  const byProfile = profileKey ? stationProfileByProduct(profileKey, profiles) : null;
  const resolved = byStation || byProfile;

  if (!resolved) return null;
  if (stationKey && resolved.station !== stationKey) return null;
  if (profileKey && resolved.profile !== profileKey) return null;

  const returnTarget = safeSlug(query.return_to);
  return Object.freeze({
    station: resolved.station,
    profile: resolved.profile,
    dialectId: positiveId(query.dialect_id),
    returnTo: Object.values(STATION_RETURN_TARGETS).includes(returnTarget)
      ? returnTarget
      : STATION_RETURN_TARGETS.station,
    definition: resolved,
  });
}

export function stationContextParams(context, overrides = {}) {
  if (!context?.definition) return {};
  const dialectId = positiveId(overrides.dialectId ?? context.dialectId);
  const returnTo = Object.values(STATION_RETURN_TARGETS).includes(overrides.returnTo)
    ? overrides.returnTo
    : context.returnTo;
  return {
    station: context.station,
    profile: context.profile,
    ...(dialectId ? { dialect_id: dialectId } : {}),
    ...(returnTo ? { return_to: returnTo } : {}),
  };
}

export function stationFallback(context) {
  if (!context?.definition || context.returnTo === STATION_RETURN_TARGETS.home) {
    return { path: '/pages/index', params: {} };
  }
  return {
    path: STATION_ROUTE,
    params: stationContextParams(context, { returnTo: STATION_RETURN_TARGETS.home }),
  };
}

export function parseLegacyRequest(query = {}, profiles = STATION_PROFILES) {
  const context = parseStationContext(query, profiles);
  if (!context) return null;
  const namespace = safeSlug(query.namespace);
  const type = safeSlug(query.type);
  const legacyId = positiveId(query.legacy_id);
  if (!context.definition.legacyNamespaces.includes(namespace)) return null;
  if (!LEGACY_TYPES.has(type) || !legacyId) return null;
  return Object.freeze({
    context, namespace, type, legacyId,
  });
}

export default {
  LEGACY_ROUTE,
  STATION_RETURN_TARGETS,
  STATION_ROUTE,
  parseLegacyRequest,
  parseStationContext,
  positiveId,
  stationContextParams,
  stationFallback,
};
