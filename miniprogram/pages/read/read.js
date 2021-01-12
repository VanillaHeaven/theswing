const app = getApp()
// miniprogram/pages/read/read.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pdf: 'linuxread.pdf'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  open: function () {
    wx.downloadFile({
      url: app.globalData.baseurl + '/pdf/' + this.data.pdf,
      success: function (res) {
        const filePath = res.tempFilePath;
        wx.openDocument({
          filePath: filePath
        })
      }
    })
  },

})