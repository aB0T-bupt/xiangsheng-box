export const STATION_PROFILES = Object.freeze([
  Object.freeze({
    station: 'hinghwa',
    profile: 'hinghwa-puxian',
    name: '兴化语记',
    relationLabel: '乡声集盒·莆仙方言站',
    dialectLabel: '莆仙方言',
    dialectQualifiedCode: '闽.莆仙',
    description: '从熟悉的兴化语记继续听乡音、查词和留下你家的说法。',
    legacyNamespaces: Object.freeze(['hinghwa']),
  }),
]);

export function stationProfile(station, profiles = STATION_PROFILES) {
  const key = String(station || '').trim().toLowerCase();
  return profiles.find((item) => item.station === key) || null;
}

export function stationProfileByProduct(profile, profiles = STATION_PROFILES) {
  const key = String(profile || '').trim().toLowerCase();
  return profiles.find((item) => item.profile === key) || null;
}

export default STATION_PROFILES;
