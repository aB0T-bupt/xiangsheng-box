import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

vi.mock('@/services/capabilities', () => ({
  CAPABILITIES: { ENTRY_SEARCH: 'entry_search', RECORDING: 'recording' },
  getCapabilityStatus: vi.fn(() => ({ enabled: true })),
}));

vi.mock('@/services/entryRecording', () => ({
  entryTitle: vi.fn((entry) => entry.display_writing),
  listEntries: vi.fn(),
  listRecordings: vi.fn(),
  pageResults: vi.fn((response) => response?.results || response || []),
}));

vi.mock('@/services/guantou', () => ({ resolveDialect: vi.fn() }));

vi.mock('@/services/navigation', () => ({
  goEntryDetail: vi.fn(),
  goHome: vi.fn(),
  goRecord: vi.fn(),
  goRecordingDetail: vi.fn(),
  goSearch: vi.fn(),
  ROUTES: { home: '/pages/index' },
}));

const entryRecording = await import('@/services/entryRecording');
const { resolveDialect } = await import('@/services/guantou');
const navigation = await import('@/services/navigation');
const { parseStationContext } = await import('@/services/stationContext');
const StationPage = (await import('@/pages/stations/index.vue')).default;

function pageContext(extra = {}) {
  return {
    ...StationPage.data(),
    ...StationPage.methods,
    searchAvailable: true,
    recordingAvailable: true,
    listenAvailable: true,
    ...extra,
  };
}

function params(page) {
  return StationPage.computed.contextParams.call(page);
}

describe('generic station page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveDialect.mockResolvedValue({ id: 23, name: '莆仙方言' });
    entryRecording.listEntries.mockResolvedValue({
      results: [{ id: 7, display_writing: '行' }],
    });
    entryRecording.listRecordings.mockResolvedValue({
      results: [{ id: 9, original_gloss: '表示害怕' }],
    });
  });

  it('resolves the configured language space and queries shared resources', async () => {
    const page = pageContext({ context: parseStationContext({ station: 'hinghwa' }) });

    await page.load();

    expect(resolveDialect).toHaveBeenCalledWith('闽.莆仙');
    const filter = {
      dialect_id: 23,
      dialect_scope: 'subtree',
      page_size: 4,
    };
    expect(entryRecording.listEntries).toHaveBeenCalledWith(filter);
    expect(entryRecording.listRecordings).toHaveBeenCalledWith(filter);
    expect(page.entries).toHaveLength(1);
    expect(page.recordings).toHaveLength(1);
  });

  it('passes only the normalized station context into shared search, record, and detail pages', () => {
    const page = pageContext({
      context: parseStationContext({
        station: 'hinghwa',
        profile: 'hinghwa-puxian',
        dialect_id: 23,
        unexpected: 'do-not-forward',
      }),
      dialect: { id: 23 },
      keyword: '害怕',
    });
    page.contextParams = params(page);
    page.searchAvailable = true;
    page.recordingAvailable = true;

    page.search();
    page.record();
    page.openEntry(7);

    const context = {
      station: 'hinghwa',
      profile: 'hinghwa-puxian',
      dialect_id: 23,
      return_to: 'station',
    };
    expect(navigation.goSearch).toHaveBeenCalledWith({ ...context, keywords: '害怕' });
    expect(navigation.goRecord).toHaveBeenCalledWith(context);
    expect(navigation.goEntryDetail).toHaveBeenCalledWith(7, context);
    expect(JSON.stringify(navigation.goSearch.mock.calls)).not.toContain('do-not-forward');
  });

  it('keeps the honest empty state when both shared queries return no content', async () => {
    entryRecording.listEntries.mockResolvedValue({ results: [] });
    entryRecording.listRecordings.mockResolvedValue({ results: [] });
    const page = pageContext({ context: parseStationContext({ station: 'hinghwa' }) });

    await page.load();

    expect(page.entries).toEqual([]);
    expect(page.recordings).toEqual([]);
    expect(page.errorMessage).toBe('');
  });

  it('keeps recordings usable when the entry request alone fails', async () => {
    entryRecording.listEntries.mockRejectedValue(new Error('entry unavailable'));
    const page = pageContext({ context: parseStationContext({ station: 'hinghwa' }) });

    await page.load();

    expect(page.errorMessage).toBe('');
    expect(page.entries).toEqual([]);
    expect(page.recordings).toHaveLength(1);
    expect(page.partialMessage).toContain('公开乡音仍可继续收听');
  });
});
