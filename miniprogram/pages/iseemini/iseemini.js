// pages/iseemini/iseemini.js
const DB = wx.cloud.database();
const io = require('../../utils/weapp.socket.io.js');
var recorder = wx.getRecorderManager();
const app = getApp();
const innerAudioContext = wx.createInnerAudioContext();




Page({

  /**
   * 页面的初始数据
   */
  data: {
    socket: null,
    roomid: '123456',
    videourl: '',
    videoContext: null,
    currentTime: 0,
    checkTime: -5,
    mes: null,
    inputValue: "",
    signalFrom: -1,
    dialogue: [{ user: '系统通知', text: '请确定双方入座后，点击"选片"选择影片。您可以使用上方文本框进行对话和发送弹幕。暂时离开小程序，返回后可点击"重连"，确保处于通讯状态。全屏状态下，双击屏幕可唤出/隐藏语音按钮。观影结束时请点击关闭按钮。', color: '#ffffff', time: -1.1, thumbnail: app.globalData.baseurl + '/images/system.png', left: 'open', right: 'close', pos: '' ,type:1 }],
    toButtom: 0,
    color: '#ffffff',
    token: '',
    movielist: [{ movie: '加载中...', other: '' }],
    choose: 'close',
    choosedone: '',
    intervalID: null,
    randomKey: 0,
    closeFlag: 'close',
    absflag: 'show',
    absflag2: 'close',
    ep: [],
    episode: '',
    imageurl: app.globalData.baseurl + '/images/',
    alldisable: false,
    voicePanelShow: 'close',
    isFullScreen: false,
    voice_ing_start_date: null,
    soundUrl: '',
    voicePanelThumbnailUrl: '/static/images/touxiang.png',
    voicePanelAutoControlBtn: '/static/images/open.png',
    voiceAutoPlay: true,
    videovolume: false,
    touchS: [0, 0],
    touchE: [0, 0],
    recorderFlag: true,
    inputInFullSc: false,
    focus: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (this.socket != undefined) {
      this.socket.disconnect(true);
      delete this.socket;
    }
    this.data.roomid = options.roomid;
    this.data.token = options.token;
    console.log(this.data.videourl);
    this.videoContext = wx.createVideoContext('ourvideo');
    var code = app.globalData.code;
    this.connectSoc(code);
    this.audioInit();
    var that = this;
    clearInterval(this.data.intervalID);
    this.data.intervalID = setInterval(function () {
      var rk = Math.floor(Math.random() * 100);
      that.socket.emit('check2server', { roomid: that.data.roomid, token: wx.getStorageSync('token'), randomKey: rk });
      setTimeout(function () {
        console.log(that.data.randomKey + ' and ' + rk);
        if (that.data.randomKey != rk) {
          console.log('disconnect');
          // that.socket.emit('mes', { roomid: that.data.roomid, text: '已掉线', time: parseInt(that.data.currentTime), color: that.data.color, token: wx.getStorageSync('token')});
          var tmp = that.data.dialogue;
          // that.socket.open();
          tmp.push({ thumbnail: app.globalData.baseurl + '/images/system.png', left: 'open', right: 'close', user: '系统通知', text: '您已掉线，请点击重连按钮重新连接。', color: '#ffffff', time: parseInt(that.data.currentTime + 2), type:1 });
          that.setData({
            dialogue: tmp,
          });
          that.setData({
            toButtom: that.data.dialogue.length + 1000,
          });
        }
      }, 5000);

    }, 60000); //开始任务
    //clearInterval(intervalID);//停止任务 


    
  },

  /**
   * 按钮控制播放视频
   */
  playVideo: function () {
    this.videoContext.play();
  },

  playEvent: function () {
    if (this.data.signalFrom != 0) {
      this.socket.emit('play', { roomid: this.data.roomid, currentTime: this.data.currentTime, token: wx.getStorageSync('token'), videourl: this.data.videourl });
    }
    this.data.signalFrom = -1;
    console.log('hh' + this.data.currentTime);
  },

  /**
   * 按钮控制暂停视频
   */
  playPause: function () {
    this.videoContext.pause();
  },

  pauseEvent: function () {
    if (this.data.signalFrom != 0) {
      this.socket.emit('pause', { roomid: this.data.roomid, currentTime: this.data.currentTime, token: wx.getStorageSync('token'), videourl: this.data.videourl });
    }
    this.data.signalFrom = -1;
  },

  syn: function () {
    this.socket.emit('syn', { roomid: this.data.roomid, currentTime: this.data.currentTime, token: wx.getStorageSync('token'), videourl: this.data.videourl  });
  },

  synTime: function (currentTime) {
    var diff = this.data.currentTime - currentTime;
    if (diff < 0) {
      if (diff < -5) {
        this.videoContext.seek(currentTime);
      }
    }
    else {
      if (diff > 5) {
        this.videoContext.seek(currentTime);
      }
    }
  },

  videoDetail: function (e) {
    //console.log(e);
    this.data.currentTime = e.detail.currentTime;
    if (e.detail.currentTime - this.data.checkTime > 6 || e.detail.currentTime - this.data.checkTime < -6) {
      this.syn();
    }
    this.data.checkTime = this.data.currentTime - 5;
  },

  reconnect: function () {
    this.socket.disconnect(true);
    delete this.socket;
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        this.connectSoc(res.code);
      }
    })
  },

  audioInit: function() {
    var that = this;
    innerAudioContext.onError((err) => {
      console.log('voice play error');
      console.log(err);
      that.setData({
        videovolume: false
      });
    });

    innerAudioContext.onPlay(() => {
      console.log('voice play error');
      that.setData({
        videovolume: true
      });
    });

    innerAudioContext.onStop(() => {
      console.log('voice play error');
      that.setData({
        videovolume: false
      });
    });

    innerAudioContext.onEnded(() => {
      console.log('voice play error');
      that.setData({
        videovolume: false
      });
    });
  },

  connectSoc: function (code) {
    this.socket = io(app.globalData.wsurl) // +':8080')

    this.socket.on('connected', d => {
      console.log('connection created.');
      wx.setStorageSync('token', d.token);
    });

    this.socket.on('mes', d => {
      d.type = 1;
      this.getMes(d, parseInt(this.data.currentTime + 1));
    });

    this.socket.on('play', d => {
      
      if (this.data.videourl != d.videourl) {
        console.log('play adjust schedual.');
        this.setData({
          videourl: d.videourl
        });
        setTimeout(() => {
          console.log('play: ')
        }, 1000);
      }
      this.data.signalFrom = 0;
      this.synTime(d.currentTime);
      this.videoContext.play();
    });

    this.socket.on('pause', d => {
      if (this.data.videourl != d.videourl) {
        console.log('pause adjust schedual.');
        this.setData({
          videourl: d.videourl
        });
        setTimeout(() => {
          console.log('pause: ');
           }, 1000);
      }
      this.data.signalFrom = 0;
      this.videoContext.pause();
      this.synTime(d.currentTime);
    });

    this.socket.on('syn', d => {
      if (this.data.videourl != d.videourl) {
        console.log('adjust schedual.');
        this.setData({
          videourl: d.videourl
        });
        setTimeout(() => {
          console.log('syn: ');
        }, 1000);
      }
      this.data.signalFrom = 0;
      this.synTime(d.currentTime);
    });

    this.socket.on('realSyn', d => {

      this.socket.emit('realSyn', {
        roomid: this.data.roomid, currentTime: parseInt(this.data.currentTime), videourl: this.data.videourl, token: wx.getStorageSync('token') 
       })
    });

    this.socket.on('choosemovie', d => {
      console.log(d);
      this.setData({
        choose: 'show'
      });
      this.setData({
        movielist: d
      });
    });

    this.socket.on('selectone', d => {
      console.log(d.episode);
      this.setData({
        choosedone: d.data,
      });
      this.setData({
        episode: d.episode,
      });

      var tmp = [];
      for (var i = 1; i <= d.data.episodes; i++) {
        tmp.push(i);
      }
      this.setData({
        ep: tmp
      });
    });

    this.socket.on('voice', d => {
      var that = this;
      this.setData({
        voicePanelThumbnailUrl: d.thumbnail
      });
      var that = this;
      var oldduration = innerAudioContext.duration;
      console.log('olddura:' + oldduration);
      innerAudioContext.src = d.fileID;
      innerAudioContext.seek(0);
      if(d.user != wx.getStorageSync('token')){
        var checkGetVoice = setInterval(function(){
          if (oldduration != innerAudioContext.duration) {
            if (that.data.voiceAutoPlay) {
              innerAudioContext.volume = 1; 
              innerAudioContext.play();
            }

            if (that.data.isFullScreen) {
              that.setData({
                voicePanelShow: 'open'
              });
            }
            d.type = 2;
            d.text = d.user + '发来了语音。';
            that.getMes(d, parseInt(that.data.currentTime + 1) );
            clearInterval(checkGetVoice);
          }
        }, 1000);
      }
      else {
        d.type = 2;
        d.text = "";
        that.getMes(d);
      }
      
    });

    this.socket.on('disconnect', d => {
      console.log('disconnect');
    });

    this.socket.on('chooseone', d => {
      this.setData({
        videourl: app.globalData.baseurl + '/video/' + d.code + d.episode + '.' + d.format,
      });
      this.showBusy(8000);
      this.setData({
        choose: 'close',
      });
    });

    this.socket.on('check2server', d => {
      console.log('check2server:' + d);
      this.setData({
        randomKey: d.randomKey,
      });
      console.log('still connect');
    });

    this.socket.on('closeall', d => {
      clearInterval(this.data.intervalID);

      setTimeout(() => {
        this.setData({
          alldisable: true
        });
      }, 300);

      // this.setData({
      //   closeFlag: 'show'
      // });

      setTimeout(()=> {
        wx.redirectTo({
          url: '/pages/index/index',
        })
      }, 2000);



      
    });

    this.socket.emit('init', { code: code, roomid: this.data.roomid, token: this.data.token, thumbnail: app.globalData.userInfo.avatarUrl });
  },

  inputMes: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  sendmes: function () {
    if (this.data.inputValue != "") {
      this.socket.emit('mes', { roomid: this.data.roomid, text: this.data.inputValue, time: parseInt(this.data.currentTime), color: this.data.color, token: wx.getStorageSync('token') });

      var tmp = this.data.dialogue;
      this.setData({
        toButtom: this.data.dialogue.length + 100,
      });
    };
    setTimeout(() => {
      this.setData({
        inputValue: ''
      })
    }, 300);
  },

  getMes: function (d, time = -1.1) {
    var tmp = this.data.dialogue;
    var position = '';
    var left = 'open';
    var right = 'close';
    if (d.user == wx.getStorageSync('token')) {
      position = 'Right';
      var left = 'close';
      var right = 'open';
    }
    var data = { user: d.user, text: d.text, color: d.color, time: time, left: left, right: right, thumbnail: d.thumbnail, pos: position, type: d.type , fileID: ''}
    if(d.type == 2) { data.fileID = d.fileID; }
    tmp.push(data);
    this.setData({
      dialogue: tmp,
    });
    //console.log('mes: ', this.data.dialogue);
    this.setData({
      toButtom: this.data.dialogue.length * 100,
    });
  },

  choosemovie: function () {
    this.videoContext.pause();
    this.socket.emit('choosemovie', {
      roomid: this.data.roomid, token: wx.getStorageSync('token')
    });
  },

  choose: function (e) {
    this.setData({
      absflag: 'close',
      absflag2: 'show',
      episode: '',
    });
    var that = this;
    this.socket.emit('selectone', { roomid: this.data.roomid, data: this.data.movielist[e.currentTarget.dataset.index], token: wx.getStorageSync('token'), episode: '' ,type: 1});
    this.setData({
      choosedone: that.data.movielist[e.currentTarget.dataset.index],
    });
  },

  chooseEpisode: function (e) {
    this.setData({
      episode: "ep" + (e.currentTarget.dataset.index + 1).toString(),
    });
    this.socket.emit('selectone', { roomid: this.data.roomid, data: this.data.choosedone, token: wx.getStorageSync('token'), episode: "ep" + (e.currentTarget.dataset.index + 1).toString() ,type:2});
  },

  confirmone: function () {
    if (this.data.choosedone == '' || this.data.episode == '') {
      if (this.data.choosedone == '' || absflag == 'show') {
        wx.showToast({
          title: '请选择电影',
          icon: 'none',
          duration: 2000
        })
      }
      else {
        wx.showToast({
          title: '请选择集数',
          icon: 'none',
          duration: 2000
        })
      }
      return;
    }
    console.log('choose:' + this.data.choosedone.movie);
    this.socket.emit('chooseone', { roomid: this.data.roomid, color: this.data.color, movie: this.data.choosedone.movie, code: this.data.choosedone.code, episode: this.data.episode, format: this.data.choosedone.format, token: wx.getStorageSync('token') });
    for (let ele in this.data.dialogue) {
      this.data.dialogue[ele].time = -0.1;
    }
    this.setData({
      choosedone: '',
      absflag2: 'close',
      absflag: 'show',
      episode: '',
    });
  },

  cancel: function () {
    this.setData({
      choose: 'close',
      choosedone: '',
      absflag2: 'close',
      absflag: 'show',
      episode: '',
    });
  },

  backtolist: function () {
    this.setData({
      absflag2: 'close',
      absflag: 'show'
    });
  },

  showBusy: function (duration) {
    var that = this
    wx.showToast({
      title: '加载中...',
      mask: true,
      icon: 'loading',
      duration: duration,
    })
  },

  /// 按钮触摸开始触发的事件
  touchStart: function (e) {
    this.touchStartTime = e.timeStamp;
  },

  /// 按钮触摸结束触发的事件
  touchEnd: function (e) {
    this.touchEndTime = e.timeStamp;
  },

  fullscreenevent: function () {
    if(this.data.isFullScreen) {

      this.setData({
        voicePanelShow: 'close'
      });

      this.setData({
        isFullScreen: false
      });
    }
    else{
      this.setData({
        isFullScreen: true
      });
    }
    
  },

  doubleTap: function (e) {
    var that = this
    // 控制点击事件在350ms内触发，加这层判断是为了防止长按时会触发点击事件
    if (that.touchEndTime - that.touchStartTime < 350) {
      // 当前点击的时间
      var currentTime = e.timeStamp
      var lastTapTime = that.lastTapTime
      // 更新最后一次点击时间
      that.lastTapTime = currentTime

      // 如果两次点击时间在300毫秒内，则认为是双击事件
      if (currentTime - lastTapTime < 300) {

        if (this.data.isFullScreen) {
          if (this.data.voicePanelShow == 'close') {
            this.setData({
              voicePanelShow: 'show'
            });
          } else {
            this.setData({
              voicePanelShow: 'close'
            });
          }
          this.setData({
            focus: false,
            inputInFullSc: false,
          });
        }


      }
    }
  },

  my_audio_click: function (e) {
    if (e.currentTarget.dataset.type == 2) {
      console.log('play voice');
      var src = e.currentTarget.dataset.url;
      innerAudioContext.src = src;
      innerAudioContext.seek(0);

      innerAudioContext.play();
    }
  },

  voice_ing_start: function (e) {
    console.log('手指点击录音');
    let sx = e.touches[0].pageX;
    let sy = e.touches[0].pageY;
    this.data.touchS = [sx, sy];
    this.data.touchE = [sx, sy];
    this.setData({
      voice_ing_start_date: new Date().getTime(), //记录开始点击的时间
    })
    const options = {
      duration: 20000, //指定录音的时长，单位 ms
      sampleRate: 8000, //采样率
      numberOfChannels: 1, //录音通道数
      encodeBitRate: 24000, //编码码率
      format: 'mp3', //音频格式，有效值 aac/mp3
      audioSource: 'auto',
      frameSize: 12, //指定帧大小，单位 KB
    }
    recorder.start(options) //开始录音

    wx.showToast({
      icon: 'none',
      title: '下滑取消',
    })
  },

  touchMove: function (e) {
    let sx = e.touches[0].pageX;
    let sy = e.touches[0].pageY;
    this.data.touchE = [sx, sy]
  },

  on_recorder: function () {
    var that = this;
    console.log('录音监听事件');
    recorder.onStart((res) => {
      console.log('开始录音');
    })
    recorder.onStop((res) => {
      let {
        tempFilePath
      } = res;
      console.log('停止录音,临时路径', tempFilePath);
      var x = new Date().getTime() - this.data.voice_ing_start_date;
      if (x > 1000 && this.data.recorderFlag) {
        let timestamp = new Date().getTime();
        // wx.uploadFile({
        //   url: app.globalData.baseurl + '/upload/', //仅为示例，非真实的接口地址
        //   filePath: tempFilePath,
        //   name: 'file',
        //   formData: {
        //     filename: timestamp + '.mp3'
        //   },
        wx.cloud.uploadFile({
          cloudPath: "sounds/" + timestamp + '.mp3',
          filePath: tempFilePath,
          success: res => {
            // var d = {
            //   type: 2,
            //   text: tempFilePath,
            //   user: wx.getStorageSync('token'),
            //   color: '#ffffff',
            //   time: -1.1,
            //   thumbnail: app.globalData.userInfo.avatarUrl
            // }
            // that.getMes(d);
            // innerAudioContext.src = tempFilePath;
            that.setData({
              voicePanelThumbnailUrl: app.globalData.userInfo.avatarUrl
            });
            that.socket.emit('voice', {
              roomid: that.data.roomid, time: parseInt(that.data.currentTime), color: that.data.color, token: wx.getStorageSync('token'), fileID: res.fileID
            });
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          }
        })
            
      }
      this.data.recorderFlag = true;
    })
    // recorder.onFrameRecorded((res) => {
    //   return
    //   console.log('onFrameRecorded  res.frameBuffer', res.frameBuffer);
    //   string_base64 = wx.arrayBufferToBase64(res.frameBuffer)

    //   console.log('string_base64--', string_base64)
    // })
  },
  // 手指松开录音
  voice_ing_end: function (e) {
    console.log('手指松开录音')

    var x = new Date().getTime() - this.data.voice_ing_start_date;
    let start = this.data.touchS;
    let end = this.data.touchE;
    console.log('start:' + start);
    console.log('end:' + end);
    if (start[1] < end[1] - 50) {
      console.log('下滑');
      this.data.recorderFlag = false;
      recorder.stop();
      wx.showToast({
        icon: 'none',
        title: '已取消',
      })
      return;
    }
    // else if (start[0] > end[0] + 50) {
    //   console.log('左滑')
    // } else {
    //   console.log('静止')
    // }
    if (x < 1000) {
      console.log('录音停止，说话小于1秒！')
      wx.showToast({
        icon: 'none',
        title: '说话要大于1秒！',
      })
      this.data.recorderFlag = false;
      recorder.stop();
    } else {
      // 录音停止，开始上传
      recorder.stop();
    }
  },

  autoPlayVoice: function() {
    if (this.data.voiceAutoPlay) {
      this.setData({
        voicePanelAutoControlBtn: '/static/images/close.png',
        voiceAutoPlay: false
      });
    }
    else {
      this.setData({
        voicePanelAutoControlBtn: '/static/images/open.png',
        voiceAutoPlay: true
      });
    }
  },

  playPanelVoice: function (src) {
    console.log('play voice');
    innerAudioContext.seek(0);
    innerAudioContext.play();
  },

  inputWhenFull2: function(){
    this.setData({
      focus: true,
    });
  },

  inputWhenFull: function() {
    this.setData({
      inputInFullSc: !this.data.inputInFullSc,
      focus: !this.data.focus,
    });
  },

  closeConn: function () {
    setTimeout(() => {
      this.setData({
        alldisable: true
      });
    }, 300);
    this.socket.emit('closeall', { roomid: this.data.roomid, token: wx.getStorageSync('token') });
  },

  closeTheater: function () {
    wx.redirectTo({
      url: '/pages/index/index',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.on_recorder();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
})