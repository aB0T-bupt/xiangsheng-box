<template>
  <PageShell
    :title="context?.definition?.dialectLabel || '地方站'"
    :back-fallback="ROUTES.home"
  >
    <EmptyState
      v-if="invalidContext"
      title="这个地方站入口无法识别"
      description="入口参数已被安全拦截，你可以返回乡声集盒继续浏览。"
      action-text="返回乡声集盒"
      @action="goHome(true)"
    />
    <BaseLoading
      v-else-if="loading"
      text="正在打开地方站…"
    />
    <EmptyState
      v-else-if="errorMessage"
      :title="errorMessage"
      description="查词与乡声集盒其他功能仍可继续使用。"
      action-text="重新加载"
      @action="load"
    />
    <view
      v-else-if="context"
      class="station-page"
    >
      <view
        v-if="partialMessage"
        class="station-notice"
        role="status"
      >
        {{ partialMessage }}
      </view>
      <view class="station-hero">
        <text class="station-hero__eyebrow">
          {{ context.definition.name }}
        </text>
        <text class="station-hero__title">
          {{ context.definition.relationLabel }}
        </text>
        <text class="station-hero__description">
          {{ context.definition.description }}
        </text>
        <text class="station-hero__scope">
          当前范围：{{ context.definition.dialectLabel }}
        </text>
      </view>

      <view class="station-section station-search">
        <text class="station-section__title">
          查一个{{ context.definition.dialectLabel }}词
        </text>
        <BaseField
          v-model="keyword"
          name="station_keyword"
          label="写法、意思或读音"
          placeholder="不必先知道正字"
          @confirm="search"
        />
        <BaseButton
          block
          text="查词"
          :disabled="!searchAvailable"
          @click="search"
        />
        <text
          v-if="!searchAvailable"
          class="station-section__note"
        >
          查词正在维护，仍可继续听已公开的乡音。
        </text>
      </view>

      <view
        v-if="recordings.length"
        class="station-section"
      >
        <text class="station-section__kicker">
          先听这些
        </text>
        <text class="station-section__title">
          {{ context.definition.dialectLabel }}乡音
        </text>
        <EntryRecordingCard
          v-for="recording in recordings"
          :key="recording.id"
          :recording="recording"
          :community="false"
          :detail-params="contextParams"
          @open-entry="openEntry"
        />
      </view>

      <view
        v-if="entries.length"
        class="station-section"
      >
        <text class="station-section__kicker">
          常用表达
        </text>
        <BaseButton
          v-for="entry in entries"
          :key="entry.id"
          block
          variant="ghost"
          :text="`${entryTitle(entry)}·${entry.summary || '大意待补充'}`"
          @click="openEntry(entry.id)"
        />
      </view>

      <view
        v-if="!entries.length && !recordings.length"
        class="station-section station-empty"
      >
        <text class="station-section__title">
          这个范围还没有足够的公开资料
        </text>
        <text class="station-section__note">
          不会用其他地区内容假装本地资料。你仍可查词，或录下第一段熟悉的说法。
        </text>
      </view>

      <BaseButton
        block
        text="录下我家的说法"
        :disabled="!recordingAvailable"
        @click="record"
      />
      <text
        v-if="!recordingAvailable"
        class="station-section__note"
      >
        录音提交正在维护，查词和公开乡音不受影响。
      </text>
      <text
        v-if="!listenAvailable"
        class="station-section__note"
      >
        乡音列表正在维护，查词与录音入口仍按各自能力状态提供。
      </text>

      <view class="station-migration">
        <text class="station-section__title">
          {{ context.definition.name }}仍在这里
        </text>
        <text class="station-section__note">
          现在作为{{ context.definition.relationLabel }}继续服务，词条、录音与账户使用乡声集盒的通用系统。
        </text>
      </view>
    </view>
  </PageShell>
</template>

<script>
import BaseButton from '@/components/BaseButton.vue';
import BaseField from '@/components/BaseField.vue';
import BaseLoading from '@/components/BaseLoading.vue';
import EmptyState from '@/components/EmptyState.vue';
import EntryRecordingCard from '@/components/EntryRecordingCard.vue';
import PageShell from '@/components/PageShell.vue';
import { getCapabilityStatus, CAPABILITIES } from '@/services/capabilities';
import {
  entryTitle, listEntries, listRecordings, pageResults,
} from '@/services/entryRecording';
import { resolveDialect } from '@/services/guantou';
import {
  goEntryDetail, goHome, goRecord, goSearch, ROUTES,
} from '@/services/navigation';
import {
  parseStationContext, stationContextParams,
} from '@/services/stationContext';

export default {
  components: {
    BaseButton,
    BaseField,
    BaseLoading,
    EmptyState,
    EntryRecordingCard,
    PageShell,
  },
  data: () => ({
    ROUTES,
    context: null,
    invalidContext: false,
    loading: true,
    errorMessage: '',
    partialMessage: '',
    keyword: '',
    dialect: null,
    entries: [],
    recordings: [],
  }),
  computed: {
    contextParams() {
      return stationContextParams(this.context, { dialectId: this.dialect?.id });
    },
    searchAvailable() {
      return getCapabilityStatus(CAPABILITIES.ENTRY_SEARCH).enabled;
    },
    recordingAvailable() {
      return getCapabilityStatus(CAPABILITIES.RECORDING).enabled;
    },
    listenAvailable() {
      return getCapabilityStatus(CAPABILITIES.LISTEN_FEED).enabled;
    },
  },
  onLoad(options = {}) {
    this.context = parseStationContext(options);
    this.invalidContext = !this.context;
    if (this.context) this.load();
    else this.loading = false;
  },
  methods: {
    entryTitle,
    goHome,
    async load() {
      this.loading = true;
      this.errorMessage = '';
      this.partialMessage = '';
      try {
        this.dialect = await resolveDialect(this.context.definition.dialectQualifiedCode);
        this.context = Object.freeze({
          ...this.context,
          dialectId: this.dialect.id,
        });
        const filters = {
          dialect_id: this.dialect.id,
          dialect_scope: 'subtree',
          page_size: 4,
        };
        const [entries, recordings] = await Promise.allSettled([
          this.searchAvailable ? listEntries(filters) : Promise.resolve({ results: [] }),
          this.listenAvailable ? listRecordings(filters) : Promise.resolve({ results: [] }),
        ]);
        this.entries = entries.status === 'fulfilled' ? pageResults(entries.value) : [];
        this.recordings = recordings.status === 'fulfilled' ? pageResults(recordings.value) : [];
        if (entries.status === 'rejected' && recordings.status === 'rejected') {
          throw new Error('station_content_unavailable');
        }
        if (entries.status === 'rejected') this.partialMessage = '词条暂时无法读取，公开乡音仍可继续收听。';
        if (recordings.status === 'rejected') this.partialMessage = '乡音暂时无法读取，查词仍可继续使用。';
      } catch (error) {
        this.entries = [];
        this.recordings = [];
        this.errorMessage = '地方站资料暂时无法读取';
      } finally {
        this.loading = false;
      }
    },
    search() {
      if (!this.searchAvailable) return;
      goSearch({
        ...this.contextParams,
        ...(String(this.keyword || '').trim() ? { keywords: String(this.keyword).trim() } : {}),
      });
    },
    record() {
      if (!this.recordingAvailable) return;
      goRecord(this.contextParams);
    },
    openEntry(id) {
      goEntryDetail(id, this.contextParams);
    },
  },
};
</script>

<style scoped>
.station-page {
  display: grid;
  gap: 24rpx;
}

.station-hero,
.station-section,
.station-migration {
  display: grid;
  gap: 18rpx;
  padding: 28rpx;
  border: 1rpx solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--surface-color);
}

.station-notice {
  padding: 20rpx 24rpx;
  border-radius: var(--radius-md);
  color: var(--text-color);
  background: var(--accent-subtle-color);
}

.station-hero {
  color: var(--on-immersive-color);
  background: linear-gradient(145deg, var(--immersive-bg-strong-color), var(--immersive-bg-color));
}

.station-hero__eyebrow,
.station-section__kicker {
  color: var(--accent-color);
  font-size: 21rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
}

.station-hero__title {
  font-family: STSong, SimSun, serif;
  font-size: 42rpx;
  font-weight: 900;
}

.station-hero__description,
.station-section__note {
  color: var(--muted-color);
  line-height: 1.65;
}

.station-hero__description,
.station-hero__scope {
  color: var(--on-immersive-muted-color);
}

.station-section__title {
  font-size: 30rpx;
  font-weight: 800;
}

.station-empty {
  background: var(--accent-subtle-color);
}

@media screen and (max-width: 360px) {
  .station-hero,
  .station-section,
  .station-migration {
    padding: 22rpx;
  }

  .station-hero__title {
    font-size: 36rpx;
  }
}
</style>
