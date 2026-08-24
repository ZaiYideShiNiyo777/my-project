// 日期/价格/热量格式化工具

// Date 或 ISO 字符串 -> 'YYYY-MM-DD'
function dateToStr(d) {
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Date 或 ISO 字符串 -> 'M/D'
function dateToShort(d) {
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 生成某一周（以周一为起点）的 7 天
// offset: 0=本周, -1=上周, 1=下周
function getWeek(offset) {
  const now = new Date()
  const day = now.getDay() // 0=周日
  const diffToMonday = (day + 6) % 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday + offset * 7)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const weekLabel = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]
    days.push({
      date: dateToStr(d),
      label: weekLabel,
      monthDay: dateToShort(d),
      monthDayCN: `${d.getMonth() + 1}月${d.getDate()}日`, // 如 8月22日
      dateFull: `${weekLabel} ${d.getMonth() + 1}月${d.getDate()}日`, // 如 周日 8月23日（星期在前 + 日期，每日卡片一眼对应具体是哪一天）
      isToday: dateToStr(d) === dateToStr(now)
    })
  }
  return {
    offset,
    days,
    offsetLabel: offset === 0 ? '本周' : offset > 0 ? `下周` : `上周`, // 周切换条前缀：本周/下周/上周，一眼可知是哪一周
    rangeLabel: `${dateToShort(monday)} - ${days[6].monthDay}`,
    monday: dateToStr(monday),
    todayStr: dateToStr(now) // 用于跨天检测（饮食页自动推进当前周）
  }
}

// 生成任意日期所在周（以周一为起点）的 7 天：饮食页日期条用（点某天看那天计划，今天/选中态一目了然）
function getWeekByDate(dateStr) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr.replace(/-/g, '/') : dateStr
  const d = new Date(base)
  if (isNaN(d.getTime())) return getWeek(0).days
  const diffToMonday = (d.getDay() + 6) % 7
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diffToMonday)
  const days = []
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const weekLabel = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]
    const s = dateToStr(dd)
    days.push({
      date: s,
      label: weekLabel,
      monthDay: `${dd.getMonth() + 1}/${dd.getDate()}`,
      dateFull: `${weekLabel} ${dd.getMonth() + 1}月${dd.getDate()}日`,
      isToday: s === dateToStr(new Date())
    })
  }
  return days
}

// ISO 字符串 -> 日期分组标题（今天 8/22 / 昨天 8/21 / 8月20日）
function formatDateCN(iso) {
  if (!iso) return ''
  // iOS 不识别 'YYYY-MM-DD' 纯日期字符串，统一转 '/' 分隔再解析
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.replace(/-/g, '/') : iso
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return ''
  const today = dateToStr(new Date())
  const thatDay = dateToStr(d)
  if (thatDay === today) return `今天 ${d.getMonth() + 1}/${d.getDate()}`
  const yest = new Date(Date.now() - 24 * 3600 * 1000)
  if (thatDay === dateToStr(yest)) return `昨天 ${d.getMonth() + 1}/${d.getDate()}`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// ISO 字符串 -> "上午 10:23"
function formatTimeCN(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  let period = '上午'
  if (h >= 5 && h < 12) period = '上午'
  else if (h >= 12 && h < 14) period = '中午'
  else if (h >= 14 && h < 18) period = '下午'
  else if (h >= 18 && h < 24) period = '晚上'
  else period = '凌晨'
  return `${period} ${h}:${m}`
}

// 价格格式化 ¥89.00
function formatPrice(num) {
  if (num === undefined || num === null || isNaN(Number(num))) return '¥0.00'
  return `¥${Number(num).toFixed(2)}`
}

// 热量格式化 350kcal
function formatKcal(n) {
  return `${Number(n || 0)}kcal`
}

// 价格差值展示：↓10 / ↑5 / -
function priceDiff(oldP, newP) {
  if (oldP === undefined || oldP === null) return ''
  const diff = Number(newP) - Number(oldP)
  if (diff === 0) return '持平'
  return diff < 0 ? `↓${Math.abs(diff).toFixed(2)}` : `↑${diff.toFixed(2)}`
}

module.exports = {
  dateToStr,
  dateToShort,
  getWeek,
  getWeekByDate,
  formatTimeCN,
  formatDateCN,
  formatPrice,
  formatKcal,
  priceDiff
}
