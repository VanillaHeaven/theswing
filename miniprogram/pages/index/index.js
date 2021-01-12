//index.js
//获取应用实例
const app = getApp()
let touchDotX = 0;//X按下时坐标
let touchDotY = 0;//y按下时坐标
let interval;//计时器
let time = 0;//从按下到松开共多少时间*100

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
      url: app.globalData.baseurl + '/hello?roomid=' + this.data.roomid,
      method: "GET",
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
  },

  // 触摸开始事件
  touchStart: function (e) {
    touchDotX = e.touches[0].pageX; // 获取触摸时的原点
    touchDotY = e.touches[0].pageY;
    // 使用js计时器记录时间    
    interval = setInterval(function () {
      time++;
    }, 100);
  },
  // 触摸结束事件
  touchEnd: function (e) {
    let touchMoveX = e.changedTouches[0].pageX;
    let touchMoveY = e.changedTouches[0].pageY;
    let tmX = touchMoveX - touchDotX;
    let tmY = touchMoveY - touchDotY;
    if (time < 20) {
      let absX = Math.abs(tmX);
      let absY = Math.abs(tmY);
      if (absX > 2 * absY) {
        if (tmX < 0) {
          wx.navigateTo({
            url: '/pages/read/read'
          })
        } else {
          console.log("右滑=====")
        }
      }
      if (absY > absX * 2 && tmY < 0) {

        wx.navigateTo({
          url: '/pages/word/word'
        })
      }
    }
    clearInterval(interval); // 清除setInterval
    time = 0;
  },
})
