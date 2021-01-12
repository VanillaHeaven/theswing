const app = getApp()

// miniprogram/pages/word/word.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    choose: 'show',
    dletter: 'hello',
    dtime: null,
    letter: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.request({
      url: app.globalData.baseurl + '/letter',
      method: 'GET',
      dataType: 'json',
      responseType: 'text',
      success: function (res) {
        var data = res.data;
        var date = new Date(data['timestamp']);
        var Y = date.getFullYear() + '-';
        var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
        var D = date.getDate() + ' ';
        var h = date.getHours() + ':';
        var m = date.getMinutes() + ':';
        var s = date.getSeconds(); 

        that.setData({
          dletter: data['msg'],
          dtime: Y+M+D+h+m+s,
        });
      },
    })
  },

  bindKeyInput: function (e) {
    this.setData({
      letter: e.detail.value
    })
  },

  send_letter: function () {
    var that = this;
    console.log(that.data.letter)
    wx.request({
      url: app.globalData.baseurl + '/letter',
      method: 'POST',
      data: that.data.letter,
      dataType: 'string',
      responseType: 'text',
      success: function (res) {
        console.log(res.data);
        that.setData({
          letter: '',
        });
      },
    })
  },

  thanks: function () {
    this.setData({
      choose: 'close'
    })
  },
})