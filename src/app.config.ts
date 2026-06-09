export default defineAppConfig({
  pages: [
    'pages/task-hall/index',
    'pages/loading-register/index',
    'pages/route-nav/index',
    'pages/message-center/index',
    'pages/mine/index',
    'pages/task-detail/index',
    'pages/publish-task/index',
    'pages/handover/index',
    'pages/settlement/index',
    'pages/history-orders/index',
    'pages/rating/index',
    'pages/monthly-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2E7D32',
    navigationBarTitleText: '彭州竹运助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F1F8E9'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/task-hall/index',
        text: '任务大厅'
      },
      {
        pagePath: 'pages/loading-register/index',
        text: '装车登记'
      },
      {
        pagePath: 'pages/route-nav/index',
        text: '路线导航'
      },
      {
        pagePath: 'pages/message-center/index',
        text: '消息中心'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
