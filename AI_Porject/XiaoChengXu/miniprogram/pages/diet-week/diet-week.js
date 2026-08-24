// 更多时间页：周视图三餐（从饮食计划主页「更多时间」进入）
// 顶部 7 天日期条（周一~周日 + 月日，哪格是哪天一目了然），点击某天滚动定位到对应卡片；
// 从主页进入时携带选中日期：自动定位到该日期所在周并滚动到对应卡片（哪天是哪天一目了然）；
// 周切换查看历史/未来任意一周；三餐内联编辑逻辑复用 behaviors/diet-editor（与主页完全一致）
const db = require('../../utils/db.js')
const { getWeek, getWeekByDate, dateToStr } = require('../../utils/format.js')
const icons = require('../../utils/icons.js')
const dietEditor = require('../../behaviors/diet-editor.js')

// 初始周（今日日期同源于此，切换周时同步更新）
const INIT_WEEK = getWeek(0)

Page({
  behaviors: [dietEditor],

  data: {
    week: INIT_WEEK,
    weekDays: [], // 当前周 7 天日期条 [{ date, label, monthDay, isToday, isSelected }]
    selectedDate: '', // 日期条选中日（默认今天），点击定位到对应卡片
    scrollInto: '', // scroll-view 滚动定位目标（day-YYYY-MM-DD）
    loading: true,
    records: [],
    // 线条风格图标（参考 Meela 金融 UI）
    icon: {
      flame: icons['flame-orange'],
      pencil: icons['pencil-blue'],
      chevronLeft: icons['chevron-left-blue'], // 周切换左箭头
      chevronRight: icons['chevron-right-blue'], // 周切换右箭头
      checkWhite: icons['check-white'] // 食物多选勾
    }
  },

  // 从主页「更多时间」进入：携带主页当前选中的日期，进入后定位到该天所在周并自动滚动到该天卡片
  onLoad(options) {
    this.pendingDate = (options && options.date) || ''
  },

  onShow() {
    // 带日期进入：直接定位到该日期所在周（主页在看哪天，进来就还是那天）
    if (this.pendingDate) {
      const date = this.pendingDate
      this.pendingDate = ''
      this.setWeekByDate(date)
      return
    }
    // 跨天自动推进：停留在“当前周”时，若日期已变化则重新计算当前周（范围条与各餐日期同步前移）
    if (this.data.week.offset === 0 && this.data.week.todayStr !== dateToStr(new Date())) {
      this.setWeek(0)
    } else {
      this.rebuildWeekDays(this.data.week)
      this.loadData()
    }
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh())
  },

  // ---------------- 周切换 ----------------
  prevWeek() {
    this.setWeek(this.data.week.offset - 1)
  },

  nextWeek() {
    this.setWeek(this.data.week.offset + 1)
  },

  setWeek(offset) {
    const week = getWeek(offset)
    this.setData({ week })
    this.rebuildWeekDays(week)
    this.loadData()
  },

  // 从主页携带日期进入：切换到该日期所在周（offset 按与本周的周差计算），并滚动定位到该天卡片
  setWeekByDate(dateStr) {
    const days = getWeekByDate(dateStr)
    const thisWeek = getWeek(0)
    const diffWeeks = Math.round(
      (new Date(days[0].date.replace(/-/g, '/')) - new Date(thisWeek.days[0].date.replace(/-/g, '/'))) /
        86400000 / 7
    )
    const week = Object.assign({}, thisWeek, {
      offset: diffWeeks,
      days,
      rangeLabel: `${days[0].monthDay} - ${days[6].monthDay}`,
      monday: days[0].date
    })
    this.setData({ week, scrollInto: `day-${dateStr}` })
    this.rebuildWeekDays(week, dateStr)
    this.loadData()
  },

  // 根据当前周重建日期条：优先选中目标日期，否则选中今天（若不在该周则选周一）
  rebuildWeekDays(week, targetDate) {
    const today = week.days.find((d) => d.isToday)
    const def =
      (targetDate && week.days.find((d) => d.date === targetDate)) || today || week.days[0]
    const days = week.days.map((d) =>
      Object.assign({}, d, { isSelected: d.date === def.date })
    )
    this.setData({ weekDays: days, selectedDate: def.date })
  },

  // 点击日期格：高亮该天并滚动定位到对应卡片（哪格是哪天一目了然）
  onPickDay(e) {
    const date = e.currentTarget.dataset.date
    if (!date || date === this.data.selectedDate) return
    this.setData({
      selectedDate: date,
      weekDays: this.data.weekDays.map((d) => Object.assign({}, d, { isSelected: d.date === date })),
      scrollInto: `day-${date}`
    })
  },

  // ---------------- 数据加载：当前周 7 天 ----------------
  loadData() {
    const week = this.data.week
    this.setData({ loading: true })
    return db
      .list({
        type: 'diet',
        weekStart: week.days[0].date,
        weekEnd: week.days[6].date
      })
      .then((list) => {
        const days = week.days.map((d) => {
          const meals = { breakfast: null, lunch: null, dinner: null, other: null }
          list
            .filter((r) => r.week_date === d.date)
            .forEach((r) => {
              // 旧数据“加餐(snack)”兼容归入“其他”槽位
              const key = r.meal_type === 'snack' ? 'other' : r.meal_type
              if (meals[key] !== undefined) meals[key] = r
            })
          // 当日总热量（三餐+其他合计）
          const totalKcal = Object.keys(meals).reduce(
            (sum, k) => sum + Number((meals[k] && meals[k].calories) || 0),
            0
          )
          return Object.assign({}, d, { meals, totalKcal })
        })
        this.setData({ week: Object.assign({}, week, { days }), records: list, loading: false })
      })
      .catch(() => this.setData({ loading: false }))
  }
})
