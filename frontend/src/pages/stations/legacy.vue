<template>
  <PageShell
    title="旧资料链接"
    :back-fallback="stationUrl"
  >
    <BaseLoading
      v-if="loading"
      text="正在查找旧资料…"
    />
    <EmptyState
      v-else
      :title="title"
      :description="description"
      :action-text="request ? '搜索莆仙词条' : '返回乡声集盒'"
      @action="search"
    />
    <view
      v-if="request"
      class="legacy-actions"
    >
      <BaseButton
        block
        variant="ghost"
        text="返回兴化语记莆仙站"
        @click="station"
      />
    </view>
  </PageShell>
</template>

<script>
import BaseButton from '@/components/BaseButton.vue';
import BaseLoading from '@/components/BaseLoading.vue';
import EmptyState from '@/components/EmptyState.vue';
import PageShell from '@/components/PageShell.vue';
import { resolveLegacyLink } from '@/services/legacyLinks';
import {
  goEntryDetail, goHome, goRecordingDetail, goSearch, goStation, pageUrl, ROUTES,
} from '@/services/navigation';
import {
  parseLegacyRequest, stationContextParams,
} from '@/services/stationContext';

export default {
  components: {
    BaseButton, BaseLoading, EmptyState, PageShell,
  },
  data: () => ({ request: null, loading: false, resolution: '' }),
  computed: {
    title() {
      if (!this.request) return '这个旧链接无法识别';
      if (this.resolution === 'conflict') return '这条旧资料存在多个候选结果';
      if (this.resolution === 'error') return '暂时无法查找这条旧资料';
      return '这条旧资料暂时没有找到';
    },
    description() {
      if (!this.request) return '参数不在允许的地方站、资料类型或编号范围内，已停止跳转。';
      if (this.resolution === 'conflict') return '为避免把旧链接带到错误内容，已停止自动跳转，不会选择第一个候选结果。';
      if (this.resolution === 'error') return '网络或服务暂时不可用，可以先搜索莆仙词条或返回地方站。';
      return '原链接信息已保留，但当前没有可靠的唯一映射。不会根据相似写法猜测目标。';
    },
    contextParams() {
      return stationContextParams(this.request?.context);
    },
    stationUrl() {
      return this.request ? pageUrl(ROUTES.station, this.contextParams) : ROUTES.home;
    },
  },
  async onLoad(options = {}) {
    this.request = parseLegacyRequest(options);
    if (!this.request) return;
    this.loading = true;
    try {
      const result = await resolveLegacyLink(this.request);
      this.resolution = result?.status || 'unmapped';
      if (result?.status === 'resolved' && result.target_type === 'entry') {
        goEntryDetail(result.target_id, this.contextParams, { replace: true });
      } else if (result?.status === 'resolved' && result.target_type === 'recording') {
        goRecordingDetail(result.target_id, this.contextParams, { replace: true });
      }
    } catch (error) {
      this.resolution = 'error';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    search() {
      if (!this.request) {
        goHome(true);
        return;
      }
      goSearch(this.contextParams);
    },
    station() {
      goStation(this.contextParams, { replace: true });
    },
  },
};
</script>

<style scoped>
.legacy-actions {
  margin-top: 24rpx;
}
</style>
