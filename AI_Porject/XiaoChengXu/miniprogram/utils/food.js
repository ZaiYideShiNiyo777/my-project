// food.js —— 食物热量计算公共工具（每50g热量）
// 数据来源：foods_library 预制食物库（cloudfunctions/seedFoods 灌入）。
// 老数据/未部署云函数时缺少 kcal_per_50g 字段，前端用本模块兜底：
//   1) 优先从份量文本（如 "100g"、"1碗(300g)"）提取克数，按比例换算；
//   2) 换算不了的（按个/根/片计量的食物）查 FALLBACK_50G 估算表。
// ⚠️ FALLBACK_50G 与 cloudfunctions/seedFoods/index.js 中的同名表保持同步，
//    修改时必须两处一起更新（云函数与小程序分属不同部署包，无法跨目录引用）。

// 无法从份量文本提取克数的食物：按典型份量重量估算的每50g热量（kcal）
const FALLBACK_50G = {
  全麦面包: 58, // 2片≈60g
  白面包: 75,
  玉米: 28, // 1根可食≈200g
  包子: 110, // 1个≈100g
  全麦馒头: 100,
  花卷: 105,
  烧饼: 120,
  锅贴: 31, // 4个≈120g
  鸡蛋: 72, // 1个≈50g
  鸭蛋: 64, // 1个≈70g
  火腿肠: 92, // 1根≈60g
  苹果: 24, // 1个≈200g
  香蕉: 38, // 1根≈120g
  橙子: 17, // 1个≈180g
  梨: 16, // 1个≈250g
  猕猴桃: 23, // 1个≈100g
  桃子: 13, // 1个≈200g
  柠檬: 9, // 1个≈100g
  方便面: 263, // 面饼≈90g
  牛角包: 192, // 1个≈60g
  蛋挞: 200, // 1个≈50g
  月饼: 190, // 1个≈100g
  沙琪玛: 150, // 1块≈50g
  燕麦棒: 200, // 1根≈30g
  能量棒: 200, // 1根≈50g
  饺子: 19, // 5个≈125g
  馄饨: 8, // 10个≈150g
  汉堡: 138, // 1个≈200g
  披萨: 140, // 1片≈100g
  三明治: 100, // 1个≈150g
  寿司: 17, // 6个≈150g
  油条: 169, // 1根≈80g
  煎饼果子: 75, // 1份≈300g
  蔬菜沙拉: 36, // 1份(含酱)≈250g
  咖喱鸡饭: 81, // 1份≈400g
  可乐鸡翅: 113 // 4个≈200g
}

// 从份量文本提取克数（如 "100g"、"1碗(300g)"、"2片(60g)" → 取首个数字）
function extractGrams(text) {
  if (!text) return 0
  const m = String(text).match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i)
  return m ? Number(m[1]) : 0
}

// 计算单条食物的每50g热量（kcal），无数据返回空串
function calcKcalPer50g(food) {
  if (!food) return ''
  if (food.kcal_per_50g !== undefined && food.kcal_per_50g !== null && food.kcal_per_50g !== '') {
    return Number(food.kcal_per_50g)
  }
  const grams = extractGrams(food.standard_portion) || extractGrams(food.unit)
  if (grams > 0) {
    return Math.round((Number(food.calories || 0) * 50) / grams)
  }
  const fallback = FALLBACK_50G[food.name]
  return fallback === undefined ? '' : fallback
}

// 返回带 kcal_per_50g 字段的新对象（不改原对象）
function enrichFoodKcal(food) {
  return Object.assign({}, food, { kcal_per_50g: calcKcalPer50g(food) })
}

module.exports = { FALLBACK_50G, extractGrams, calcKcalPer50g, enrichFoodKcal }
