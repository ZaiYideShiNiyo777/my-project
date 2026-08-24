// tabbar.js —— 自定义 tabBar 显示/隐藏统一封装
// 关键背景：本项目 app.json 配置 "custom": true（自定义 tabBar）。
// 微信官方 API wx.hideTabBar/wx.showTabBar 只对原生 tabBar 生效，对自定义 tabBar 无效，
// 且页面内 z-index 再高也无法覆盖它（真机原生渲染层）。
// 唯一可靠方案：通过组件自身的 hidden 状态控制，即 getTabBar().setData({ hidden: true/false })。
// 所有使用 .sheet 半屏弹层的 tab 页（shopping/price/diet/mine）必须统一走本模块，
// 弹层打开时 hideTabBar(this)，关闭/保存成功时 showTabBar(this)，保证底部按钮不被 tabBar 遮挡。

// 隐藏自定义 tabBar（弹层打开时调用）
function hideTabBar(page) {
  if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
    page.getTabBar().setData({ hidden: true })
  }
}

// 显示自定义 tabBar（弹层关闭/保存成功时调用）
function showTabBar(page) {
  if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
    page.getTabBar().setData({ hidden: false })
  }
}

module.exports = { hideTabBar, showTabBar }
