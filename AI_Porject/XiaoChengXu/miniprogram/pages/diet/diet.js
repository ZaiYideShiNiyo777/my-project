// 饮食计划主页：以「提前制定计划」为核心（不是记录当天吃了什么）
// 顶部 7 天日期条可点选任意一天查看/制定当天三餐计划（左右箭头跨周），
// 主页默认落在今天；「更多时间」进入周视图（pages/diet-week）管理整周；
// 三餐内联编辑逻辑复用 behaviors/diet-editor（与周视图页完全一致）
const db = require('../../utils/db.js')
const { getWeek, getWeekByDate, dateToStr } = require('../../utils/format.js')
const icons = require('../../utils/icons.js')
const dietEditor = require('../../behaviors/diet-editor.js')

// 初始当天（今日日期同源于此，跨天时 onShow 自动刷新）
const INIT_TODAY = (getWeek(0).days.find((d) => d.isToday) || {})

Page({
  behaviors: [dietEditor],

  data: {
    today: INIT_TODAY.date || dateToStr(new Date()), // 当前真实日期（YYYY-MM-DD，跨天检测用）
    selectedDate: INIT_TODAY.date || dateToStr(new Date()), // 当前选中的日期（默认今天，可点日期条看任意一天计划）
    selectedFull: INIT_TODAY.dateFull || '', // 选中日完整日期：周六 8月22日
    selectedIsToday: true,
    weekDays: [], // 选中日所在周的 7 天 [{ date, label, monthDay, isToday, isSelected }]
    loading: true,
    records: [],
    day: null, // 当天视图 { date, dateFull, isToday, meals, totalKcal }
    inviteId: '', // 分享卡片携带的邀请 ID（页面内邀请，与购物/备忘/价格一致）
    // 线条风格图标（参考 Meela 金融 UI）
    icon: {
      plate: icons['meal-plate-white'],
      calendar: icons['calendar-blue'],
      flame: icons['flame-orange'],
      pencil: icons['pencil-blue'],
      chevronLeft: icons['chevron-left-blue'],
      chevronRight: icons['chevron-right-blue'], // 更多时间入口箭头 / 整周引导箭头
      share: icons['share-blue'], // 邀请协作
      checkWhite: icons['check-white'] // 食物多选勾
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      // 每次回到页面重置 hidden，防止弹层关闭路径遗漏导致 tabBar 永久隐藏
      this.getTabBar().setData({ selected: 0, hidden: false })
    }
    // 跨天自动推进：仅当“正看着今天”时日期变化才刷新到今天；若用户在看其他日期（提前制定），保持不动
    const todayStr = dateToStr(new Date())
    if (this.data.today !== todayStr) {
      this.setData({ today: todayStr })
      if (this.data.selectedIsToday) {
        const t = getWeek(0).days.find((d) => d.isToday) || {}
        this.setData({ selectedDate: t.date || todayStr, selectedFull: t.dateFull || '', selectedIsToday: true })
      }
    }
    this.rebuildWeekDays(this.data.selectedDate)
    this.loadData()
    this.processShare()
    this.prepareInvite()
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh())
  },

  // ---------------- 7 天日期条：点选任意一天（提前制定未来计划） ----------------
  // 根据选中日重建所在周的日期条（选中态高亮 + 今天标记）
  rebuildWeekDays(dateStr) {
    const days = getWeekByDate(dateStr).map((d) =>
      Object.assign({}, d, { isSelected: d.date === dateStr })
    )
    const cur = days.find((d) => d.date === dateStr) || {}
    this.setData({
      weekDays: days,
      selectedDate: dateStr,
      selectedFull: cur.dateFull || dateStr,
      selectedIsToday: !!cur.isToday
    })
  },

  // 点击日期格：切换到该天的计划视图
  onPickDay(e) {
    const date = e.currentTarget.dataset.date
    if (!date || date === this.data.selectedDate) return
    this.rebuildWeekDays(date)
    this.loadData()
  },

  // 上一周：选中日回退 7 天（日期条同步更新）
  onWeekPrev() {
    const d = new Date(this.data.selectedDate.replace(/-/g, '/'))
    d.setDate(d.getDate() - 7)
    this.rebuildWeekDays(dateToStr(d))
    this.loadData()
  },

  // 下一周：选中日前进 7 天
  onWeekNext() {
    const d = new Date(this.data.selectedDate.replace(/-/g, '/'))
    d.setDate(d.getDate() + 7)
    this.rebuildWeekDays(dateToStr(d))
    this.loadData()
  },

  // ---------------- 分享卡片进入：接受页面邀请（与购物/备忘/价格一致） ----------------
  processShare() {
    const app = getApp()
    const inviteId = app.globalData.shareInviteId
    app.globalData.shareInviteId = ''
    if (inviteId) {
      this.acceptInvite(inviteId)
    }
  },

  // 接受页面邀请：确认后共享饮食计划模块内容（一次接受后，其他已邀请模块一并生效，无需重复确认）
  acceptInvite(inviteId) {
    const app = getApp()
    wx.showModal({
      title: '协作邀请',
      content: '好友邀请你加入「饮食计划」协作，接受后双方可共同制定饮食计划，是否接受？',
      success: (res) => {
        if (!res.confirm) return
        db.acceptInvitation(inviteId, app.getNickname())
          .then((r) => {
            wx.showToast({ title: r.accepted > 0 ? `已接受，共享 ${r.accepted} 条记录` : '已接受邀请', icon: 'success' })
            this.loadData()
          })
          .catch((err) => wx.showToast({ title: err.message || '接受失败', icon: 'none' }))
      }
    })
  },

  // 预取/复用“待接受”邀请：点“邀请”按钮分享时卡片直接携带邀请 ID
  prepareInvite() {
    db.getOrCreateInvitation('diet')
      .then((inv) => {
        if (inv && inv._id && inv._id !== this.data.inviteId) {
          this.setData({ inviteId: inv._id })
        }
      })
      .catch(() => {})
  },

  // 页面内邀请：分享卡片携带邀请 ID，好友点开即进入接受流程
  onShareAppMessage() {
    const inviteId = this.data.inviteId || ''
    return {
      title: '邀请你一起协作「饮食计划」',
      path: inviteId
        ? `/pages/diet/diet?inviteId=${inviteId}`
        : '/pages/diet/diet'
    }
  },

  // ---------------- 更多时间：进入周视图（携带当前选中日，进入后自动定位到该天，哪天是哪天一目了然） ----------------
  openMoreTime() {
    wx.navigateTo({ url: `/pages/diet-week/diet-week?date=${this.data.selectedDate}` })
  },

  // ---------------- 数据加载：只查选中日（计划聚焦单日，其他日期从日期条/更多时间进入） ----------------
  loadData() {
    const date = this.data.selectedDate
    this.setData({ loading: true })
    return db
      .list({ type: 'diet', weekStart: date, weekEnd: date })
      .then((list) => {
        const meals = { breakfast: null, lunch: null, dinner: null, other: null }
        list.forEach((r) => {
          // 旧数据“加餐(snack)”兼容归入“其他”槽位
          const key = r.meal_type === 'snack' ? 'other' : r.meal_type
          if (meals[key] !== undefined) meals[key] = r
        })
        // 当日总热量（三餐+其他合计）
        const totalKcal = Object.keys(meals).reduce(
          (sum, k) => sum + Number((meals[k] && meals[k].calories) || 0),
          0
        )
        this.setData({
          day: {
            date,
            dateFull: this.data.selectedFull,
            isToday: this.data.selectedIsToday,
            meals,
            totalKcal
          },
          records: list,
          loading: false
        })
      })
      .catch(() => this.setData({ loading: false }))
  }
})
