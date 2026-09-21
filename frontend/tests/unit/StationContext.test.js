import { describe, expect, it } from 'vitest';
import {
  parseLegacyRequest,
  parseStationContext,
  stationContextParams,
  stationFallback,
} from '@/services/stationContext';

describe('station navigation context', () => {
  it('accepts only a registered matching station/profile pair', () => {
    const context = parseStationContext({
      station: 'hinghwa',
      profile: 'hinghwa-puxian',
      dialect_id: '23',
      return_to: 'station',
      redirect: 'https://evil.example',
    });

    expect(context).toMatchObject({
      station: 'hinghwa',
      profile: 'hinghwa-puxian',
      dialectId: 23,
      returnTo: 'station',
    });
    expect(stationContextParams(context)).toEqual({
      station: 'hinghwa',
      profile: 'hinghwa-puxian',
      dialect_id: 23,
      return_to: 'station',
    });
    expect(JSON.stringify(stationContextParams(context))).not.toContain('evil');
  });

  it('rejects unknown and mismatched profiles instead of accepting a safe-looking slug', () => {
    expect(parseStationContext({ station: 'unknown-station' })).toBeNull();
    expect(parseStationContext({
      station: 'hinghwa',
      profile: 'another-profile',
    })).toBeNull();
  });

  it('uses semantic return targets and never an arbitrary URL', () => {
    const context = parseStationContext({
      station: 'hinghwa',
      return_to: 'https://evil.example/path',
    });

    expect(context.returnTo).toBe('station');
    expect(stationFallback(context)).toMatchObject({
      path: '/pages/stations/index',
    });
    expect(stationFallback(parseStationContext({
      station: 'hinghwa',
      return_to: 'home',
    }))).toEqual({ path: '/pages/index', params: {} });
  });

  it('validates legacy namespace, resource type, and positive id', () => {
    expect(parseLegacyRequest({
      station: 'hinghwa',
      namespace: 'hinghwa',
      type: 'entry',
      legacy_id: '42',
    })).toMatchObject({ namespace: 'hinghwa', type: 'entry', legacyId: 42 });
    expect(parseLegacyRequest({
      station: 'hinghwa',
      namespace: 'other',
      type: 'entry',
      legacy_id: '42',
    })).toBeNull();
    expect(parseLegacyRequest({
      station: 'hinghwa',
      namespace: 'hinghwa',
      type: 'entry',
      legacy_id: '../42',
    })).toBeNull();
  });

  it('reuses the same parser for a second station without changing navigation code', () => {
    const profiles = [{
      station: 'sample',
      profile: 'sample-local',
      name: '示例地方资料馆',
      dialectLabel: '示例方言',
      dialectQualifiedCode: '示例.方言',
      legacyNamespaces: ['sample-legacy'],
    }];
    const context = parseStationContext({
      station: 'sample',
      profile: 'sample-local',
      dialect_id: 9,
    }, profiles);

    expect(stationContextParams(context)).toEqual({
      station: 'sample',
      profile: 'sample-local',
      dialect_id: 9,
      return_to: 'station',
    });
  });
});
