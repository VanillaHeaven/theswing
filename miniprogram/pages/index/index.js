//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    roomid: null,
    token: null,
    bgurl: app.globalData.baseurl + '/images/bg1.jpg?temp=' + Math.floor(Math.random() * 100 + 1),
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  getRoomID: function () {
    var that = this;
    wx.request({
      url: 'http://' + app.globalData.baseurl + '/hello',
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: function (res) {
        console.log(res.data);
        that.setData({
          roomid: res.data,
        });
      },
    })
  },

  inputRoomid: function (e) {
    this.setData({
      roomid: e.detail.value
    })
  },

  inputToken: function (e) {
    this.setData({
      token: e.detail.value
    })
  },

  enter: function () {
    var that = this;
    wx.request({
      url: app.globalData.baseurl + '/hello',
      method: "POST",
      data: {
        hello: this.data.roomid,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        if(res.data){
          
          wx.navigateTo({
            url: '/pages/iseemini/iseemini?roomid=' + that.data.roomid + '&token=' + that.data.token
          })
        }
        else {
          wx.showToast({
            title: '不要瞎猜啦',
            icon: 'none',
            duration: 2000
          })
        }
      },
    })
  }
})
