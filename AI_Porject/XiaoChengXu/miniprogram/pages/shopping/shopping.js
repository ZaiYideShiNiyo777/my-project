// 购物清单页
// 功能：按添加日期自动分组展示、复选框勾选（置灰置底）、二次确认删除（单条/整组）、
//       两步添加（多行物品 → 预览勾选确认）、协作者头像堆叠、每条清单后分享邀请协作
const db = require('../../utils/db.js')
const tabbar = require('../../utils/tabbar.js')
const icons = require('../../utils/icons.js')
const { formatDateCN, dateToStr, formatTimeCN } = require('../../utils/format.js')

// 根据物品名简单推断分类（vegetable/meat/fruit/other）
function guessCategory(name) {
  const fruitWords = ['果', '蕉', '梨', '桃', '橙', '莓', '榴莲', '芒果', '柚子', '柠檬', '提子', '奇异果']
  const meatWords = ['肉', '鸡', '鸭', '鱼', '虾', '蟹', '蛋', '培根', '火腿', '排骨', '牛', '羊', '猪']
  const vegWords = ['菜', '瓜', '椒', '茄', '萝卜', '葱', '蒜', '菇', '笋', '芹', '豆', '藕', '山药', '韭菜']
  if (fruitWords.some((w) => name.indexOf(w) > -1)) return 'fruit'
  if (meatWords.some((w) => name.indexOf(w) > -1)) return 'meat'
  if (vegWords.some((w) => name.indexOf(w) > -1)) return 'vegetable'
  return 'other'
}

// 分类中文标签（列表副标题/详情展示）
const CATEGORY_TEXT = {
  vegetable: '蔬菜',
  meat: '肉蛋',
  fruit: '水果',
  other: '其他'
}

// 无日期的旧数据归入未知日期分组
const NO_DATE_GROUP = '未知日期'

Page({
  data: {
    loading: true,
    keyword: '',
    allList: [],
    groups: [], // [{ date, dateLabel, items, count, doneCount, allDone }]
    memberList: [], // 协作者头像堆叠（最多5人）
    keyboardHeight: 0, // 键盘弹起高度（弹层上移适配，完成按钮不被键盘遮挡）
    // 线条风格图标（参考 Meela 金融 UI：简单明了通俗易懂，替换 emoji）
    icon: {
      search: icons['search-gray'],
      share: icons['share-white'],
      shareWhite: icons['share-white'],
      trash: icons['trash-lightGray'],
      trashRed: icons['trash-red'], // 详情弹层删除入口
      trashWhite: icons['trash-white'], // 卡片删除按钮（红底白图标）
      calendar: icons['calendar-blue'],
      clock: icons['clock-gray'],
      check: icons['check-blue'],
      user: icons['user-gray'],
      users: icons['users-gray'],
      pin: icons['pin-blue'],
      bag: icons['tab-shop-lightGray'],
      plusWhite: icons['plus-white'], // 底部添加物品
      plusBlue: icons['plus-blue'], // 弹层添加一行
      xGray: icons['x-gray'], // 弹层删除行
      chevronLeft: icons['chevron-left-blue'], // 返回修改
      checkWhite: icons['check-white'] // 详情完成按钮 / 行内勾选 / 预览勾选
    },
    // 批量添加弹层（步骤1：任务标题 + 多行物品）
    showAddSheet: false,
    taskTitle: '', // 本次购物任务总标题
    batchRows: [{ value: '', id: 1 }],
    validCount: 0,
    // 预览步骤（步骤2：标题 + 逐项勾选）
    showPreview: false,
    previewTitle: '', // 预览/保存时的任务标题
    previewRows: [], // [{ name, done }]
    inviteId: '', // 分享卡片携带的邀请 ID
    // 清单详情弹层（点击任意清单项查看完整记录）
    showDetail: false,
    detail: {}
  },

  onLoad() {
    // 键盘弹起时弹层上移到键盘上方，底部按钮始终可见可点
    if (wx.onKeyboardHeightChange) {
      wx.onKeyboardHeightChange((res) => {
        this.setData({ keyboardHeight: res.height || 0 })
      })
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      // 每次回到页面重置 hidden，防止弹层关闭路径遗漏导致 tabBar 永久隐藏
      this.getTabBar().setData({ selected: 1, hidden: false })
    }
    this.loadData()
    this.processShare()
    this.prepareInvite()
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh())
  },

  // ---------------- 数据加载 ----------------
  loadData() {
    this.setData({ loading: true })
    return db
      .list({ type: 'shopping' })
      .then((list) => {
        this.setData({
          allList: list,
          memberList: this.buildMembers(list),
          loading: false
        })
        this.applyFilter()
      })
      .catch(() => this.setData({ loading: false }))
  },

  applyFilter() {
    const kw = (this.data.keyword || '').trim()
    const src = this.data.allList
    const list = kw
      ? src.filter(
          (r) =>
            (r.content || '').indexOf(kw) > -1 ||
            (r.title || '').indexOf(kw) > -1 ||
            (r.cook_plan || '').indexOf(kw) > -1
        )
      : src
    this.buildGroups(list)
  },

  // 按添加日期分组：组内未完成在前、已完成置灰置底；组内全部完成时组头出现删除
  buildGroups(list) {
    const map = {}
    const groups = []
    list.forEach((r) => {
      const key = dateToStr(r.created_at) || NO_DATE_GROUP
      if (!map[key]) {
        map[key] = []
        groups.push({ date: key, dateLabel: formatDateCN(r.created_at) || NO_DATE_GROUP, items: map[key] })
      }
      // 富化展示字段：任务标题 + 物品逐行（带行键）+ 分类标签 + 添加时间（点击可看完整详情）
      // 旧单条数据（无 items）回退为单物品，完成态沿用任务级 is_completed
      const rawItems =
        Array.isArray(r.items) && r.items.length > 0
          ? r.items
          : r.content
            ? [{ name: r.content, done: !!r.is_completed }]
            : []
      const items = rawItems.map((it, i) => Object.assign({}, it, { rowKey: String(i) }))
      map[key].push(
        Object.assign({}, r, {
          itemTitle: r.title || r.content || '未命名任务', // 任务总标题（旧单条数据回退到物品名）
          items, // 任务下物品逐行展示（每条独占一行，行尾圆圈勾选）
          itemCount: items.length,
          categoryText: CATEGORY_TEXT[r.category || guessCategory(r.content || '')],
          timeText: r.created_at
            ? formatDateCN(r.created_at) + ' ' + formatTimeCN(r.created_at)
            : ''
        })
      )
    })
    // 组按日期倒序（最新在前），同组内未完成在前
    groups.sort((a, b) => String(b.date).localeCompare(String(a.date)))
    groups.forEach((g) => {
      const dones = g.items
        .filter((i) => i.is_completed)
        .sort((a, b) => String(b.completed_at || '').localeCompare(String(a.completed_at || '')))
      const todos = g.items.filter((i) => !i.is_completed)
      g.items = todos.concat(dones)
      g.count = g.items.length
      g.doneCount = dones.length
      g.allDone = g.count > 0 && g.doneCount === g.count
    })
    this.setData({ groups })
  },

  // 汇总所有记录的协作者（去重，最多5人）
  buildMembers(list) {
    const map = {}
    list.forEach((r) => {
      ;(r.shared_with || []).forEach((o) => {
        if (!map[o]) {
          const name = (r.shared_names && r.shared_names[o]) || o.slice(-6)
          map[o] = { openid: o, name }
        }
      })
    })
    return Object.keys(map).map((k) => map[k]).slice(0, 5)
  },

  // ---------------- 分享卡片进入：加入协作（兼容旧单条分享） ----------------
  processShare() {
    const app = getApp()
    const shareId = app.globalData.shareRecordId
    const inviteId = app.globalData.shareInviteId
    app.globalData.shareRecordId = ''
    app.globalData.shareInviteId = ''
    if (shareId) {
      wx.showModal({
        title: '协作邀请',
        content: '好友邀请你共同编辑这条购物清单，是否加入？',
        success: (res) => {
          if (res.confirm) {
            db.join(shareId, app.getNickname())
              .then(() => {
                wx.showToast({ title: '已加入协作', icon: 'success' })
                this.loadData()
              })
              .catch((err) => wx.showToast({ title: err.message || '加入失败', icon: 'none' }))
          }
        }
      })
      return
    }
    if (inviteId) {
      this.acceptInvite(inviteId)
    }
  },

  // 接受页面邀请：确认后共享购物清单模块内容
  acceptInvite(inviteId) {
    const app = getApp()
    wx.showModal({
      title: '协作邀请',
      content: '好友邀请你加入「购物清单」协作，接受后双方可共同编辑，是否接受？',
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

  // 预取/复用“待接受”邀请：点“分享”按钮时卡片直接携带邀请 ID
  prepareInvite() {
    db.getOrCreateInvitation('shopping')
      .then((inv) => {
        if (inv && inv._id && inv._id !== this.data.inviteId) {
          this.setData({ inviteId: inv._id })
        }
      })
      .catch(() => {})
  },

  // 分享：每条清单后有独立分享按钮（携带该条记录 ID，可自选分享哪条）；
  // 组头分享进入时标题带该组日期；右上角菜单分享则用通用文案
  onShareAppMessage(e) {
    const inviteId = this.data.inviteId || ''
    const target = e && e.target && e.target.dataset ? e.target.dataset : {}
    // 单条分享：好友点开卡片后 processShare 提示加入该条协作
    if (target.id) {
      return {
        title: `邀请你一起协作「${target.title || target.content || '这条购物清单'}」`,
        path: `/pages/shopping/shopping?shareRecordId=${target.id}`
      }
    }
    const shareDate = target.date || ''
    const title = shareDate
      ? `邀请你一起协作「${formatDateCN(shareDate)}」的购物清单`
      : '邀请你一起协作「购物清单」'
    return {
      title,
      path: inviteId
        ? `/pages/shopping/shopping?inviteId=${inviteId}`
        : '/pages/shopping/shopping'
    }
  },

  // ---------------- 批量添加弹层（步骤1：多行物品） ----------------
  // 点击底部“添加物品”打开：自由增删物品行
  // 自定义 tabBar 不支持 wx.hideTabBar，必须用组件 hidden 状态（utils/tabbar.js 统一封装）
  openAddSheet() {
    tabbar.hideTabBar(this)
    this.setData({
      showAddSheet: true,
      showPreview: false,
      taskTitle: '',
      batchRows: [{ value: '', id: 1 }],
      validCount: 0
    })
  },

  // 任务总标题输入：代表本次购物任务的名称，保存后作为清单记录的标题
  onTaskTitleInput(e) {
    this.setData({ taskTitle: e.detail.value })
  },

  closeAddSheet() {
    this.setData({ showAddSheet: false, showPreview: false })
    tabbar.showTabBar(this)
  },

  onBatchInput(e) {
    const { index } = e.currentTarget.dataset
    this.setData({ [`batchRows[${index}].value`]: e.detail.value })
    this.updateValidCount()
  },

  addRow() {
    // 每行带唯一 id 作为 wx:key，保证新增行正确渲染（避免 key 失效导致输入行异常）
    const id = Date.now() + Math.random()
    this.setData({ batchRows: this.data.batchRows.concat([{ value: '', id }]) })
  },

  removeRow(e) {
    const { index } = e.currentTarget.dataset
    const rows = this.data.batchRows.filter((_, i) => i !== index)
    this.setData({ batchRows: rows.length > 0 ? rows : [{ value: '' }] })
    this.updateValidCount()
  },

  updateValidCount() {
    const validCount = this.data.batchRows.filter((r) => (r.value || '').trim()).length
    this.setData({ validCount })
  },

  // 进入预览：任务标题必填 + 至少一项物品
  toPreview() {
    const title = (this.data.taskTitle || '').trim()
    if (!title) {
      wx.showToast({ title: '请先填写购物任务标题', icon: 'none' })
      return
    }
    const names = this.data.batchRows
      .map((r) => (r.value || '').trim())
      .filter((v) => v.length > 0)
    if (names.length === 0) {
      wx.showToast({ title: '请至少添加一个物品', icon: 'none' })
      return
    }
    this.setData({
      showPreview: true,
      previewTitle: title,
      previewRows: names.map((name, i) => ({ name, done: false, id: Date.now() + i }))
    })
  },

  backToEdit() {
    this.setData({ showPreview: false })
  },

  // 预览中逐项标记完成（勾选后置灰，保存时即为已完成）
  onPreviewToggle(e) {
    const { index } = e.currentTarget.dataset
    this.setData({ [`previewRows[${index}].done`]: !this.data.previewRows[index].done })
  },

  // 确认添加：一个购物任务 = 一条清单记录（任务标题 + 该任务下全部物品汇总）
  // 预览中勾选过的物品直接记为已完成；content 保留物品名拼接，兼容旧展示与搜索
  confirmBatch() {
    const app = getApp()
    const title = this.data.previewTitle
    const rows = this.data.previewRows
    const names = rows.map((r) => r.name)
    db.create({
      type: 'shopping',
      title,
      content: names.join('、'),
      items: rows.map((r) => ({ name: r.name, done: !!r.done })),
      category: guessCategory(names[0] || ''),
      is_completed: rows.length > 0 && rows.every((r) => r.done),
      creator_nickname: app.getNickname()
    })
      .then(() => {
        this.setData({ showAddSheet: false, showPreview: false })
        tabbar.showTabBar(this)
        wx.showToast({ title: '已添加购物任务', icon: 'success' })
        this.loadData()
      })
      .catch((err) => wx.showToast({ title: err.message || '添加失败', icon: 'none' }))
  },

  // ---------------- 清单详情：点击任意清单项查看完整记录 ----------------
  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.allList.find((r) => r._id === id)
    if (!item) return
    const membersText = item.shared_names
      ? Object.keys(item.shared_names)
          .map((k) => item.shared_names[k])
          .join('、')
      : ''
    const rawItems =
      Array.isArray(item.items) && item.items.length > 0
        ? item.items
        : item.content
          ? [{ name: item.content, done: !!item.is_completed }]
          : []
    const items = rawItems.map((it, i) => Object.assign({}, it, { rowKey: String(i) }))
    this.setData({
      showDetail: true,
      detail: {
        _id: item._id,
        title: item.title || item.content || '未命名任务',
        content: item.content,
        items,
        is_completed: !!item.is_completed,
        statusText: item.is_completed ? '已完成' : '未完成',
        categoryText: CATEGORY_TEXT[item.category || guessCategory(item.content || '')],
        timeText: item.created_at
          ? formatDateCN(item.created_at) + ' ' + formatTimeCN(item.created_at)
          : '未知',
        completedAtText: item.completed_at
          ? formatDateCN(item.completed_at) + ' ' + formatTimeCN(item.completed_at)
          : '',
        creatorName: item.creator_nickname,
        membersText
      }
    })
    tabbar.hideTabBar(this)
  },

  closeDetail() {
    this.setData({ showDetail: false })
    tabbar.showTabBar(this)
  },

  // 详情弹层内切换完成状态：与列表勾选同一数据链路
  onDetailToggle(e) {
    const { id, completed } = e.currentTarget.dataset
    db.toggleComplete(id, !completed)
      .then(() => {
        wx.showToast({ title: '已更新', icon: 'success' })
        this.closeDetail()
        this.loadData()
      })
      .catch((err) => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
  },

  // 详情弹层内删除记录：卡片上不再放垃圾桶，危险操作统一收进详情，二次确认后删除
  onDetailDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除确认',
      content: '确定要永久删除这条记录吗？删除后不可恢复。',
      confirmText: '删除',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return
        db.remove(id)
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.closeDetail()
            this.loadData()
          })
          .catch((err) => wx.showToast({ title: err.message || '删除失败', icon: 'none' }))
      }
    })
  },

  // 卡片右侧删除按钮：二次确认后物理删除并刷新列表（与详情弹层删除同一数据链路）
  onCardDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除确认',
      content: '确定要永久删除这条记录吗？删除后不可恢复',
      confirmText: '删除',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return
        db.remove(id)
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadData()
          })
          .catch((err) => wx.showToast({ title: err.message || '删除失败', icon: 'none' }))
      }
    })
  },

  // ---------------- 物品级勾选：点击行尾圆圈切换该物品完成状态 ----------------
  // done 写入数据模型 items[n].done，云端同步重算任务完成状态（全部勾选自动完成/取消任一恢复未完成）；
  // 重新加载后标记保持，并用返回值给出自动完成/恢复的即时反馈
  onToggleItem(e) {
    const { id, index, done } = e.currentTarget.dataset
    db.toggleItem(id, Number(index), !done)
      .then((updated) => {
        if (updated && updated.is_completed && !done) {
          wx.showToast({ title: '全部完成，任务已自动标记', icon: 'success' })
        } else if (updated && !updated.is_completed && done) {
          wx.showToast({ title: '已恢复为未完成', icon: 'none' })
        }
        this.loadData()
      })
      .catch((err) => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
  },

  // 详情弹层内物品勾选：同一数据链路，成功后同步刷新详情展示
  onDetailItemToggle(e) {
    const { id, index, done } = e.currentTarget.dataset
    db.toggleItem(id, Number(index), !done)
      .then((updated) => {
        const rawItems = Array.isArray(updated.items) && updated.items.length > 0 ? updated.items : []
        this.setData({
          'detail.items': rawItems.map((it, i) => Object.assign({}, it, { rowKey: String(i) })),
          'detail.is_completed': !!updated.is_completed,
          'detail.statusText': updated.is_completed ? '已完成' : '未完成'
        })
        this.loadData()
      })
      .catch((err) => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
  },

  // ---------------- 整组删除：仅该日期下全部完成后组头出现删除，二次确认 ----------------
  onDeleteGroup(e) {
    const date = e.currentTarget.dataset.date
    const group = this.data.groups.find((g) => g.date === date)
    if (!group || !group.allDone) return
    wx.showModal({
      title: '删除整组',
      content: `「${group.dateLabel}」的清单已全部完成，确定删除该组全部 ${group.count} 条记录吗？`,
      confirmText: '删除',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return
        Promise.all(group.items.map((i) => db.remove(i._id)))
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadData()
          })
          .catch((err) => wx.showToast({ title: err.message || '删除失败', icon: 'none' }))
      }
    })
  },

  // ---------------- 搜索 ----------------
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.applyFilter()
  },

  // ---------------- 垃圾桶：二次确认后物理删除 ----------------
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除确认',
      content: '确定要永久删除这条记录吗？删除后不可恢复。',
      confirmText: '删除',
      confirmColor: '#e64340',
      success: (res) => {
        if (res.confirm) {
          db.remove(id)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.loadData()
            })
            .catch((err) => wx.showToast({ title: err.message || '删除失败', icon: 'none' }))
        }
      }
    })
  },

  // ---------------- 底部添加（已迁移为批量弹层） ----------------
  onAdd() {
    this.openAddSheet()
  }
})
