import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/mail', () => ({
  listNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
}));

import NotificationCenter from '@/pages/mails/index.vue';
import BaseButton from '@/components/BaseButton.vue';
import { listNotifications, markNotificationsRead } from '@/services/mail';

const notification = {
  id: 12,
  title: '词条有新补证',
  content: '很有意思',
  unread: true,
  time: '2026-08-11 10:00:00',
  from: { avatar: '/avatar.png', nickname: '乡音朋友' },
  target: { type: 'entry', id: 9, url: '/pages/entries/details?id=9' },
};

function mountCenter() {
  return mount(NotificationCenter, {
    global: {
      stubs: {
        PageShell: { template: '<main><slot name="before" /><slot /></main>' },
        'scroll-view': { template: '<div><slot /></div>' },
      },
    },
  });
}

describe('notification center', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listNotifications.mockResolvedValue({
      notifications: [notification],
      page: 1,
      pages: 1,
      total: 1,
    });
    markNotificationsRead.mockResolvedValue({});
    globalThis.uni = { navigateTo: vi.fn(), showToast: vi.fn() };
  });

  it('renders localized pagination states without an implicit component', async () => {
    const wrapper = mountCenter();
    wrapper.vm.notifications = [notification];
    wrapper.vm.loadStatus = 'more';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.pagination-status').text()).toBe('上拉继续加载');

    wrapper.vm.loadStatus = 'noMore';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.pagination-status').text()).toBe('没有更多消息了');
  });

  it('loads notifications with the selected unread filter', async () => {
    const wrapper = mountCenter();
    wrapper.vm.filter = 'unread';
    await wrapper.vm.refresh();

    expect(listNotifications).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      unread: true,
    });
    expect(wrapper.text()).toContain('词条有新补证');
    expect(wrapper.vm.introTitle).toBe('1 条未读消息');
    expect(wrapper.vm.headerActionText).toBe('全部已读');
    expect(wrapper.vm.senderInitial(notification)).toBe('乡');
  });

  it('renders every filter through BaseButton and sends grouped verbs', async () => {
    const wrapper = mountCenter();
    const filters = wrapper.findAllComponents(BaseButton);

    expect(filters).toHaveLength(5);
    expect(filters.map((filter) => filter.text())).toEqual([
      '全部',
      '未读',
      '回复',
      '点赞',
      '收藏',
    ]);

    wrapper.vm.setFilter('reply');
    await flushPromises();

    expect(listNotifications).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      verb: 'entry.comment,entry.reply,recording.comment,recording.reply',
    });
  });

  it('marks one notification read before opening its target', async () => {
    const wrapper = mountCenter();
    wrapper.vm.notifications = [notification];

    await wrapper.vm.openNotification(notification);

    expect(markNotificationsRead).toHaveBeenCalledWith([12]);
    expect(wrapper.vm.notifications[0].unread).toBe(false);
    expect(notification.unread).toBe(true);
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/entries/details?id=9',
    });
  });

  it('opens comment notifications at the top-level or reply anchor', async () => {
    const wrapper = mountCenter();
    const topLevel = {
      ...notification,
      id: 13,
      target: {
        type: 'entry',
        id: 9,
        url: '/pages/entries/details?id=9',
        comment_id: 42,
        parent_comment_id: null,
      },
    };
    const reply = {
      ...notification,
      id: 14,
      target: {
        type: 'recording',
        id: 5,
        url: '/pages/recordings/details?id=5',
        comment_id: 16,
        parent_comment_id: 1,
      },
    };

    await wrapper.vm.openNotification(topLevel);
    expect(uni.navigateTo).toHaveBeenLastCalledWith({
      url: '/pages/entries/details?id=9&comment=42&root=42',
    });

    await wrapper.vm.openNotification(reply);
    expect(uni.navigateTo).toHaveBeenLastCalledWith({
      url: '/pages/recordings/details?id=5&comment=16&root=1',
    });
  });

  it('marks the loaded collection read in one request', async () => {
    const wrapper = mountCenter();
    wrapper.vm.notifications = [notification];

    await wrapper.vm.markAllRead();
    await flushPromises();

    expect(markNotificationsRead).toHaveBeenCalledWith();
    expect(wrapper.vm.notifications[0].unread).toBe(false);
    expect(wrapper.vm.headerActionText).toBe('');
  });

  it('keeps unread state when the mark-all request fails', async () => {
    markNotificationsRead.mockRejectedValueOnce(new Error('服务繁忙'));
    const wrapper = mountCenter();
    wrapper.vm.notifications = [notification];

    await wrapper.vm.markAllRead();

    expect(wrapper.vm.notifications[0].unread).toBe(true);
    expect(wrapper.vm.markingAll).toBe(false);
  });
});
