// pages/option/option.js
import Toast from '../../dist/toast/toast';
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    damp_value_init : 10,
    damp_value : 0,
    stand_checked:true,
    stand_value_init:1,
    stand_value:1,
    sound_value_init:4,
    sound_value : 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    that.setData({
      damp_value : that.data.damp_value_init,
      stand_value: that.data.stand_value_init,
      sound_value: that.data.sound_value_init,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
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

  /** 
   * 屈膝抵抗复位按钮点击事件
   */
  dampButton_onClick(){
    let that = this;
    that.setData({damp_value : that.data.damp_value_init});
  },

  /**
   * 屈膝抵抗步进器点击事件
   */
  dampStepper_onChange(event){
    let that = this;
     
    that.setData({ damp_value : event.detail });
  },

  /**
   * 点击屈膝抵抗slider
   */
  dampSlider_onChange(event) {
    let that = this;
    wx.showToast({
      icon: 'none',
      title: `当前值：${event.detail}`,
    });
    that.setData({damp_value:event.detail});
  },

  /**
   * 立体功能按钮事件
   */
  standButton_onClick(){
    let that = this;
    that.setData({stand_checked:that.data.stand_checked})
  },

  /**
   * 立体功能开关点击事件
   */

  standSwitch_onChecked({detail}){
    wx.showModal({
      title: '提示',
      content: '是否切换开关？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ 
            stand_checked: detail ,
            stand_value : (detail==true?1:0)
          });
        }
      },
    });
  },

  /**
   * 立体功能滑块
   */
  standSlider_onChange(event){
    let that = this;
    
    that.setData({
      stand_value : event.detail,
      stand_checked: (event.detail==1?true:false)
    })
  },

  /**
   * 静音按钮
   */
  soundButton_onClick(){
    let that = this;
    that.setData({sound_value:0});
  },

  /**
   * 静音步进器
   */
  soundStepper_onChange(event){
    let that = this;
     
    that.setData({ sound_value : event.detail });
  },

  /**
   * 静音滑块
   */
  soundSlider_onChange(event) {
    let that = this;
    wx.showToast({
      icon: 'none',
      title: `当前值：${event.detail}`,
    });
    that.setData({sound_value:event.detail});
  },



})