// 我的页：受邀人管理（按购物清单/家庭备忘录/价格笔记分类）、订阅设置、浮窗指引
const db = require('../../utils/db.js')
const tabbar = require('../../utils/tabbar.js')
const icons = require('../../utils/icons.js')
const { formatTimeCN } = require('../../utils/format.js')

// TODO: 申请订阅消息模板后，将模板 ID 填入此处
const TEMPLATE_ID = '4Q0UDffT60bFciz6bBxo0wvfttqhFIfnNnODYsHFjdY'

// 四个可邀请模块的展示信息（typeIcon 为线条风图标）
const INVITE_META = {
  shopping: { icon: icons['tab-shop-blue'], label: '购物清单' },
  memo: { icon: icons['tab-memo-blue'], label: '家庭备忘录' },
  price: { icon: icons['tab-price-blue'], label: '价格笔记' },
  diet: { icon: icons['tab-diet-blue'], label: '饮食计划' }
}

Page({
  data: {
    // 线条风图标（参考 Meela 金融 UI：圆角线条，简单明了）
    icon: {
      pencil: icons['pencil-gray'], // 修改昵称
      bulb: icons['bulb-blue'], // 浮窗指引
      users: icons['users-blue'], // 我的协作邀请
      bell: icons['bell-blue'] // 每日待办提醒
    },
    nickname: '',
    loading: true,
    inviteGroups: [], // [{ type, typeIcon, typeLabel, invites: [...] }]
    subscribeOn: false,
    remindTimes: { morning: false, evening: false }, // 提醒时段勾选：早上 6:00 / 下午 18:00
    // 昵称编辑弹层
    showNicknameSheet: false,
    nicknameInput: ''
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      // 每次回到页面重置 hidden，防止弹层关闭路径遗漏导致 tabBar 永久隐藏
      this.getTabBar().setData({ selected: 4, hidden: false })
    }
    this.setData({ nickname: getApp().getNickname() })
    this.loadData()
    this.loadSubscribeState()
  },

  // 加载云端订阅时段（开关状态持久化）
  loadSubscribeState() {
    db.getSubscribe()
      .then((res) => {
        const times = res.times || []
        this.setData({
          subscribeOn: !!res.on,
          remindTimes: {
            morning: times.indexOf('06:00') > -1,
            evening: times.indexOf('18:00') > -1
          }
        })
      })
      .catch(() => {})
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh())
  },

  // ---------------- 受邀人管理：按模块分类展示 ----------------
  // 仅展示“已接受”的邀请（待接受的未生效，不占列表）
  loadData() {
    this.setData({ loading: true })
    return db
      .listInvitations()
      .then((list) => {
        const groups = ['shopping', 'memo', 'price', 'diet'].map((type) => {
          const meta = INVITE_META[type]
          const invites = (list || [])
            .filter((i) => i.type === type && i.status === 'accepted')
            .map((i) =>
              Object.assign({}, i, {
                inviteeName: i.invitee_nickname || '等待好友接受',
                statusText: '已接受',
                statusClass: 'ok',
                timeText: formatTimeCN(i.updated_at)
              })
            )
          return { type, typeIcon: meta.icon, typeLabel: meta.label, invites }
        })
        this.setData({ inviteGroups: groups, loading: false })
      })
      .catch(() => this.setData({ loading: false }))
  },

  // 移除邀请（已接受的会同时取消与该模块的协作共享）
  onRemoveInvite(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '移除协作者',
      content: '确定移除该邀请并取消与对方的协作共享吗？',
      confirmText: '移除',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return
        db.removeInvitation(id)
          .then(() => {
            wx.showToast({ title: '已移除', icon: 'success' })
            this.loadData()
          })
          .catch((err) => wx.showToast({ title: err.message || '移除失败', icon: 'none' }))
      }
    })
  },

  // ---------------- 昵称 ----------------
  // 打开自定义昵称编辑弹层（预填当前昵称，明确保存/取消按钮）
  // 自定义 tabBar 不支持 wx.hideTabBar，必须用组件 hidden 状态（utils/tabbar.js 统一封装）
  onNicknameTap() {
    tabbar.hideTabBar(this)
    this.setData({
      showNicknameSheet: true,
      nicknameInput: this.data.nickname
    })
  },

  closeNicknameSheet() {
    this.setData({ showNicknameSheet: false })
    tabbar.showTabBar(this)
  },

  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value })
  },

  confirmNickname() {
    const name = (this.data.nicknameInput || '').trim()
    if (!name) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    // 昵称保存到云端（user_profiles）：本地立即生效，云端失败则回滚并提示
    getApp()
      .setNickname(name)
      .then(() => {
        this.setData({ nickname: name, showNicknameSheet: false })
        tabbar.showTabBar(this)
        wx.showToast({ title: '昵称已保存', icon: 'success' })
      })
      .catch((err) => {
        this.setData({ nickname: getApp().getNickname() })
        wx.showToast({ title: err.message || '云端保存失败，请重试', icon: 'none' })
      })
  },

  // ---------------- 订阅设置：双时段可选 ----------------
  // 时段：早上 6:00（morning）/ 下午 18:00（evening），可同时勾选
  // 勾选需微信订阅授权（一次性订阅：每次授权仅可推送一条）；取消无需授权，直接云端记录
  // 根据当前勾选状态计算 times 数组（云端存储格式）
  calcTimes(remindTimes) {
    const times = []
    if (remindTimes.morning) times.push('06:00')
    if (remindTimes.evening) times.push('18:00')
    return times
  },

  // 保存当前时段到云端（返回 Promise）
  saveRemindTimes() {
    return db.subscribe(this.calcTimes(this.data.remindTimes))
  },

  // 回滚某个时段开关（授权失败/云端保存失败时恢复原状）
  rollbackRemindTime(slot, checked) {
    const remindTimes = Object.assign({}, this.data.remindTimes, { [slot]: checked })
    this.setData({ remindTimes, subscribeOn: this.calcTimes(remindTimes).length > 0 })
  },

  onRemindTimeChange(e) {
    const slot = e.currentTarget.dataset.slot // 'morning' | 'evening'
    const checked = e.detail.value
    // 本地先反映勾选状态，再走云端保存/授权流程
    const remindTimes = Object.assign({}, this.data.remindTimes, { [slot]: checked })
    this.setData({ remindTimes, subscribeOn: this.calcTimes(remindTimes).length > 0 })

    // 取消勾选：无需授权，直接云端记录
    if (!checked) {
      this.saveRemindTimes()
        .then(() => wx.showToast({ title: '已关闭该时段提醒', icon: 'none' }))
        .catch(() => {
          this.rollbackRemindTime(slot, true)
          wx.showToast({ title: '操作失败，请重试', icon: 'none' })
        })
      return
    }

    // 勾选：先请求一次性订阅授权，授权成功后在云端记录订阅时段
    if (TEMPLATE_ID === 'TEMPLATE_ID_HERE') {
      wx.showToast({ title: '请先配置订阅消息模板ID', icon: 'none' })
      this.rollbackRemindTime(slot, false)
      return
    }
    wx.requestSubscribeMessage({
      tmplIds: [TEMPLATE_ID],
      success: (res) => {
        if (res[TEMPLATE_ID] === 'accept') {
          this.saveRemindTimes()
            .then(() => wx.showToast({ title: '订阅成功，将在所选时段推送', icon: 'success' }))
            .catch(() => {
              this.rollbackRemindTime(slot, false)
              wx.showToast({ title: '云端记录失败', icon: 'none' })
            })
        } else {
          this.rollbackRemindTime(slot, false)
          wx.showToast({ title: '订阅被拒绝', icon: 'none' })
        }
      },
      fail: () => {
        this.rollbackRemindTime(slot, false)
        wx.showToast({ title: '订阅失败，请检查模板ID', icon: 'none' })
      }
    })
  }
})
