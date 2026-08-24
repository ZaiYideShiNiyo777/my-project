// behaviors/diet-editor.js —— 饮食内联编辑公共逻辑
// 饮食主页（当天视图）与「更多时间」页（周视图）共用：
// 餐次卡片点击展开内联编辑（食物搜索、分类筛选、多选勾选、自定义名称/数量、
// 热量统计、保存、已吃打卡），保证两页编辑交互完全一致、逻辑只维护一份。
const db = require('../utils/db.js')
const icons = require('../utils/icons.js')
const { enrichFoodKcal } = require('../utils/food.js')
// 前端内置食物库（180 条）：云端 foods_library 为空/未部署 seedFoods 时兜底，保证分类筛选始终可用
const LOCAL_FOODS = require('../utils/foodData.js')

// 餐次及对应时间范围（顺序：早/午/晚/其他；其他 = 吃药或补给）
// icon 为线条风图标（参考 Meela 金融 UI：圆角线条，简单明了）
const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', icon: icons['sun-orange'], timeRange: '06:00-09:00' },
  { key: 'lunch', label: '午餐', icon: icons['sun-blue'], timeRange: '11:00-13:30' },
  { key: 'dinner', label: '晚餐', icon: icons['moon-blue'], timeRange: '17:30-20:30' },
  { key: 'other', label: '其他', icon: icons['pill-blue'], timeRange: '随时' }
]

// 食物库分类 chips（icon/iconActive 为线条风图标，未选中灰 / 选中蓝）
const FOOD_CATEGORIES = [
  { key: '', label: '全部' },
  { key: 'staple', label: '主食', icon: icons['bowl-gray'], iconActive: icons['bowl-blue'] },
  { key: 'protein', label: '肉蛋奶', icon: icons['egg-gray'], iconActive: icons['egg-blue'] },
  { key: 'vegetable', label: '蔬菜', icon: icons['leaf-gray'], iconActive: icons['leaf-blue'] },
  { key: 'fruit', label: '水果', icon: icons['apple-gray'], iconActive: icons['apple-blue'] },
  { key: 'snack', label: '零食', icon: icons['snack-gray'], iconActive: icons['snack-blue'] },
  { key: 'meal', label: '家常菜', icon: icons['pot-gray'], iconActive: icons['pot-blue'] }
]

// 食物分类徽章映射：食物项卡片左侧的分类标识（灰色线条图标 + 分类名，与 chips 同风格）
const CATEGORY_META = {
  staple: { icon: icons['bowl-gray'], label: '主食' },
  protein: { icon: icons['egg-gray'], label: '肉蛋奶' },
  vegetable: { icon: icons['leaf-gray'], label: '蔬菜' },
  fruit: { icon: icons['apple-gray'], label: '水果' },
  snack: { icon: icons['snack-gray'], label: '零食' },
  meal: { icon: icons['pot-gray'], label: '家常菜' }
}

module.exports = Behavior({
  data: {
    mealTypes: MEAL_TYPES,
    foodCategories: FOOD_CATEGORIES,
    // 食物库缓存（首次进入内联编辑时加载，云端为空时前端内置库兜底）
    foods: [],
    // 餐次内联编辑（直接在当前餐次分区内修改，不弹窗）
    editMeal: null, // { date, meal }
    editMealLabel: '',
    editFilteredFoods: [],
    editCategory: '',
    editKeyword: '',
    editSelectedMap: {}, // { 食物名: true }
    editSelectedCount: 0,
    editSelectedKcal: 0,
    editCustomName: '',
    editCustomQty: '',
    editFoodsLoading: false // 食物库异步加载中（展开编辑区后列表先占位，避免点击无反馈）
  },

  methods: {
    // ---------------- 点击餐次卡片：展开内联编辑（直接在当前餐次分区内修改，不弹窗） ----------------
    onMealTap(e) {
      const { date, meal } = e.currentTarget.dataset
      // 该餐已在编辑态时点击卡片头部区域收起编辑
      if (this.data.editMeal && this.data.editMeal.date === date && this.data.editMeal.meal === meal) {
        this.setData({ editMeal: null })
        return
      }
      this.openInlineEdit(date, meal)
    },

    // 内联编辑区根节点：拦截点击冒泡，避免误触卡片导致收起/重开编辑
    onEditBlock() {},

    closeInlineEdit() {
      this.setData({ editMeal: null })
    },

    // 展开编辑：立即展开编辑区（点击即时反馈，不等食物库网络返回），
    // 食物库异步加载完成后回填已选食物 + 未匹配项（自定义）
    openInlineEdit(date, meal) {
      const mealMeta = MEAL_TYPES.find((m) => m.key === meal) || { key: 'other', label: '其他' }
      this.setData({
        editMeal: { date, meal },
        editMealLabel: mealMeta.label,
        editKeyword: '',
        editCategory: '',
        editSelectedMap: {},
        editCustomName: '',
        editCustomQty: '',
        editFoodsLoading: true,
        editFilteredFoods: []
      })
      this.loadFoods().then((foods) => {
        // 竞态保护：加载期间用户可能已切到其他餐次或收起编辑，仅当仍在本次编辑时应用结果
        const cur = this.data.editMeal
        if (!cur || cur.date !== date || cur.meal !== meal) return
        const existing = this.findRecord(date, meal)
        const foodItems = Array.isArray(existing && existing.food_items) ? existing.food_items : []
        // 食物项保存格式为「名称+份量」（如 米饭1碗(300g)），用完整串匹配避免子串误命中（如「鸡蛋面」误匹配「鸡蛋」）
        const itemHit = (it, f) =>
          it === f.name || it.indexOf(f.name + (f.standard_portion || '')) > -1
        const selectedMap = {}
        foodItems.forEach((it) => {
          const hit = foods.find((f) => itemHit(it, f))
          if (hit) selectedMap[hit.name] = true
        })
        const unmatched = foodItems.filter((it) => !foods.some((f) => itemHit(it, f)))
        this.setData({
          editSelectedMap: selectedMap,
          editCustomName: unmatched.join('、'),
          editFoodsLoading: false
        })
        this.updateEditStats()
        this.applyEditFilter()
      })
    },

    // 食物库加载（仅一次）：云端 foods_library 为空/未部署 seedFoods 时前端内置库兜底
    loadFoods() {
      if (this.data.foods.length > 0) return Promise.resolve(this.data.foods)
      return db
        .listFoods()
        .then((foods) => {
          const source = Array.isArray(foods) && foods.length > 0 ? foods : LOCAL_FOODS
          const enriched = source.map(enrichFoodKcal)
          this.setData({ foods: enriched })
          return enriched
        })
        .catch(() => {
          const enriched = LOCAL_FOODS.map(enrichFoodKcal)
          this.setData({ foods: enriched })
          return enriched
        })
    },

    onEditFoodSearch(e) {
      this.setData({ editKeyword: (e.detail.value || '').trim() })
      this.applyEditFilter()
    },

    onEditCategoryFilter(e) {
      this.setData({ editCategory: e.currentTarget.dataset.cat })
      this.applyEditFilter()
    },

    // 关键词 + 分类 双重过滤（内联编辑区食物列表），并附加分类徽章信息（图标 + 分类名）
    applyEditFilter() {
      const kw = this.data.editKeyword
      const cat = this.data.editCategory
      this.setData({
        editFilteredFoods: this.data.foods
          .filter((f) => (!kw || f.name.indexOf(kw) > -1) && (!cat || f.category === cat))
          .map((f) => {
            const m = CATEGORY_META[f.category] || CATEGORY_META.meal
            return Object.assign({}, f, { catIcon: m.icon, catLabel: m.label })
          })
      })
    },

    onEditFoodToggle(e) {
      const { index } = e.currentTarget.dataset
      const food = this.data.editFilteredFoods[index]
      const selectedMap = Object.assign({}, this.data.editSelectedMap)
      if (selectedMap[food.name]) delete selectedMap[food.name]
      else selectedMap[food.name] = true
      this.setData({ editSelectedMap: selectedMap })
      this.updateEditStats()
    },

    // 更新已选统计（数量与总热量）
    updateEditStats() {
      const selected = this.data.foods.filter((f) => this.data.editSelectedMap[f.name])
      this.setData({
        editSelectedCount: selected.length,
        editSelectedKcal: selected.reduce((sum, f) => sum + Number(f.calories || 0), 0)
      })
    },

    onEditCustomName(e) {
      this.setData({ editCustomName: e.detail.value })
    },

    onEditCustomQty(e) {
      this.setData({ editCustomQty: e.detail.value })
    },

    // 保存：所选食物 + 自定义项合并为一条餐次记录，成功后收起编辑区
    confirmInlineEdit() {
      const selected = this.data.foods.filter((f) => this.data.editSelectedMap[f.name])
      const customName = (this.data.editCustomName || '').trim()
      const customQty = (this.data.editCustomQty || '').trim()
      if (selected.length === 0 && !customName) {
        wx.showToast({ title: '请选择或输入至少一项食物', icon: 'none' })
        return
      }
      const names = selected.map((f) => `${f.name}${f.standard_portion}`)
      if (customName) names.push(customQty ? `${customName} ${customQty}` : customName)
      const calories = selected.reduce((sum, f) => sum + Number(f.calories || 0), 0)
      this.saveMeal({ content: names.join('、'), food_items: names, calories })
        .then(() => {
          this.setData({ editMeal: null })
        })
        .catch(() => {}) // 保存失败时编辑区保持展开（失败原因已由 saveMeal 内 toast 提示），避免用户输入丢失
    },

    // ---------------- 保存（有则更新，无则创建） ----------------
    findRecord(date, mealKey) {
      // “其他”兼容旧数据“加餐(snack)”，同一槽位内互斥
      const keys = mealKey === 'other' ? ['other', 'snack'] : [mealKey]
      return this.data.records.find((r) => r.week_date === date && keys.indexOf(r.meal_type) > -1)
    },

    saveMeal(payload) {
      const edit = this.data.editMeal || {}
      if (!edit.date || !edit.meal) return Promise.reject(new Error('未指定餐次'))
      const existing = this.findRecord(edit.date, edit.meal)
      const done = () => {
        wx.showToast({ title: '已保存', icon: 'success' })
        this.loadData()
      }
      const fail = (err) => {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
        return Promise.reject(err) // 保持 rejected 链：调用方不会收起编辑区
      }
      if (existing) {
        return db.update(existing._id, payload).then(done).catch(fail)
      }
      return db
        .create(
          Object.assign(
            {
              type: 'diet',
              week_date: edit.date,
              meal_type: edit.meal,
              creator_nickname: getApp().getNickname()
            },
            payload
          )
        )
        .then(done)
        .catch(fail)
    }
  }
})
