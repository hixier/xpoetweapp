// pages/bluetooth/bluetooth.js

const app = getApp()

var serviceUUID = [] //主 service 的 uuid 列表
var writeUUID = ""; //写读 UUID
var notifyUUID = ""; //notify UUID
var filterServiceUUID = ""; //过滤获取到的服务uuid(有些会返回多条数据)
var filterDeviceName = ""; //设备名称

var macAddress = ""; //保存得到mac地址
var flagFromTypes = ''; //来源类型
var _discoveryStarted = false;
var deviceId = ''; //用于区分设备的 id

var _deviceId = '';
var _serviceId = '';
var _characteristicId = '';
var status = false; //当前状态
var action_type = ''; //操作类型
var code = -1;
var isnotExist = true;

const util = require('../../utils/util.js')

var delayTimer; //用来控制是否持续服务发现
var isFound = false;



Page({

  /**
   * 页面的初始数据
   */
  data: {
    editorHeight: 300,
    deviceInfo: '',
    action: {},
    sendValue: null,
    ssid: '',
    pass: '',
    logs: [],
    deviceArray: [],
    currDeviceID: '请选择...'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.startWifi({
      success(res) {
        console.log(res.errMsg)
        wx.getConnectedWifi({
          success: function (res) {
            console.log(res);
            that.setData({
              ssid: res.wifi.SSID
            })
          },
          fail: function (res) {
            if (res.errCode == 12006) {
              wx.showModal({
                title: '请打开GPS定位',
                content: 'Android手机不打开GPS定位，无法搜索到蓝牙设备.',
                showCancel: false
              })
            }
            console.log(res);
          }
        })
      }
    })
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
   * 搜索蓝牙设备
   */
  searchBleEvent: function (ret) {
    console.log("开始搜索蓝牙设备");
    var ssid = this.data.ssid;
    var pass = this.data.pass;
    console.log(ssid, pass);
    // if (util.isEmpty(ssid) || util.isEmpty(pass)) {
    //   util.toastError('请输入WiFi名称及密码');
    //   return;
    // }
    this.initBLE();
  },

  /**
   * 蓝牙初始化
   */
  initBLE: function () {
    this.printLog("启动蓝牙适配器, 蓝牙初始化")
    var that = this;
    wx.openBluetoothAdapter({
      success: function (res) {
        console.log(res);
        that.findBLE();
      },
      fail: function (res) {
        util.toastError('请先打开蓝牙');
        console.log(res)
      }
    })
  },

  /**
   * 定义搜索设备任务
   */
  findBLE: function () {
    this.printLog("打开蓝牙成功.")
    var that = this
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: false,
      interval: 0,
      success: function (res) {
        wx.showLoading({
          title: '正在搜索设备',
        })
        console.log(res);
        delayTimer = setInterval(function () {
          that.discoveryBLE() //3.0 //这里的discovery需要多次调用
        }, 1000);
        setTimeout(function () {
          if (isFound) {
            return;
          } else {
            wx.hideLoading();
            console.log("搜索设备超时");
            wx.stopBluetoothDevicesDiscovery({
              success: function (res) {
                console.log('连接蓝牙成功之后关闭蓝牙搜索');
              }
            })
            clearInterval(delayTimer)
            wx.showModal({
              title: '搜索设备超时',
              content: '请检查蓝牙设备是否正常工作，Android手机请打开GPS定位.',
              showCancel: false
            })
            util.toastError("搜索设备超时，请打开GPS定位，再搜索")
            return
          }
        }, 15000);
      },
      fail: function (res) {
        that.printLog("蓝牙设备服务发现失败: " + res.errMsg);
      }
    })
  },

  /**
   * 搜索设备回调
   */
  discoveryBLE: function () {
    var that = this
    wx.getBluetoothDevices({
      success: function (res) {
        var list = res.devices;
        console.log(list);
        if (list.length <= 0) {
          return;
        }
        var devices = [];
        for (var i = 0; i < list.length; i++) {
          //that.data.inputValue：表示的是需要连接的蓝牙设备ID，
          //简单点来说就是我想要连接这个蓝牙设备，
          //所以我去遍历我搜索到的蓝牙设备中是否有这个ID
          var name = list[i].name || list[i].localName;
          if (util.isEmpty(name)) {
            continue;
          }
          if (name.indexOf('JL') >= 0 && list[i].RSSI != 0) {
            console.log(list[i]);
            devices.push(list[i]);
          }
        }
        console.log('总共有' + devices.length + "个设备需要设置")
        if (devices.length <= 0) {
          return;
        }
        that.connectBLE(devices);
      },
      fail: function () {
        util.toastError('搜索蓝牙设备失败');
      }
    })
  },

  /**
   * 设置可以连接的设备
   */
  connectBLE: function (devices) {
    this.printLog('总共有' + devices.length + "个设备需要设置")
    var that = this;
    wx.hideLoading();
    isFound = true;
    clearInterval(delayTimer);
    wx.stopBluetoothDevicesDiscovery({
      success: function (res) {
        that.printLog('连接蓝牙成功之后关闭蓝牙搜索');
      }
    })
    //两个的时候需要选择
    var list = [];
    for (var i = 0; i < devices.length; i++) {
      var name = devices[i].name || devices[i].localName;
      list.push(name + "[" + devices[i].deviceId + "]")
    }
    this.setData({
      deviceArray: list
    })
    //默认选择
    this.setData({
      currDeviceID: list[0]
    })
  },

  /**
   * 选择设备，点击对应的按钮，创建ble连接
   */
  createBLE: function (deviceId) {
    this.printLog("连接: [" + deviceId + "]");
    var that = this;
    this.closeBLE(deviceId, function (res) {
      console.log("预先关闭，再打开");
      setTimeout(function () {
        wx.createBLEConnection({
          deviceId: deviceId,
          success: function (res) {
            that.printLog("设备连接成功");
            that.getBLEServiceId(deviceId);
          },
          fail: function (res) {
            that.printLog("设备连接失败" + res.errMsg);
          }
        })
      }, 2000)
    });
  },

  /**
   * 获取蓝牙设备提供的uuid
   */
  //获取服务UUID
  getBLEServiceId: function (deviceId) {
    this.printLog("获取设备[" + deviceId + "]服务列表")
    var that = this;
    wx.getBLEDeviceServices({
      deviceId: deviceId,
      success: function (res) {
        console.log(res);
        var services = res.services;
        if (services.length <= 0) {
          that.printLog("未找到主服务列表")
          return;
        }
        that.printLog('找到设备服务列表个数: ' + services.length);
        if (services.length == 1) {
          var service = services[0];
          that.printLog("服务UUID:[" + service.uuid + "] Primary:" + service.isPrimary);
          that.getBLECharactedId(deviceId, service.uuid);
        } else { //多个主服务
          //TODO
        }
      },
      fail: function (res) {
        that.printLog("获取设备服务列表失败" + res.errMsg);
      }
    })
  },

  /**
   * 获取服务特征值
   */
  getBLECharactedId: function (deviceId, serviceId) {
    this.printLog("获取设备特征值")
    var that = this;
    wx.getBLEDeviceCharacteristics({
      deviceId: deviceId,
      serviceId: serviceId,
      success: function (res) {
        console.log(res);
        //这里会获取到两个特征值，一个用来写，一个用来读
        var chars = res.characteristics;
        if (chars.length <= 0) {
          that.printLog("未找到设备特征值")
          return;
        }
        that.printLog("找到设备特征值个数:" + chars.length);
        if (chars.length == 2) {
          for (var i = 0; i < chars.length; i++) {
            var char = chars[i];
            that.printLog("特征值[" + char.uuid + "]")
            var prop = char.properties;
            if (prop.notify == true) {
              that.printLog("该特征值属性: Notify");
              that.recvBLECharacterNotice(deviceId, serviceId, char.uuid);
            } else if (prop.write == true) {
              that.printLog("该特征值属性: Write");
              that.sendBLECharacterNotice(deviceId, serviceId, char.uuid);
            } else {
              that.printLog("该特征值属性: 其他");
            }
          }
        } else {
          //TODO
        }
      },
      fail: function (res) {
        that.printLog("获取设备特征值失败")
      }
    })
  },

  /**
   * 接收数据
   */
  recvBLECharacterNotice: function (deviceId, serviceId, charId) {
    //接收设置是否成功
    this.printLog("注册Notice 回调函数");
    var that = this;
    wx.notifyBLECharacteristicValueChange({
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: charId,
      state: true, //启用Notify功能
      success: function (res) {
        wx.onBLECharacteristicValueChange(function (res) {
          console.log(res);
          that.printLog("收到Notify数据: " + that.ab2hex(res.value));
          //关闭蓝牙
          wx.showModal({
            title: '配网成功',
            content: that.ab2hex(res.value),
            showCancel: false
          })
        });
      },
      fail: function (res) {
        console.log(res);
        that.printLog("特征值Notice 接收数据失败: " + res.errMsg);
      }
    })
  },

  /**
   * 发送函数
   */
  sendBLECharacterNotice: function (deviceId, serviceId, charId) {
    //发送ssid/pass
    this.printLog("延时1秒后，发送SSID/PASS");
    var that = this;
    var cell = {
      "ssid": this.data.ssid,
      "pass": this.data.pass
    }
    var buffer = this.string2buffer(JSON.stringify(cell));
    setTimeout(function () {
      wx.writeBLECharacteristicValue({
        deviceId: deviceId,
        serviceId: serviceId,
        characteristicId: charId,
        value: buffer,
        success: function (res) {
          that.printLog("发送SSID/PASS 成功");
        },
        fail: function (res) {
          console.log(res);
          that.printLog("发送失败." + res.errMsg);
        },
        complete: function () {

        }
      })

    }, 1000);
  },

  printLog: function (msg) {
    var logs = this.data.logs;
    logs.push(msg);
    this.setData({ logs: logs })
  },
  /**
   * 将字符串转换成ArrayBufer
   */
  string2buffer(str) {
    if (!str) return;
    var val = "";
    for (var i = 0; i < str.length; i++) {
      val += str.charCodeAt(i).toString(16);
    }
    console.log(val);
    str = val;
    val = "";
    let length = str.length;
    let index = 0;
    let array = []
    while (index < length) {
      array.push(str.substring(index, index + 2));
      index = index + 2;
    }
    val = array.join(",");
    // 将16进制转化为ArrayBuffer
    return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    })).buffer
  },
  /**
   * 将ArrayBuffer转换成字符串
   */
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },
  inputSSID: function (res) {
    var ssid = res.detail.value;
    this.setData({
      ssid: ssid
    })
  },
  inputPASS: function (res) {
    var pass = res.detail.value;
    this.setData({
      pass: pass
    })
  },



  /**
   * 手机端可以同时连接多个蓝牙设备，但是同一个蓝牙设备不能被多次连接，所以需要在每次连接前关闭BLE连接
   */
  closeBLE: function (deviceId, callback) {
    var that = this;
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        that.printLog("断开设备[" + deviceId + "]成功.");
        console.log(res)
      },
      fail: function (res) {
        that.printLog("断开设备成功.");
      },
      complete: callback
    })
  },

  /**
   * editor
   */
  onEditorReady() {
    const that = this
    wx.createSelectorQuery().select('#editor').context(function (res) {
      that.editorCtx = res.context
    }).exec()
  },
  onStatusChange(e) {
    const formats = e.detail
    this.setData({ formats })
  },

  onChangeSendField(event) {
    // event.detail 为当前输入的值
    const that = this
    console.log(event.detail);
    that.sendValue = event.detail;
  },

  /**
   * 蓝牙搜索按钮
   */
  SearchButton_onClick: function () {
    console.log("11")
    this.searchBleEvent();
  }


})

// /**
//    * 
//    */
// function initBle(fromMac, flagTypes, currentSerial) {
//   //断开连接【每次初始化先断开连接】
//   closeBLEConnection();

//   // macAddress = clearSymbol(fromMac);
//   macAddress = fromMac; //保存mac
//   flagFromTypes = flagTypes //类型来源
//   currentSerialVal = currentSerial //当前操作序号


//   wx.openBluetoothAdapter({
//     success: (res) => {
//       console.log('openBluetoothAdapter 初始化蓝牙模块是否成功:', res)

//       // 监听寻找新设备事件
//       onBluetoothDeviceFound();

//       //开始搜寻附近的蓝牙外围设备
//       startBluetoothDevicesDiscovery();
//     },
//     fail: (res) => {
//       console.log('初始化蓝牙失败', res);
//       //自行处理【可弹窗提示用户开启蓝牙】，这通过回调处理
//       asddErrorCallback(res.errCode, "");

//       //监听蓝牙适配器状态变化事件【根据需求是否执行】
//       // wx.onBluetoothAdapterStateChange(function (res) {
//       //     console.log('蓝牙适配器状态更改结果:  ', res)
//       //     if (res.available) {
//       //         console.log('蓝牙可用，搜索设备:--》 ')
//       //         onBluetoothDeviceFound();
//       //         startBluetoothDevicesDiscovery();
//       //     }
//       // })
//     }
//   })
// }

// /**
//  * 监听寻找新设备事件
//  * 搜索匹配设备后，自动连接设备
//  */
// function onBluetoothDeviceFound() {
//   wx.onBluetoothDeviceFound((res) => {
//     console.log('广播数据结果:', res);

//     res.devices.forEach(device => {
//       if (!device.name && !device.localName) {
//         return
//       }

//       // 转换后, 得出相关数据
//       var hexStr = ab2hex(device.advertisData);
//       console.log("广播数据中转换后：advertisData---->" + hexStr);

//       //通过获取mac匹配
//       if ((macAddress != "") && (macAddress == device.deviceId) && isnotExist) {
//         isnotExist = false;
//         deviceId = device.deviceId;
//         console.log('android-->tempDeviceId:' + deviceId);

//         //停止搜寻附近的蓝牙外围设备
//         stopBluetoothDevicesDiscovery();

//         //连接设备
//         createBLEConnection();
//       }


//       //通过name匹配设备
//       let deviceName = device.name.toUpperCase();
//       if ((deviceName.indexOf(filterDeviceName) != -1) && isnotExist) {
//         isnotExist = false;
//         deviceId = device.deviceId;
//         console.log('ios or android-->tempDeviceId:' + deviceId);

//         //停止搜寻附近的蓝牙外围设备。
//         stopBluetoothDevicesDiscovery();

//         //连接设备
//         createBLEConnection();
//       }
//     })
//   })
// }