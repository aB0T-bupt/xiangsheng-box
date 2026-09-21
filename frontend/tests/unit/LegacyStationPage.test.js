import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

vi.mock('@/services/legacyLinks', () => ({ resolveLegacyLink: vi.fn() }));
vi.mock('@/services/navigation', () => ({
  goEntryDetail: vi.fn(),
  goHome: vi.fn(),
  goRecordingDetail: vi.fn(),
  goSearch: vi.fn(),
  goStation: vi.fn(),
  pageUrl: vi.fn((path) => path),
  ROUTES: { home: '/pages/index', station: '/pages/stations/index' },
}));

const { resolveLegacyLink } = await import('@/services/legacyLinks');
const navigation = await import('@/services/navigation');
const LegacyPage = (await import('@/pages/stations/legacy.vue')).default;

function pageContext() {
  const page = { ...LegacyPage.data(), ...LegacyPage.methods };
  Object.defineProperty(page, 'contextParams', {
    get: () => LegacyPage.computed.contextParams.call(page),
  });
  return page;
}

const OPTIONS = {
  station: 'hinghwa',
  profile: 'hinghwa-puxian',
  namespace: 'hinghwa',
  type: 'entry',
  legacy_id: '42',
};

describe('legacy station landing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens only the unique server-resolved target and preserves station context', async () => {
    resolveLegacyLink.mockResolvedValue({
      status: 'resolved', target_type: 'entry', target_id: 7,
    });
    const page = pageContext();

    await LegacyPage.onLoad.call(page, OPTIONS);

    expect(navigation.goEntryDetail).toHaveBeenCalledWith(7, {
      station: 'hinghwa',
      profile: 'hinghwa-puxian',
      return_to: 'station',
    }, { replace: true });
  });

  it('does not guess when the server reports conflicting targets', async () => {
    resolveLegacyLink.mockResolvedValue({ status: 'conflict' });
    const page = pageContext();

    await LegacyPage.onLoad.call(page, OPTIONS);

    expect(page.resolution).toBe('conflict');
    expect(navigation.goEntryDetail).not.toHaveBeenCalled();
    expect(navigation.goRecordingDetail).not.toHaveBeenCalled();
  });

  it('rejects an invalid namespace before making a request', async () => {
    const page = pageContext();

    await LegacyPage.onLoad.call(page, { ...OPTIONS, namespace: 'other' });

    expect(page.request).toBeNull();
    expect(resolveLegacyLink).not.toHaveBeenCalled();
  });
});
