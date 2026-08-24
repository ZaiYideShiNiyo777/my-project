// 价格笔记页：商品最低价记录 + 价格历史曲线（时间线）
// 修改价格 → 云函数事务自动向 price_history 插入旧价记录
const db = require('../../utils/db.js')
const tabbar = require('../../utils/tabbar.js')
const icons = require('../../utils/icons.js')
const { formatPrice, priceDiff, formatTimeCN } = require('../../utils/format.js')

Page({
  data: {
    // 线条风图标（参考 Meela 金融 UI：圆角线条，简单明了）
    icon: {
      tag: icons['tag-gray'], // 平台标签
      chevronUp: icons['chevron-up-blue'], // 收起价格历史
      chevronDown: icons['chevron-down-lightGray'], // 展开价格历史
      share: icons['share-blue'], // 分享协作
      trash: icons['trash-red'], // 删除
      coin: icons['coin-blue'], // 空状态
      plus: icons['plus-white'], // FAB 新增 / 空状态添加按钮
      chevronRight: icons['chevron-right-blue'], // 历史价格变化箭头
      check: icons['check-white'] // 保存按钮
    },
    loading: true,
    list: [], // 每条附 last_history（最近一次历史价）
    total: 0,
    totalPrice: 0, // 全部商品当前价格合计（元）
    totalText: '¥0.00', // 合计展示文案
    expandedId: '', // 当前展开历史时间线的商品
    histories: [],
    historyLoading: false,
    showForm: false,
    form: { name: '', price: '' },
    editing: false,
    editId: '',
    // 修改价格弹层：点击商品卡片弹出，只输入一个数字即可保存
    showEditPrice: false,
    editPriceId: '',
    editPriceValue: '',
    editPriceName: '',
    editPriceCurrent: '',
    editPriceFocus: false,
    keyboardHeight: 0, // 键盘弹起高度（弹层上移适配，保存按钮不被键盘遮挡）
    inviteId: '' // 分享卡片携带的邀请 ID
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
      this.getTabBar().setData({ selected: 3, hidden: false })
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
      .listPrice()
      .then((list) => {
        const enriched = list.map((r) => {
          const last = r.last_history || null
          let diffText = ''
          let lastText = ''
          if (last) {
            lastText = formatPrice(last.price)
            diffText = priceDiff(last.price, r.current_price)
          }
          return Object.assign({}, r, {
            currentText: formatPrice(r.current_price),
            lastText,
            diffText,
            timeText: formatTimeCN(r.created_at)
          })
        })
        const totalPrice = enriched.reduce((sum, r) => sum + Number(r.current_price || 0), 0)
        this.setData({
          list: enriched,
          total: enriched.length,
          totalPrice,
          totalText: formatPrice(totalPrice),
          loading: false
        })
      })
      .catch(() => this.setData({ loading: false }))
  },

  // ---------------- 展开/收起价格历史（点击卡片右侧箭头） ----------------
  onToggleHistory(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.expandedId === id) {
      this.setData({ expandedId: '', histories: [] })
      return
    }
    this.setData({ expandedId: id, histories: [], historyLoading: true })
    db.getPriceHistory(id)
      .then((histories) => {
        const enriched = histories.map((h) =>
          Object.assign({}, h, {
            timeText: formatTimeCN(h.changed_at),
            oldText: formatPrice(h.price),
            newText: formatPrice(h.new_price)
          })
        )
        this.setData({ histories: enriched, historyLoading: false })
      })
      .catch(() => this.setData({ historyLoading: false }))
  },

  // ---------------- 修改价格：点击商品卡片 → 弹层只输入一个数字（自动写历史） ----------------
  onEditPrice(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((r) => r._id === id)
    if (!item) return
    // 预填当前价格：微调时直接改数字即可保存
    tabbar.hideTabBar(this)
    this.setData({
      showEditPrice: true,
      editPriceId: id,
      editPriceValue: item.current_price != null ? String(item.current_price) : '',
      editPriceName: item.content,
      editPriceCurrent: item.currentText,
      editPriceFocus: true
    })
  },

  closeEditPrice() {
    this.setData({ showEditPrice: false })
    tabbar.showTabBar(this)
  },

  onEditPriceInput(e) {
    this.setData({ editPriceValue: e.detail.value })
  },

  confirmEditPrice() {
    const input = (this.data.editPriceValue || '').trim()
    const newPrice = Number(input)
    if (input === '' || isNaN(newPrice) || newPrice < 0) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' })
      return
    }
    db.updatePrice(this.data.editPriceId, newPrice)
      .then(() => {
        wx.showToast({ title: '已更新并记录历史', icon: 'success' })
        this.closeEditPrice()
        this.loadData()
      })
      .catch((err) => wx.showToast({ title: err.message || '修改失败', icon: 'none' }))
  },

  // ---------------- 删除（二次确认） ----------------
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除确认',
      content: '确定要永久删除该商品及价格历史吗？',
      confirmText: '删除',
      confirmColor: '#e64340',
      success: (res) => {
        if (res.confirm) {
          db.remove(id)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' })
              if (this.data.expandedId === id) {
                this.setData({ expandedId: '', histories: [] })
              }
              this.loadData()
            })
            .catch((err) => wx.showToast({ title: err.message || '删除失败', icon: 'none' }))
        }
      }
    })
  },

  // ---------------- 页面内邀请：分享卡片携带邀请 ID，好友点开即接受 ----------------
  processShare() {
    const app = getApp()
    const inviteId = app.globalData.shareInviteId
    app.globalData.shareInviteId = ''
    if (!inviteId) return
    wx.showModal({
      title: '协作邀请',
      content: '好友邀请你加入「价格笔记」协作，接受后双方可共同记录，是否接受？',
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
    db.getOrCreateInvitation('price')
      .then((inv) => {
        if (inv && inv._id && inv._id !== this.data.inviteId) {
          this.setData({ inviteId: inv._id })
        }
      })
      .catch(() => {})
  },

  // 分享：从商品卡片“分享”按钮进入时，标题带上商品名；右上角菜单分享则用通用文案
  onShareAppMessage(e) {
    const inviteId = this.data.inviteId || ''
    const shareName = e && e.target && e.target.dataset ? e.target.dataset.name : ''
    const title = shareName
      ? `邀请你一起协作「${shareName}」的价格笔记`
      : '邀请你一起协作「价格笔记」'
    return {
      title,
      path: inviteId
        ? `/pages/price/price?inviteId=${inviteId}`
        : '/pages/price/price'
    }
  },

  // ---------------- 右下角 FAB：新增商品 ----------------
  // 自定义 tabBar 不支持 wx.hideTabBar，必须用组件 hidden 状态（utils/tabbar.js 统一封装）
  openForm() {
    tabbar.hideTabBar(this)
    this.setData({ showForm: true, form: { name: '', price: '' } })
  },

  closeForm() {
    this.setData({ showForm: false })
    tabbar.showTabBar(this)
  },

  onFormName(e) {
    this.setData({ 'form.name': e.detail.value })
  },

  onFormPrice(e) {
    this.setData({ 'form.price': e.detail.value })
  },

  confirmForm() {
    const { name, price } = this.data.form
    const nameText = (name || '').trim()
    const priceNum = Number(price)
    if (!nameText) {
      wx.showToast({ title: '请输入商品名', icon: 'none' })
      return
    }
    if (isNaN(priceNum) || priceNum < 0) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' })
      return
    }
    db.create({
      type: 'price',
      content: nameText,
      current_price: priceNum,
      creator_nickname: getApp().getNickname()
    })
      .then(() => {
        this.closeForm()
        wx.showToast({ title: '已添加', icon: 'success' })
        this.loadData()
      })
      .catch((err) => wx.showToast({ title: err.message || '添加失败', icon: 'none' }))
  }
})
