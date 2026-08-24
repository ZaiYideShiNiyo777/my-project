// 云函数 clearExpiredData —— 每日凌晨 2:00 定时清理过期数据（PRD 逻辑 B）
// 规则：expire_at < 当前时间 且 is_completed == true 的记录 → 物理删除
// 同步删除云存储中对应的 voice_file_id 文件（若有）
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const MAX_LIMIT = 100
const COLL_RECORDS = 'user_records'

// 同一集合内分页拉全
async function fetchAll(where) {
  const countRes = await db.collection(COLL_RECORDS).where(where).count()
  const total = countRes.total
  const times = Math.ceil(total / MAX_LIMIT)
  let all = []
  for (let i = 0; i < times; i++) {
    const res = await db.collection(COLL_RECORDS).where(where).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    all = all.concat(res.data)
  }
  return all
}

exports.main = async () => {
  const now = new Date().toISOString()
  const where = _.and([{ expire_at: _.lt(now) }, { is_completed: true }])

  let total = 0
  let deleted = 0
  let filesDeleted = 0

  try {
    const list = await fetchAll(where)
    total = list.length
    for (const doc of list) {
      // 删除云存储语音文件（若存在）
      if (doc.voice_file_id) {
        try {
          await cloud.deleteFile({ fileList: [doc.voice_file_id] })
          filesDeleted++
        } catch (e) {
          console.warn('删除语音文件失败（忽略）', doc.voice_file_id, e)
        }
      }
      await db.collection(COLL_RECORDS).doc(doc._id).remove()
      deleted++
    }
  } catch (e) {
    console.error('clearExpiredData 执行异常', e)
    return { code: -1, msg: String(e.errMsg || e.message || '') }
  }

  console.log(`清理完成：共 ${total} 条过期记录，删除 ${deleted} 条，删除语音文件 ${filesDeleted} 个`)
  return { code: 0, data: { total, deleted, filesDeleted } }
}
