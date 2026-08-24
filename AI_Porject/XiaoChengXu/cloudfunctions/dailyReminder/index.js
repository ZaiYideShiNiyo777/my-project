// 云函数 dailyReminder —— 每日待办提醒推送（定时触发器：每天 06:00 和 18:00）
// 逻辑：定时触发后先按北京时间判断当前时段（早上/晚上）→ 遍历 subscriptions 中选中该时段的用户 →
//      统计其未完成且未过期的待办（购物+备忘）→ 调用 subscribeMessage.send 发送订阅消息
//      （一次性订阅：每授权一次可推一条）
// 注意：模板关键词字段名以你选用的订阅消息模板为准，如模板关键词为「提醒内容」则对应 thing1，
//      关键词顺序不同时调整下方 buildData() 的映射即可。
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const COLL_SUBSCRIPTIONS = 'subscriptions'
const COLL_RECORDS = 'user_records'
const MAX_LIMIT = 100

// TODO: 替换为你在微信公众平台选用的订阅消息模板 ID（与 mine.js 中一致）
const TEMPLATE_ID = '4Q0UDffT60bFciz6bBxo0wvfttqhFIfnNnODYsHFjdY'

// 北京时间小时 → 推送时段（订阅用户可按 06:00 / 18:00 选择）
const SLOT_MAP = { 6: '06:00', 18: '18:00' }

// 同一集合分页拉全
async function fetchAll(collection, where) {
  const countRes = await db.collection(collection).where(where).count()
  const times = Math.ceil(countRes.total / MAX_LIMIT)
  let all = []
  for (let i = 0; i < times; i++) {
    const res = await db
      .collection(collection)
      .where(where)
      .skip(i * MAX_LIMIT)
      .limit(MAX_LIMIT)
      .get()
    all = all.concat(res.data)
  }
  return all
}

// 组装订阅消息 data：字段名 = 模板关键词序号（thing1/number1/time1...）
// 请根据你选用的模板关键词顺序调整：如第 1 个关键词是「提醒内容」→ thing1
function buildData(pendingCount, nickname) {
  return {
    thing1: { value: `${nickname}，今天还有 ${pendingCount} 件待办未完成，点击查看` },
    number1: { value: pendingCount }
  }
}

exports.main = async () => {
  const stats = { total: 0, sent: 0, failed: 0, skipped: 0 }
  try {
    // 云函数运行环境为 UTC，换算北京时间（UTC+8）判断当前推送时段
    const hour = new Date(Date.now() + 8 * 3600 * 1000).getUTCHours()
    const slot = SLOT_MAP[hour]
    if (!slot) return { code: 0, data: Object.assign({ noSlot: true, hour }, stats) }

    // 1. 查出所有开启订阅的用户
    const subs = await fetchAll(COLL_SUBSCRIPTIONS, { on: true })
    stats.total = subs.length

    // 2. 逐个用户统计待办并推送（仅推送其选中的时段）
    for (const sub of subs) {
      const openid = sub._openid
      try {
        // 兼容旧数据：无 times 时按 on 推导（on=true → 默认晚间 18:00）
        const times = Array.isArray(sub.times)
          ? sub.times
          : sub.on
            ? ['18:00']
            : []
        if (times.indexOf(slot) === -1) {
          stats.skipped++
          continue // 该用户未选择当前时段
        }

        // 该用户可访问（自己创建或协作）的未完成、未过期记录（购物 + 备忘）
        const pending = await fetchAll(COLL_RECORDS, _.and([
          _.or([{ _openid: openid }, { shared_with: openid }]),
          { type: _.in(['shopping', 'memo']) },
          { is_completed: false },
          { is_deleted: false },
          { expire_at: _.gt(new Date().toISOString()) }
        ]))
        if (pending.length === 0) {
          stats.skipped++
          continue
        }
        // 推送文案用接收者自己的昵称（user_profiles 为权威数据）；协作记录排在前面时不能取创建者昵称
        let nickname = openid.slice(-6)
        try {
          const prof = await db
            .collection('user_profiles')
            .where({ _openid: openid })
            .limit(1)
            .get()
          if (prof.data.length > 0 && prof.data[0].nickname) {
            nickname = prof.data[0].nickname
          }
        } catch (e) {
          console.warn('查询用户昵称失败（user_profiles 集合可能未创建）', e)
        }
        await cloud.openapi.subscribeMessage.send({
          touser: openid,
          templateId: TEMPLATE_ID,
          page: 'pages/shopping/shopping',
          miniprogramState: 'formal',
          lang: 'zh_CN',
          data: buildData(pending.length, nickname)
        })
        stats.sent++
      } catch (e) {
        console.warn('推送失败 openid=' + openid, e.errCode || e.message)
        stats.failed++
      }
    }
    return { code: 0, data: stats }
  } catch (e) {
    console.error('dailyReminder 执行异常', e)
    return { code: -1, msg: String(e.errMsg || e.message || '') }
  }
}
