// 自定义 TabBar：线条风格 SVG 图标（参考 Meela 金融 UI，简单明了通俗易懂）
// 选中态：浅蓝圆角胶囊背景 + 蓝色图标 + 蓝色文字（替代原来的放大上移动效）
// 注意：自定义 tabBar 不支持 wx.hideTabBar/wx.showTabBar（该 API 只对原生 tabBar 生效），
// 页面弹层打开时必须通过 getTabBar().setData({ hidden: true }) 隐藏本组件，否则弹层底部按钮被遮挡
const icons = require('../utils/icons.js')

Component({
  data: {
    hidden: false, // true=弹层打开中，组件整体隐藏（由页面 utils/tabbar.js 统一控制）
    selected: 0,
    list: [
      { pagePath: '/pages/diet/diet', text: '饮食计划', icon: icons['tab-diet-tabGray'], iconActive: icons['tab-diet-tabBlue'] },
      { pagePath: '/pages/shopping/shopping', text: '购物清单', icon: icons['tab-shop-tabGray'], iconActive: icons['tab-shop-tabBlue'] },
      { pagePath: '/pages/memo/memo', text: '家庭备忘', icon: icons['tab-memo-tabGray'], iconActive: icons['tab-memo-tabBlue'] },
      { pagePath: '/pages/price/price', text: '价格笔记', icon: icons['tab-price-tabGray'], iconActive: icons['tab-price-tabBlue'] },
      { pagePath: '/pages/mine/mine', text: '我的', icon: icons['tab-mine-tabGray'], iconActive: icons['tab-mine-tabBlue'] }
    ]
  },

  lifetimes: {
    // 组件重新挂载（热重载/异常重建）时兜底复位，杜绝 hidden 残留导致 tabBar 永久隐藏
    attached() {
      this.setData({ hidden: false })
    }
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const path = e.currentTarget.dataset.path
      if (index === this.data.selected) return
      // 切换前强制恢复显示：即使当前 hidden 被异常置为 true，也保证目标页 tabBar 可见
      this.setData({ hidden: false })
      wx.switchTab({ url: path })
    }
  }
})
