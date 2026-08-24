// db.js —— user_records 数据库通用增删改查封装
// 所有读写均通过云函数 record 代理（权限校验在云端强制执行）
// 前端过滤规则：expire_at > 当前时间 且 is_deleted == false（云函数 list 已内置）

const ERR_DB_NOT_READY = '数据库未就绪'

function callRecord(data) {
  return wx.cloud
    .callFunction({ name: 'record', data })
    .then((res) => {
      const r = res.result || {}
      if (r.code !== 0) {
        const err = new Error(r.msg || '操作失败')
        err.code = r.code
        throw err
      }
      return r.data
    })
    .catch((err) => {
      const msg = (err && err.message) || ''
      // 云函数不可用（未部署/未建集合/未开通云开发）时给出友好提示
      if (msg.indexOf('FunctionName') > -1) {
        wx.showToast({ title: '请先部署 record 云函数', icon: 'none' })
      } else if (msg.indexOf('-501000') > -1 || msg.indexOf('Environment invalid') > -1) {
        wx.showToast({ title: '云环境 ID 无效，请检查 app.js 中的 env 配置', icon: 'none', duration: 2500 })
      } else if (msg.indexOf('-601034') > -1 || msg.indexOf('没有权限') > -1) {
        wx.showToast({ title: '云开发未开通，请先开通云开发并部署云函数', icon: 'none', duration: 2500 })
      } else if (err.code === -1) {
        wx.showToast({ title: ERR_DB_NOT_READY + '，请在控制台创建集合', icon: 'none' })
      }
      throw err
    })
}

module.exports = {
  // ---------- 用户 ----------
  whoami: () => callRecord({ action: 'whoami' }),

  // 昵称云端持久化（user_profiles，upsert）
  updateNickname: (nickname) => callRecord({ action: 'updateNickname', nickname }),

  // ---------- user_records 通用查询 ----------
  // opts: { type, keyword, memoTag, isCompleted, weekStart, weekEnd }
  list: (opts = {}) => callRecord(Object.assign({ action: 'list' }, opts)),

  get: (id) => callRecord({ action: 'get', id }),

  create: (data) => callRecord({ action: 'create', data }),

  update: (id, data) => callRecord({ action: 'update', id, data }),

  // 物理删除（含云存储语音文件）
  remove: (id) => callRecord({ action: 'remove', id }),

  // 标记完成/未完成（已购变灰置底）
  toggleComplete: (id, isCompleted) =>
    callRecord({ action: 'toggleComplete', id, isCompleted }),

  // 购物任务内单件物品勾选/取消（物品级 done，云端同步重算任务完成状态）
  toggleItem: (id, index, done) =>
    callRecord({ action: 'toggleItem', id, index, done }),

  // ---------- 价格 ----------
  // 修改价格并自动写入 price_history（云函数事务保证）
  updatePrice: (id, currentPrice) =>
    callRecord({ action: 'updatePrice', id, currentPrice }),

  // 价格列表：附带最近一次历史价
  listPrice: () => callRecord({ action: 'listPrice' }),

  getPriceHistory: (recordId) => callRecord({ action: 'getPriceHistory', recordId }),

  // ---------- 协作 ----------
  // 好友通过分享卡片加入协作（云端校验人数 ≤5、去重）
  join: (recordId, nickname) => callRecord({ action: 'join', recordId, nickname }),

  // 仅创建者可移除协作者
  removeMember: (recordId, openid) => callRecord({ action: 'removeMember', recordId, openid }),

  // 我的页：我创建的 + 我参与的清单
  listShared: () => callRecord({ action: 'listShared' }),

  // ---------- 饮食 ----------
  // foods_library 预制食物库
  listFoods: (keyword = '') => callRecord({ action: 'listFoods', keyword }),

  // ---------- 订阅消息 ----------
  // 设置订阅时段：times 为 ['06:00']/['18:00'] 的子集（可同时选两个），空数组 = 关闭
  subscribe: (times) => callRecord({ action: 'subscribe', times }),

  // 查询当前订阅状态与时段
  getSubscribe: () => callRecord({ action: 'getSubscribe' }),

  // ---------- 邀请协作 ----------
  // 取或建一条“待接受”邀请（复用 pending，避免垃圾记录），type: shopping|memo|price|diet
  getOrCreateInvitation: (type) =>
    callRecord({ action: 'getOrCreateInvitation', type }),

  // 接受邀请：该模块所有记录共享给受邀人 + 标记已接受
  acceptInvitation: (invitationId, nickname) =>
    callRecord({ action: 'acceptInvitation', invitationId, nickname }),

  // 我发起的全部邀请
  listInvitations: () => callRecord({ action: 'listInvitations' }),

  // 移除邀请（已接受的会同步移出协作成员）
  removeInvitation: (invitationId) =>
    callRecord({ action: 'removeInvitation', invitationId })
}
