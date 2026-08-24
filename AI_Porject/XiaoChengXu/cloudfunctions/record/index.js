// 云函数 record —— 生活胶囊核心数据代理
// 职责：user_records 增删改查、协作管理（shared_with）、价格历史（price_history）、食物库查询
// 权限：仅创建者或协作者（shared_with 包含当前用户）可读写；shared_with 仅创建者可修改
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const COLL_RECORDS = 'user_records'
const COLL_PRICE_HISTORY = 'price_history'
const COLL_FOODS = 'foods_library'
const COLL_SUBSCRIPTIONS = 'subscriptions' // 订阅消息用户关系表
const COLL_INVITATIONS = 'invitations' // 邀请关系表（页面内主动邀请）
const COLL_PROFILES = 'user_profiles' // 用户资料表（昵称云端持久化）
const MAX_LIMIT = 100
const EXPIRE_DAYS = 10
const MAX_MEMBERS = 5
const TYPES = ['diet', 'shopping', 'memo', 'price']
const INVITE_TYPES = ['shopping', 'memo', 'price', 'diet'] // 支持页面内邀请的模块（跨页统一：接受一个邀请即全部生效）

const nowISO = () => new Date().toISOString()
const expireISO = () => new Date(Date.now() + EXPIRE_DAYS * 24 * 3600 * 1000).toISOString()

const ok = (data) => ({ code: 0, data, msg: 'ok' })
const fail = (msg) => ({ code: -1, msg })

const isCreator = (doc, openid) => doc._openid === openid
const isMember = (doc, openid) => (doc.shared_with || []).indexOf(openid) > -1
const canAccess = (doc, openid) => isCreator(doc, openid) || isMember(doc, openid)

// 同一集合内分页拉全
async function fetchAll(collection, where, orderBy) {
  const countRes = await db.collection(collection).where(where).count()
  const total = countRes.total
  const times = Math.ceil(total / MAX_LIMIT)
  let all = []
  for (let i = 0; i < times; i++) {
    let query = db.collection(collection).where(where).skip(i * MAX_LIMIT).limit(MAX_LIMIT)
    if (orderBy) query = query.orderBy(orderBy.field, orderBy.direction)
    const res = await query.get()
    all = all.concat(res.data)
  }
  return all
}

// 公共权限查询条件：创建者本人 或 shared_with 包含当前用户
function accessWhere(openid) {
  return _.or([{ _openid: openid }, { shared_with: openid }])
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const action = event.action

  try {
    switch (action) {
      case 'whoami':
        return await doWhoami(OPENID)
      case 'updateNickname':
        return await doUpdateNickname(event, OPENID)

      case 'list':
        return await doList(event, OPENID)
      case 'get':
        return await doGet(event, OPENID)
      case 'create':
        return await doCreate(event, OPENID)
      case 'update':
        return await doUpdate(event, OPENID)
      case 'remove':
        return await doRemove(event, OPENID)
      case 'toggleComplete':
        return await doToggleComplete(event, OPENID)
      case 'toggleItem':
        return await doToggleItem(event, OPENID)
      case 'updatePrice':
        return await doUpdatePrice(event, OPENID)
      case 'getPriceHistory':
        return await doGetPriceHistory(event, OPENID)
      case 'listPrice':
        return await doListPrice(OPENID)
      case 'listShared':
        return await doListShared(OPENID)
      case 'join':
        return await doJoin(event, OPENID)
      case 'removeMember':
        return await doRemoveMember(event, OPENID)
      case 'listFoods':
        return await doListFoods(event)
      case 'subscribe':
        return await doSubscribe(event, OPENID)
      case 'getSubscribe':
        return await doGetSubscribe(OPENID)
      case 'getOrCreateInvitation':
        return await doGetOrCreateInvitation(event, OPENID)
      case 'acceptInvitation':
        return await doAcceptInvitation(event, OPENID)
      case 'listInvitations':
        return await doListInvitations(OPENID)
      case 'removeInvitation':
        return await doRemoveInvitation(event, OPENID)
      default:
        return fail('未知操作: ' + action)
    }
  } catch (e) {
    console.error('record 云函数异常', e)
    const msg = String(e.errMsg || e.message || '')
    if (msg.indexOf('collection not exists') > -1 || msg.indexOf('-502005') > -1) {
      return fail('数据库未就绪，请在云开发控制台创建集合: user_records / price_history / foods_library / user_profiles')
    }
    return fail('服务异常: ' + msg)
  }
}

// ---------------- list：通用列表（前端不可见过期记录） ----------------
async function doList(event, openid) {
  const { type, keyword, memoTag, isCompleted, weekStart, weekEnd } = event
  const cond = [accessWhere(openid), { is_deleted: false }, { expire_at: _.gt(nowISO()) }]
  if (type) {
    if (TYPES.indexOf(type) === -1) return fail('非法 type')
    cond.push({ type })
  }
  if (keyword) cond.push({ content: db.RegExp({ regexp: escapeReg(keyword), options: 'i' }) })
  if (memoTag) cond.push({ memo_tag: memoTag })
  if (isCompleted !== undefined && isCompleted !== null) cond.push({ is_completed: !!isCompleted })
  if (weekStart) cond.push({ week_date: _.gte(weekStart) })
  if (weekEnd) cond.push({ week_date: _.lte(weekEnd) })

  const list = await fetchAll(COLL_RECORDS, _.and(cond), { field: 'updated_at', direction: 'desc' })
  return ok(list)
}

// ---------------- get ----------------
async function doGet(event, openid) {
  const id = event.id
  if (!id) return fail('缺少 id')
  const res = await db.collection(COLL_RECORDS).doc(id).get()
  const doc = res.data
  if (!canAccess(doc, openid)) return fail('无权限访问该记录')
  return ok(doc)
}

// ---------------- create：自动补全创建者/过期时间 ----------------
// 自动共享：创建时把该模块「已接受邀请」的好友写入 shared_with（协作永久生效，新记录无需再次邀请）
async function doCreate(event, openid) {
  const data = event.data || {}
  const type = data.type
  if (TYPES.indexOf(type) === -1) return fail('非法 type: ' + type)
  const content = String(data.content || '').trim()
  if (!content) return fail('内容不能为空')

  const doc = {
    _openid: openid, // 云函数中手动写入创建者 openid
    type,
    content,
    voice_file_id: '',
    voice_duration: 0,
    is_completed: false,
    is_deleted: false,
    shared_with: [],
    shared_names: {},
    creator_nickname: String(data.creator_nickname || openid.slice(-6)),
    expire_at: expireISO(),
    created_at: nowISO(),
    updated_at: nowISO(),
    // 专属字段（仅收录合法值）
    meal_type: data.meal_type || '',
    week_date: data.week_date || '',
    calories: Number(data.calories) || 0,
    food_items: Array.isArray(data.food_items) ? data.food_items : [],
    items: Array.isArray(data.items) ? data.items : [], // 购物任务内物品列表 [{ name, done }]，物品级勾选状态
    cook_plan: String(data.cook_plan || ''),
    category: data.category || 'other',
    memo_tag: data.memo_tag || '',
    title: String(data.title || '').slice(0, 30), // 备忘标题（可选）
    is_reminder: !!data.is_reminder,
    current_price: Number(data.current_price) || 0,
    platform: String(data.platform || ''),
    product_url: String(data.product_url || '')
  }

  // 自动共享协作者：invitations 集合中该模块已接受（accepted）的邀请人（上限 MAX_MEMBERS，与 doJoin 一致）
  try {
    const accepted = await fetchAll(COLL_INVITATIONS, {
      _openid: openid,
      type,
      status: 'accepted'
    })
    const seen = {}
    for (const inv of accepted) {
      if (!inv.invitee_openid || seen[inv.invitee_openid]) continue
      if (doc.shared_with.length >= MAX_MEMBERS) break
      seen[inv.invitee_openid] = true
      doc.shared_with.push(inv.invitee_openid)
      doc.shared_names[inv.invitee_openid] =
        String(inv.invitee_nickname || inv.invitee_openid.slice(-6)).slice(0, 20)
    }
  } catch (e) {
    // invitations 集合未创建时静默降级（不影响创建主流程）
    console.warn('自动共享协作者失败（invitations 集合可能未创建）', e)
  }

  // 购物任务：任务级完成状态以物品级为准重算（预览全勾/旧数据升级时保持一致，与 doToggleItem 同语义）
  if (type === 'shopping' && doc.items.length > 0) {
    doc.is_completed = doc.items.every((it) => it.done)
  }

  const res = await db.collection(COLL_RECORDS).add({ data: doc })
  return ok(Object.assign({ _id: res._id }, doc))
}

// ---------------- update：字段白名单；shared_with 一律剥离（仅协作接口可改） ----------------
async function doUpdate(event, openid) {
  const id = event.id
  if (!id) return fail('缺少 id')
  const patch = event.data || {}
  const doc = (await db.collection(COLL_RECORDS).doc(id).get()).data
  if (!canAccess(doc, openid)) return fail('无权限修改该记录')

  const whiteList = [
    'content', 'meal_type', 'week_date', 'calories', 'food_items',
    'cook_plan', 'category', 'memo_tag', 'title', 'is_reminder',
    'platform', 'product_url', 'voice_file_id', 'voice_duration', 'creator_nickname',
    'items'
  ]
  const updateData = {}
  whiteList.forEach((k) => {
    if (patch[k] !== undefined) updateData[k] = patch[k]
  })
  // 协作者不可修改权限设置（shared_with）
  if (patch.shared_with !== undefined && !isCreator(doc, openid)) {
    return fail('仅创建者可修改协作者设置')
  }
  if (patch.shared_with !== undefined && isCreator(doc, openid)) {
    updateData.shared_with = patch.shared_with
  }
  if (Object.keys(updateData).length === 0) return fail('没有可更新的字段')
  updateData.updated_at = nowISO()

  await db.collection(COLL_RECORDS).doc(id).update({ data: updateData })
  return ok((await db.collection(COLL_RECORDS).doc(id).get()).data)
}

// ---------------- remove：物理删除 + 云存储语音文件 ----------------
async function doRemove(event, openid) {
  const id = event.id
  if (!id) return fail('缺少 id')
  const doc = (await db.collection(COLL_RECORDS).doc(id).get()).data
  if (!canAccess(doc, openid)) return fail('无权限删除该记录')

  if (doc.voice_file_id) {
    try {
      await cloud.deleteFile({ fileList: [doc.voice_file_id] })
    } catch (e) {
      console.warn('删除语音文件失败（忽略）', e)
    }
  }
  await db.collection(COLL_RECORDS).doc(id).remove()
  // 同步清理该记录的价格历史
  try {
    const history = await fetchAll(COLL_PRICE_HISTORY, { record_id: id })
    for (const h of history) {
      await db.collection(COLL_PRICE_HISTORY).doc(h._id).remove()
    }
  } catch (e) {
    console.warn('清理价格历史失败（忽略）', e)
  }
  return ok({ removed: id })
}

// ---------------- toggleComplete：勾选完成/取消完成 ----------------
async function doToggleComplete(event, openid) {
  const { id, isCompleted } = event
  if (!id) return fail('缺少 id')
  const doc = (await db.collection(COLL_RECORDS).doc(id).get()).data
  if (!canAccess(doc, openid)) return fail('无权限操作该记录')
  const updateData = {
    is_completed: !!isCompleted,
    updated_at: nowISO()
  }
  if (isCompleted) updateData.completed_at = nowISO()
  else updateData.completed_at = ''
  await db.collection(COLL_RECORDS).doc(id).update({ data: updateData })
  return ok((await db.collection(COLL_RECORDS).doc(id).get()).data)
}

// ---------------- toggleItem：购物任务内单件物品勾选/取消（物品级 done） ----------------
// 同步重算任务级 is_completed：全部物品完成则该任务完成，否则未完成
async function doToggleItem(event, openid) {
  const { id, index, done } = event
  if (!id || index === undefined || index < 0) return fail('参数缺失')
  const doc = (await db.collection(COLL_RECORDS).doc(id).get()).data
  if (!canAccess(doc, openid)) return fail('无权限操作该记录')

  // 兼容旧数据：无 items 字段时按单条记录构造（content + 原完成状态），平滑升级
  let items = Array.isArray(doc.items) ? doc.items.slice() : []
  if (items.length === 0) {
    items = doc.content ? [{ name: doc.content, done: !!doc.is_completed }] : []
  }
  if (index >= items.length) return fail('物品不存在')
  items[index] = Object.assign({}, items[index], { done: !!done })

  const allDone = items.length > 0 && items.every((it) => it.done)
  const updateData = { items, is_completed: allDone, updated_at: nowISO() }
  updateData.completed_at = allDone ? nowISO() : ''
  await db.collection(COLL_RECORDS).doc(id).update({ data: updateData })
  return ok((await db.collection(COLL_RECORDS).doc(id).get()).data)
}

// ---------------- updatePrice：事务写入价格历史 + 更新当前价 ----------------
async function doUpdatePrice(event, openid) {
  const { id, currentPrice } = event
  // 价格仅作统计记录：不做合法性拦截；无法解析时按 0 兕底，保证写入与统计正常
  const newPrice = Number(currentPrice) || 0
  if (!id) return fail('缺少 id')

  const doc = (await db.collection(COLL_RECORDS).doc(id).get()).data
  if (!canAccess(doc, openid)) return fail('无权限操作该记录')
  if (doc.type !== 'price') return fail('该记录不是价格笔记')

  const oldPrice = Number(doc.current_price) || 0
  const transaction = await db.startTransaction()
  try {
    if (oldPrice !== newPrice) {
      await transaction.collection(COLL_PRICE_HISTORY).add({
        data: {
          record_id: id,
          price: oldPrice, // 旧价格
          new_price: newPrice,
          changed_at: nowISO()
        }
      })
    }
    await transaction.collection(COLL_RECORDS).doc(id).update({
      data: { current_price: newPrice, updated_at: nowISO() }
    })
    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    throw e
  }
  return ok({ id, old_price: oldPrice, new_price: newPrice })
}

// ---------------- getPriceHistory：某商品的价格变动轨迹 ----------------
async function doGetPriceHistory(event, openid) {
  const { recordId } = event
  if (!recordId) return fail('缺少 recordId')
  const doc = (await db.collection(COLL_RECORDS).doc(recordId).get()).data
  if (!canAccess(doc, openid)) return fail('无权限访问该记录')
  const list = await fetchAll(COLL_PRICE_HISTORY, { record_id: recordId }, { field: 'changed_at', direction: 'desc' })
  return ok(list)
}

// ---------------- listPrice：价格列表 + 最近一次历史价 ----------------
async function doListPrice(openid) {
  const cond = _.and([
    accessWhere(openid),
    { type: 'price' },
    { is_deleted: false },
    { expire_at: _.gt(nowISO()) }
  ])
  const list = await fetchAll(COLL_RECORDS, cond, { field: 'updated_at', direction: 'desc' })
  if (list.length === 0) return ok([])

  const ids = list.map((r) => r._id)
  let history = []
  try {
    history = await fetchAll(
      COLL_PRICE_HISTORY,
      { record_id: _.in(ids) },
      { field: 'changed_at', direction: 'desc' }
    )
  } catch (e) {
    console.warn('价格历史查询失败（集合可能未创建）', e)
  }
  const lastMap = {}
  history.forEach((h) => {
    if (!lastMap[h.record_id]) lastMap[h.record_id] = h
  })
  return ok(list.map((r) => Object.assign({ last_history: lastMap[r._id] || null }, r)))
}

// ---------------- listShared：我的页（我创建的 + 我参与的清单） ----------------
async function doListShared(openid) {
  const types = ['shopping', 'memo']
  const created = await fetchAll(
    COLL_RECORDS,
    _.and([{ _openid: openid }, { type: _.in(types) }, { is_deleted: false }, { expire_at: _.gt(nowISO()) }]),
    { field: 'updated_at', direction: 'desc' }
  )
  const joined = await fetchAll(
    COLL_RECORDS,
    _.and([{ shared_with: openid }, { type: _.in(types) }, { is_deleted: false }, { expire_at: _.gt(nowISO()) }]),
    { field: 'updated_at', direction: 'desc' }
  )
  return ok({ created, joined })
}

// ---------------- join：好友通过分享卡片加入协作 ----------------
async function doJoin(event, openid) {
  const { recordId, nickname } = event
  if (!recordId) return fail('缺少 recordId')
  const doc = (await db.collection(COLL_RECORDS).doc(recordId).get()).data

  if (isCreator(doc, openid)) return fail('你是该清单的创建者，无需加入')
  if (isMember(doc, openid)) return fail('你已在协作成员中')
  if ((doc.shared_with || []).length >= MAX_MEMBERS) {
    return fail('协作者已达上限（5人），无法加入')
  }

  const sharedWith = (doc.shared_with || []).concat([openid])
  const sharedNames = Object.assign({}, doc.shared_names || {}, {
    [openid]: String(nickname || openid.slice(-6)).slice(0, 20)
  })
  await db.collection(COLL_RECORDS).doc(recordId).update({
    data: { shared_with: sharedWith, shared_names: sharedNames, updated_at: nowISO() }
  })
  return ok({ recordId, shared_with: sharedWith })
}

// ---------------- removeMember：仅创建者可移除协作者 ----------------
async function doRemoveMember(event, openid) {
  const { recordId, memberOpenid } = event
  if (!recordId || !memberOpenid) return fail('参数缺失')
  const doc = (await db.collection(COLL_RECORDS).doc(recordId).get()).data
  if (!isCreator(doc, openid)) return fail('仅创建者可移除协作者')

  const sharedWith = (doc.shared_with || []).filter((o) => o !== memberOpenid)
  const sharedNames = Object.assign({}, doc.shared_names || {})
  delete sharedNames[memberOpenid]
  await db.collection(COLL_RECORDS).doc(recordId).update({
    data: { shared_with: sharedWith, shared_names: sharedNames, updated_at: nowISO() }
  })
  // 同步清理邀请关系：避免创建新记录时自动共享把已移除的协作者重新加回（与 doRemoveInvitation 语义一致）
  try {
    const invs = await fetchAll(COLL_INVITATIONS, {
      _openid: openid,
      type: doc.type,
      status: 'accepted',
      invitee_openid: memberOpenid
    })
    for (const inv of invs) {
      await db.collection(COLL_INVITATIONS).doc(inv._id).remove()
    }
  } catch (e) {
    console.warn('清理邀请关系失败（忽略）', e)
  }
  return ok({ recordId, shared_with: sharedWith })
}

// ---------------- listFoods：预制食物库 ----------------
async function doListFoods(event) {
  const keyword = String(event.keyword || '').trim()
  const where = keyword
    ? { name: db.RegExp({ regexp: escapeReg(keyword), options: 'i' }) }
    : {}
  const list = await fetchAll(COLL_FOODS, where, { field: 'name', direction: 'asc' })
  return ok(list)
}

function escapeReg(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------- whoami：返回 openid + 云端昵称（user_profiles） ----------------
async function doWhoami(openid) {
  let nickname = ''
  try {
    const existing = await db
      .collection(COLL_PROFILES)
      .where({ _openid: openid })
      .limit(1)
      .get()
    if (existing.data.length > 0) nickname = existing.data[0].nickname || ''
  } catch (e) {
    // 集合未创建时静默降级（不影响 whoami 主流程）
    console.warn('查询用户资料失败（user_profiles 集合可能未创建）', e)
  }
  return ok({ openid, nickname })
}

// ---------------- updateNickname：保存昵称到 user_profiles（upsert） ----------------
async function doUpdateNickname(event, openid) {
  const name = String(event.nickname || '')
    .trim()
    .slice(0, 20)
  if (!name) return fail('昵称不能为空')
  const existing = await db
    .collection(COLL_PROFILES)
    .where({ _openid: openid })
    .limit(1)
    .get()
  if (existing.data.length > 0) {
    await db.collection(COLL_PROFILES).doc(existing.data[0]._id).update({
      data: { nickname: name, updated_at: nowISO() }
    })
  } else {
    await db.collection(COLL_PROFILES).add({
      data: { _openid: openid, nickname: name, created_at: nowISO(), updated_at: nowISO() }
    })
  }
  return ok({ nickname: name })
}

// ---------------- subscribe：记录/更新当前用户的订阅时段（upsert） ----------------
// times: ['06:00'] / ['18:00'] / 两者皆有；空数组 = 关闭全部
// 兼容旧版前端：传 on 布尔时按旧逻辑映射（true → 默认晚间 18:00）
async function doSubscribe(event, openid) {
  const raw = Array.isArray(event.times) ? event.times : event.on ? ['18:00'] : []
  const times = raw.filter((t) => t === '06:00' || t === '18:00')
  const unique = [...new Set(times)]
  const on = unique.length > 0
  const existing = await db
    .collection(COLL_SUBSCRIPTIONS)
    .where({ _openid: openid })
    .limit(1)
    .get()
  if (existing.data.length > 0) {
    await db.collection(COLL_SUBSCRIPTIONS).doc(existing.data[0]._id).update({
      data: { on, times: unique, updated_at: nowISO() }
    })
  } else {
    await db.collection(COLL_SUBSCRIPTIONS).add({
      data: { _openid: openid, on, times: unique, created_at: nowISO(), updated_at: nowISO() }
    })
  }
  return ok({ on, times: unique })
}

// ---------------- getSubscribe：查询当前用户的订阅时段 ----------------
async function doGetSubscribe(openid) {
  const existing = await db
    .collection(COLL_SUBSCRIPTIONS)
    .where({ _openid: openid })
    .limit(1)
    .get()
  if (existing.data.length === 0) return ok({ on: false, times: [] })
  const doc = existing.data[0]
  // 兼容旧数据（只有 on 无 times）：on=true → 默认晚间 18:00
  const times = Array.isArray(doc.times)
    ? doc.times.filter((t) => t === '06:00' || t === '18:00')
    : doc.on
      ? ['18:00']
      : []
  return ok({ on: times.length > 0, times })
}

// ---------------- 邀请机制 ----------------
// 邀请流程：邀请人点页面“邀请”按钮（分享卡片）→ 好友打开卡片 → acceptInvitation
// invitations 集合：{ _openid 邀请人, type 模块, status pending|accepted,
//                    invitee_openid 受邀人, invitee_nickname 受邀人昵称 }

// 取或建一条“待接受”邀请：有未使用的 pending 邀请则复用，避免重复生成垃圾记录
async function doGetOrCreateInvitation(event, openid) {
  const type = event.type
  if (INVITE_TYPES.indexOf(type) === -1) return fail('非法 type: ' + type)
  const existing = await db
    .collection(COLL_INVITATIONS)
    .where({ _openid: openid, type, status: 'pending' })
    .limit(1)
    .get()
  if (existing.data.length > 0) return ok(existing.data[0])
  const doc = {
    _openid: openid,
    type,
    status: 'pending',
    invitee_openid: '',
    invitee_nickname: '',
    created_at: nowISO(),
    updated_at: nowISO()
  }
  const res = await db.collection(COLL_INVITATIONS).add({ data: doc })
  return ok(Object.assign({ _id: res._id }, doc))
}

// 把邀请人某模块下全部有效记录共享给受邀人（接受邀请的核心动作，幂等），返回本次共享条数
async function shareModuleRecords(ownerOpenid, type, inviteeOpenid, sharedName) {
  const records = await fetchAll(
    COLL_RECORDS,
    _.and([
      { _openid: ownerOpenid },
      { type },
      { is_deleted: false },
      { expire_at: _.gt(nowISO()) }
    ])
  )
  let count = 0
  for (const r of records) {
    if (isCreator(r, inviteeOpenid) || isMember(r, inviteeOpenid)) continue
    const sharedWith = (r.shared_with || []).concat([inviteeOpenid])
    const sharedNames = Object.assign({}, r.shared_names || {}, { [inviteeOpenid]: sharedName })
    await db.collection(COLL_RECORDS).doc(r._id).update({
      data: { shared_with: sharedWith, shared_names: sharedNames, updated_at: nowISO() }
    })
    count++
  }
  return count
}

// 接受邀请：把邀请人该模块所有记录共享给受邀人，并标记邀请为已接受；
// 同时把邀请人发出的其他“待接受”邀请一并接受（一次接受、多处可用：
// 同一好友接受任意一个模块的邀请后，其余已邀请模块无需再次确认即可直接管理）
async function doAcceptInvitation(event, openid) {
  const { invitationId, nickname } = event
  if (!invitationId) return fail('缺少 invitationId')
  const inv = (await db.collection(COLL_INVITATIONS).doc(invitationId).get()).data
  if (inv._openid === openid) return fail('这是你发出的邀请')
  if (inv.status === 'accepted') return fail('该邀请已被接受')

  const sharedName = String(nickname || openid.slice(-6)).slice(0, 20)
  let totalAccepted = 0
  // 本次邀请对应的模块
  totalAccepted += await shareModuleRecords(inv._openid, inv.type, openid, sharedName)
  // 邀请人发出的其余待接受邀请（各模块最多一条 pending，全部一并生效）
  const pendings = (
    await fetchAll(COLL_INVITATIONS, { _openid: inv._openid, status: 'pending' })
  ).filter((p) => p._id !== invitationId)
  for (const p of pendings) {
    totalAccepted += await shareModuleRecords(inv._openid, p.type, openid, sharedName)
  }
  // 标记本次邀请与其余邀请为已接受
  const acceptIds = [invitationId].concat(pendings.map((p) => p._id))
  for (const id of acceptIds) {
    await db.collection(COLL_INVITATIONS).doc(id).update({
      data: {
        status: 'accepted',
        invitee_openid: openid,
        invitee_nickname: sharedName,
        updated_at: nowISO()
      }
    })
  }
  return ok({ accepted: totalAccepted })
}

// 我发起的全部邀请（前端按模块分类展示受邀人）
async function doListInvitations(openid) {
  const list = await fetchAll(
    COLL_INVITATIONS,
    { _openid: openid },
    { field: 'updated_at', direction: 'desc' }
  )
  return ok(list)
}

// 移除邀请：若已接受，同时把受邀人从该模块所有记录中移出
async function doRemoveInvitation(event, openid) {
  const { invitationId } = event
  if (!invitationId) return fail('缺少 invitationId')
  const inv = (await db.collection(COLL_INVITATIONS).doc(invitationId).get()).data
  if (inv._openid !== openid) return fail('仅邀请人可移除该邀请')

  if (inv.status === 'accepted' && inv.invitee_openid) {
    const records = await fetchAll(
      COLL_RECORDS,
      _.and([
        { _openid: openid },
        { type: inv.type },
        { is_deleted: false },
        { expire_at: _.gt(nowISO()) }
      ])
    )
    for (const r of records) {
      if (!isMember(r, inv.invitee_openid)) continue
      const sharedWith = (r.shared_with || []).filter((o) => o !== inv.invitee_openid)
      const sharedNames = Object.assign({}, r.shared_names || {})
      delete sharedNames[inv.invitee_openid]
      await db.collection(COLL_RECORDS).doc(r._id).update({
        data: { shared_with: sharedWith, shared_names: sharedNames, updated_at: nowISO() }
      })
    }
  }
  await db.collection(COLL_INVITATIONS).doc(invitationId).remove()
  return ok({ removed: invitationId })
}
