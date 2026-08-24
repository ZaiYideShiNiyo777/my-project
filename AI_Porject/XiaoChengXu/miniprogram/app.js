// app.js 生活胶囊 · 实时协作备忘录
const db = require('./utils/db.js')

App({
  globalData: {
    // TODO: 部署前将 env 改为你的云开发环境 ID（云开发控制台首页可查看）
        env: 'cloud1-d4gen059nf1d72ad4',
    openid: '',
    nickname: '',
    shareRecordId: '', // 通过分享卡片进入时携带的清单记录 ID
    shareInviteId: '' // 通过邀请卡片进入时携带的邀请 ID
  },

  onLaunch(options) {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true
      })
    }
    // 部署前检查：env 仍是占位符时给出明确提示，避免误判为代码问题
    if (this.globalData.env === 'YOUR_ENV_ID') {
      console.error('[生活胶囊] 请先在 app.js 中将 YOUR_ENV_ID 替换为云开发环境 ID（云开发控制台首页可查看）')
    }
    this.parseShare(options)
    this.getOpenId()
  },

  onShow(options) {
    // 热启动（小程序已在后台，通过分享卡片再次进入）时解析分享参数
    this.parseShare(options)
    // 兜底：每次回到前台恢复当前页自定义 tabBar，防止弹层关闭路径中断导致 hidden 残留（tabBar 自动隐藏）
    this.restoreTabBar()
  },

  // 恢复当前页面自定义 tabBar 显示（与各 tab 页 onShow 的重置互为双保险）
  restoreTabBar() {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
      page.getTabBar().setData({ hidden: false })
    }
  },

  parseShare(options) {
    if (options && options.query && options.query.shareRecordId) {
      this.globalData.shareRecordId = options.query.shareRecordId
    }
    if (options && options.query && options.query.inviteId) {
      this.globalData.shareInviteId = options.query.inviteId
    }
  },

  // 获取当前用户 openid（由 record 云函数返回，云端强制）
  getOpenId() {
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid)
    }
    const cached = wx.getStorageSync('openid')
    if (cached) {
      this.globalData.openid = cached
      return Promise.resolve(cached)
    }
    return wx.cloud
      .callFunction({ name: 'record', data: { action: 'whoami' } })
      .then((res) => {
        const r = res.result || {}
        if (r.code === 0 && r.data && r.data.openid) {
          this.globalData.openid = r.data.openid
          wx.setStorageSync('openid', r.data.openid)
          // 首次拉取 openid 时顺带同步云端昵称（换设备/清缓存后可恢复）
          if (r.data.nickname) {
            this.globalData.nickname = r.data.nickname
            wx.setStorageSync('nickname', r.data.nickname)
          }
          return r.data.openid
        }
        return ''
      })
      .catch((err) => {
        console.error('获取 openid 失败', err)
        const msg = (err && err.message) || ''
        // 未开通云开发 / env 未配置 / 云函数未部署时给出可操作的提示
        if (msg.indexOf('-601034') > -1 || msg.indexOf('没有权限') > -1) {
          wx.showModal({
            title: '云开发未就绪',
            content: '请先在 app.js 中配置云环境 ID，并在开发者工具中开通云开发、部署 record 云函数',
            showCancel: false
          })
        } else if (msg.indexOf('-501000') > -1 || msg.indexOf('Environment invalid') > -1) {
          // 环境 ID 无效：区分占位符未替换 / 填错两种情况
          const isPlaceholder = this.globalData.env === 'YOUR_ENV_ID'
          wx.showModal({
            title: '云环境 ID 无效',
            content: isPlaceholder
              ? 'app.js 中的 env 仍是占位符 YOUR_ENV_ID，请替换为云开发控制台中的真实环境 ID'
              : 'app.js 中的 env（' + this.globalData.env + '）不是有效的环境 ID，请检查是否填错（注意是环境 ID 而非环境名称）',
            showCancel: false
          })
        }
        return ''
      })
  },

  // 获取昵称：globalData → 本地缓存 → openid 后 6 位
  // 云端为权威数据源：启动拉 openid 时同步（见 getOpenId），保存时写云（见 setNickname）
  getNickname() {
    if (this.globalData.nickname) return this.globalData.nickname
    const cached = wx.getStorageSync('nickname')
    if (cached) {
      this.globalData.nickname = cached
    }
    return this.globalData.nickname || this.globalData.openid.slice(-6) || '我'
  },

  // 保存昵称：本地乐观更新立即生效，云端 user_profiles 持久化（失败回滚本地）
  // 返回 Promise，调用方可感知云端保存结果
  setNickname(name) {
    const trimmed = String(name || '')
      .trim()
      .slice(0, 20)
    const old = this.globalData.nickname || wx.getStorageSync('nickname') || ''
    this.globalData.nickname = trimmed
    wx.setStorageSync('nickname', trimmed)
    return db.updateNickname(trimmed).catch((err) => {
      // 云端保存失败：回滚本地，保证下次启动与云端一致
      if (old) {
        this.globalData.nickname = old
        wx.setStorageSync('nickname', old)
      } else {
        this.globalData.nickname = ''
        wx.removeStorageSync('nickname')
      }
      throw err
    })
  }
})
