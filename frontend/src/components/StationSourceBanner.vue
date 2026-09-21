<template>
  <view
    v-if="context"
    class="station-source"
  >
    <view class="station-source__copy">
      <text class="station-source__label">
        来自
      </text>
      <text class="station-source__name">
        {{ context.definition.name }}·{{ context.definition.dialectLabel }}站
      </text>
    </view>
    <BaseButton
      size="small"
      variant="ghost"
      :text="`继续逛${context.definition.dialectLabel}乡音`"
      @click="$emit('continue')"
    />
  </view>
</template>

<script>
import BaseButton from '@/components/BaseButton.vue';

export default {
  name: 'StationSourceBanner',
  components: { BaseButton },
  props: {
    context: { type: Object, default: null },
  },
  emits: ['continue'],
};
</script>

<style scoped>
.station-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx 26rpx;
  border: 1rpx solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--accent-subtle-color);
}

.station-source__copy {
  min-width: 0;
  display: grid;
  gap: 4rpx;
}

.station-source__label {
  color: var(--muted-color);
  font-size: 21rpx;
}

.station-source__name {
  color: var(--text-color);
  font-weight: 800;
}

@media screen and (max-width: 360px) {
  .station-source {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
