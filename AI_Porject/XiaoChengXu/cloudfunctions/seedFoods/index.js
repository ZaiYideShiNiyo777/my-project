// 云函数 seedFoods —— 向 foods_library 导入预制食物（按 name 去重），并为每条补充 kcal_per_50g（每50g热量）
const cloud = require('wx-server-sdk')
const foods = require('./data.js')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const COLL_FOODS = 'foods_library'

// 无法从份量文本提取克数的食物：按典型份量重量估算的每50g热量（kcal）
// ⚠️ 与 miniprogram/utils/food.js 中的同名表保持同步（云函数与小程序分属不同部署包，无法跨目录引用）
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

// 从份量文本提取克数（g/ml 均按可食重量近似），如 '1碗(300g)' -> 300
function extractGrams(text) {
  if (!text) return null
  const m = String(text).match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i)
  return m ? Number(m[1]) : null
}

// 计算每50g热量：优先用份量克数换算，无法换算的用人工估算表
function calcKcalPer50g(food) {
  const grams = extractGrams(food.standard_portion) || extractGrams(food.unit)
  if (grams) return Math.round((Number(food.calories) * 50) / grams)
  if (FALLBACK_50G[food.name]) return FALLBACK_50G[food.name]
  return 0
}

exports.main = async () => {
  try {
    const existingRes = await db.collection(COLL_FOODS).limit(1000).get()
    const existingMap = {}
    existingRes.data.forEach((f) => {
      existingMap[f.name] = f
    })
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const food of foods) {
      const kcalPer50g = calcKcalPer50g(food)
      if (existingMap[food.name]) {
        // 已存在：仅补齐 kcal_per_50g（老数据无该字段或值不同才更新）
        if (existingMap[food.name].kcal_per_50g !== kcalPer50g) {
          await db.collection(COLL_FOODS).doc(existingMap[food.name]._id).update({
            data: { kcal_per_50g: kcalPer50g }
          })
          updated++
        } else {
          skipped++
        }
        continue
      }
      await db.collection(COLL_FOODS).add({
        data: Object.assign(
          {
            created_at: new Date().toISOString(),
            kcal_per_50g: kcalPer50g
          },
          food
        )
      })
      existingMap[food.name] = { kcal_per_50g: kcalPer50g }
      inserted++
    }

    return { code: 0, data: { total: foods.length, inserted, updated, skipped } }
  } catch (e) {
    console.error('seedFoods 执行异常', e)
    return { code: -1, msg: String(e.errMsg || e.message || '') }
  }
}
