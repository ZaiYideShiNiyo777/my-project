// 家庭备忘页：聊天式时间线（家人/宠物分类）
// 长按消息弹出操作面板（复制/完成/删除）；支持标题；按日期或标题分组
const db = require('../../utils/db.js')
const icons = require('../../utils/icons.js')
const { formatTimeCN, formatDateCN } = require('../../utils/format.js')

const TAG_TEXT = {
  family: '家人',
  pet: '宠物'
}

Page({
  data: {
    // 线条风图标（参考 Meela 金融 UI：圆角线条，简单明了）
    icon: {
      familyBlue: icons['family-blue'], // 分段控件：家人（激活）
      familyGray: icons['family-gray'], // 家人（未激活）
      petBlue: icons['pet-blue'], // 宠物（激活）
      petGray: icons['pet-gray'], // 宠物（未激活）
      calendarBlue: icons['calendar-blue'], // 按日期（激活）
      calendarGray: icons['calendar-gray'], // 按日期（未激活）
      tagBlue: icons['tag-blue'], // 按标题（激活）
      tagGray: icons['tag-gray'], // 按标题（未激活）
      share: icons['share-blue'], // 邀请协作
      pin: icons['pin-blue'], // 标题/引用
      attach: icons['attach-blue'], // 引用标题
      x: icons['x-gray'] // 取消引用
    },
    tag: 'family', // family | pet
    groupBy: 'date', // date | title
    groups: [], // [{ key, items: [...] }]
    list: [], // 拍平列表（供操作查找）
    inputText: '',
    titleText: '',
    showTitleInput: false,
    referencedTitle: '', // 引用标题继续记录（发送后清空）
    keyboardHeight: 0, // 键盘弹起高度（底部输入栏上移适配）
    inviteId: '', // 页面内邀请：分享卡片携带的邀请 ID
    loading: true
  },

  onLoad() {
    // 键盘弹起时把底部输入栏顶到键盘上方，确保“发送”按钮始终可见可点
    if (wx.onKeyboardHeightChange) {
      wx.onKeyboardHeightChange((res) => {
        this.setData({ keyboardHeight: res.height || 0 })
      })
    }
  },

  onUnload() {
    if (wx.offKeyboardHeightChange) {
      wx.offKeyboardHeightChange()
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      // 每次回到页面重置 hidden，防止弹层关闭路径遗漏导致 tabBar 永久隐藏（与其他 tab 页保持一致）
      this.getTabBar().setData({ selected: 2, hidden: false })
    }
    this.loadData()
    this.processShare()
    this.prepareInvite()
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh())
  },

  // ---------------- 标签切换 ----------------
  onTagChange(e) {
    const tag = e.currentTarget.dataset.tag
    if (tag === this.data.tag) return
    this.setData({ tag })
    this.loadData()
  },

  // ---------------- 数据加载 ----------------
  // silent=true 静默刷新：不切换 loading 视图，避免时间线被销毁重建导致页面滚动位置重置
  loadData(silent) {
    if (!silent) this.setData({ loading: true })
    return db
      .list({ type: 'memo', memoTag: this.data.tag })
      .then((list) => {
        const openid = getApp().globalData.openid
        const enriched = list
          .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
          .map((r) =>
            Object.assign({}, r, {
              timeText: formatTimeCN(r.created_at),
              dateText: formatDateCN(r.created_at),
              tagText: TAG_TEXT[r.memo_tag] || '',
              authorText: r._openid === openid ? '我' : r.creator_nickname || '家人',
              isMine: r._openid === openid
            })
          )
        this.setData({ list: enriched })
        this.rebuildGroups(enriched)
        if (!silent) {
          this.setData({ loading: false })
          // 默认定位到最新消息：进入页面/切换标签后自动滚到时间线底部，无需手动下滑
          this.scrollToBottom()
        }
      })
      .catch(() => {
        if (!silent) this.setData({ loading: false })
      })
  },

  // 按 日期/标题 分组（日期模式下组头为日期，标题模式下组头为标题）
  rebuildGroups(list) {
    const src = list || this.data.list
    const byTitle = this.data.groupBy === 'title'
    const map = {}
    const groups = []
    src.forEach((r) => {
      const key = byTitle ? (r.title || '无标题') : r.dateText
      if (!map[key]) {
        map[key] = []
        groups.push({ key, items: map[key] })
      }
      map[key].push(r)
    })
    this.setData({ groups })
  },

  // 分组方式切换（仅前端重排，无需重新请求）
  onGroupByChange(e) {
    const by = e.currentTarget.dataset.by
    if (by === this.data.groupBy) return
    this.setData({ groupBy: by })
    this.rebuildGroups()
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
        content: '好友邀请你共同编辑这条备忘，是否加入？',
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

  // 接受页面邀请：确认后共享家庭备忘模块内容
  acceptInvite(inviteId) {
    const app = getApp()
    wx.showModal({
      title: '协作邀请',
      content: '好友邀请你加入「家庭备忘」协作，接受后双方可共同记录，是否接受？',
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
    db.getOrCreateInvitation('memo')
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
      title: '邀请你一起协作「家庭备忘」',
      path: inviteId
        ? `/pages/memo/memo?inviteId=${inviteId}`
        : '/pages/memo/memo'
    }
  },

  // ---------------- 长按操作面板（复制/完成/删除） ----------------
  onLongPress(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((r) => r._id === id)
    if (!item) return
    const actions = ['复制内容']
    if (item.is_completed) actions.push('取消完成')
    else actions.push('标记完成')
    actions.push('删除')
    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const act = actions[res.tapIndex]
        if (act.indexOf('复制') > -1) {
          wx.setClipboardData({
            data: item.title ? `${item.title}\n${item.content}` : item.content
          })
        } else if (act.indexOf('完成') > -1) {
          this.doComplete(id, !item.is_completed)
        } else if (act.indexOf('删除') > -1) {
          this.doDelete(id)
        }
      }
    })
  },

  doComplete(id, completed) {
    db.toggleComplete(id, completed)
      .then(() => this.loadData())
      .catch((err) => wx.showToast({ title: err.message || '操作失败', icon: 'none' }))
  },

  doDelete(id) {
    wx.showModal({
      title: '删除确认',
      content: '确定要永久删除这条备忘吗？',
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

  // ---------------- 引用标题继续记录 ----------------
  // 点击回形针（引用标题）：列出本标签下已有标题，选中后预填标题并在新对话行继续补充
  onReferTap() {
    const titles = []
    this.data.list.forEach((r) => {
      const t = String(r.title || '').trim()
      if (t && titles.indexOf(t) === -1) titles.push(t)
    })
    if (titles.length === 0) {
      wx.showToast({ title: '还没有带标题的记录，可先点标题按钮添加', icon: 'none' })
      return
    }
    wx.showActionSheet({
      itemList: titles.map((t) => (t.length > 14 ? t.slice(0, 14) + '…' : t)),
      success: (res) => {
        const t = titles[res.tapIndex]
        this.setData({ referencedTitle: t, titleText: t, showTitleInput: true })
      }
    })
  },

  // 取消引用：仅清除本次引用状态，不影响已发送的历史记录
  cancelRefer() {
    const t = this.data.referencedTitle
    this.setData({
      referencedTitle: '',
      titleText: this.data.titleText === t ? '' : this.data.titleText
    })
  },

  // ---------------- 底部输入（标题可选 + 内容 + 发送） ----------------
  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  onTitleInput(e) {
    this.setData({ titleText: e.detail.value })
  },

  toggleTitleInput() {
    this.setData({ showTitleInput: !this.data.showTitleInput })
  },

  // 发送：归入当前顶部选中的标签（家人/宠物），无需再弹窗选择
  onSend() {
    const text = (this.data.inputText || '').trim()
    if (!text) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    const title = (this.data.titleText || this.data.referencedTitle || '').trim()
    this.doCreate(text, title, this.data.tag)
  },

  doCreate(text, title, tag) {
    db.create({
      type: 'memo',
      content: text,
      title,
      memo_tag: tag,
      creator_nickname: getApp().getNickname()
    })
      .then(() => {
        this.setData({
          inputText: '',
          titleText: '',
          showTitleInput: false,
          referencedTitle: ''
        })
        wx.showToast({ title: '已发送', icon: 'success' })
        // 静默刷新：不销毁时间线视图，随后停在最后一条消息处，不再回到顶部
        this.loadData(true).then(() => this.scrollToBottom())
      })
      .catch((err) => wx.showToast({ title: err.message || '发送失败', icon: 'none' }))
  },

  // 滚动到时间线底部（停留在最后一条消息所在界面）
  scrollToBottom() {
    wx.nextTick(() => {
      wx.pageScrollTo({ scrollTop: 999999, duration: 200 })
    })
  }
})
