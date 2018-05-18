const cu = require('scripts/colorUtil')
const ruleUpdateUtil = require('scripts/ruleUpdateUtil')

const FILE = 'data.json'

const settingKeys = ['generalSettings', 'customSettings', 'hostSettings', 'urlrewriteSettings', 'hostnameSettings']

if (!$file.exists(FILE)) {
  $file.write({
    data: $data({
      "string": JSON.stringify({
        "urls": []
      })
    }),
    path: FILE
  })
}

setUpWorkspace()
setDefaultSettings()

let screenHeight = $device.info.screen.height
const screenWidth = $device.info.screen.width

const iPhoneX = screenWidth == 375 && screenHeight == 812
if (iPhoneX) {
  screenHeight -= 48
}

const selectedColor = $color("#c1dcf0")
const defaultColor = $color("#ffffff")
const tintColor = $color("#ff6666")
const blackColor = $color("#000000")

function renderUI() {
  let previewData = JSON.parse($file.read(FILE).string)
  let inputViewData = []
  for (let idx in settingKeys) {
    let content = previewData[settingKeys[idx]]
    inputViewData.push({
      type: "text",
      props: {
        text: content,
        bgcolor: $color("#f0f5f5"),
        font: $font(14)
      },
      events: {
        didEndEditing: sender => {
          let content = sender.text
          if (sender.text == '') {
            content = $file.read('defaultConf/' + settingKeys[idx]).string
            sender.text = content
          }
          write2file(settingKeys[idx], content)
        }
      }
    })
  }
  let genControlBnts = function (idx) {
    let titleTexts = ['常规', '代理规则', '本地DNS映射', 'URL重定向', '主机名']
    const sbgc = $color("#ffda40")
    const stc = $color("#034769")
    const dbgc = $color("#63add0")
    const dtc = $color("#ffffff")
    return titleTexts.map((item, i) => {
      return {
        title: {
          text: item,
          bgcolor: i === idx ? sbgc : dbgc,
          radius: 5,
          color: i == idx ? stc : dtc
        }
      }
    })
  }
  $ui.render({
    props: {
      title: "Shadowrocket规则生成"
    },
    views: [{
      // type: "scroll",
      props: {
        id: "mainView"
      },
      layout: $layout.fill,
      views: [{
        type: "input",
        props: {
          id: "fileName",
          text: '',
          placeholder: "配置名（lhie1)"
        },
        layout: (make, view) => {
          // make.width.equalTo(screenWidth / 2 - 15)
          make.height.equalTo(40)
          make.left.top.inset(5)
        },
        events: {
          returned: sender => {
            sender.blur()
            saveWorkspace()
          }
        }
      }, {
        type: "button",
        props: {
          title: '生成配置',
        },
        layout: (make, view) => {
          make.width.equalTo(screenWidth / 3)
          make.height.equalTo(40)
          make.left.equalTo(view.prev.right).offset(10)
          make.top.right.equalTo(5).inset(5)
        },
        events: {
          tapped: sender => {
            makeConf({
              onStart: () => {
                $ui.animate({
                  duration: 0.2,
                  animation: function () {
                    $("progressView").alpha = 1
                    $("progressView").hidden = false
                  }
                })
              },
              onProgress: p => {
                $("progressBar").value = p
              },
              onDone: res => {
                $ui.animate({
                  duration: 0.3,
                  animation: function () {
                    $("progressView").alpha = 0
                  },
                  completion: function () {
                    $("progressView").value = 0
                    $("progressView").hidden = true
                  }
                })
                exportConf(res.fileName, res.fileData, () => {
                  $console.info('Cancel')
                })
              },
              onError: res => {
                $console.error(res)
                $("progressView").value = 0
                $("progressView").hidden = true
              }
            })
          }
        },
      }, {
        type: "gallery",
        props: {
          id: "inputViews",
          items: inputViewData,
          interval: 0
        },
        layout: (make, view) => {
          make.top.equalTo(view.prev.bottom).offset(5)
          make.height.equalTo(view.super).dividedBy(2.5)
          make.width.equalTo(view.super)
        },
        events: {
          changed: sender => {
            let idx = sender.page
            $("settingsControl").data = genControlBnts(idx)
          }
        }
      }, {
        type: "matrix",
        props: {
          columns: 3,
          id: "settingsControl",
          itemHeight: 40,
          bgcolor: $color("#ffffff"),
          spacing: 3,
          data: genControlBnts(0),
          scrollEnabled: false,
          template: [{
            type: "label",
            props: {
              id: "title",
              align: $align.center,
              font: $font(14)
            },
            layout: $layout.fill
          }]
        },
        layout: (make, view) => {
          make.height.equalTo(90)
          make.centerX.equalTo(view.super)
          make.width.equalTo(view.super).offset(-15)
          make.top.equalTo(view.prev.bottom).offset(5)
        },
        events: {
          didSelect: (sender, indexPath, data) => {
            let idx = indexPath.row
            $("settingsControl").data = genControlBnts(idx)
            $("inputViews").page = idx
          }
        }
      }, {
        type: "matrix",
        props: {
          id: "usualSettings",
          columns: 2,
          // radius: 5,
          itemHeight: 40,
          // bgcolor: $color("#f0f5f5"),
          // borderWidth: 1,
          // borderColor: $color("#f0f5f5"),
          spacing: 5,
          selectable: true,
          scrollEnabled: false,
          data: [{
            title: {
              text: '去广告',
              bgcolor: defaultColor,
              textColor: blackColor
            }
          }, {
            title: {
              text: '开启MITM',
              bgcolor: defaultColor,
              textColor: blackColor
            }
          }],
          template: [{
            type: "label",
            props: {
              id: "title",
              align: $align.center,
              font: $font(16),
              radius: 5,
              borderColor: tintColor,
              borderWidth: 0.3,
            },
            layout: $layout.fill
          }]
        },
        layout: (make, view) => {
          make.width.equalTo(view.super).offset(-10)
          make.centerX.equalTo(view.super)
          make.height.equalTo(50)
          make.top.equalTo(view.prev.bottom).offset(0)
        },
        events: {
          didSelect: (sender, indexPath, data) => {
            data.title.bgcolor = cu.isEqual(data.title.bgcolor, tintColor) ? defaultColor : tintColor
            data.title.textColor = cu.isEqual(data.title.bgcolor, tintColor) ? defaultColor : blackColor
            let uiData = $("usualSettings").data
            uiData[indexPath.row] = data
            $("usualSettings").data = uiData
            saveWorkspace()
          }
        }
      }, {
        type: "button",
        props: {
          title: '还原默认设置',
          bgcolor: $color("#ff6840")
        },
        layout: (make, view) => {
          make.width.equalTo(view.super).offset(-40)
          make.centerX.equalTo(view.super)
          make.top.equalTo(view.prev.bottom).offset(5)
          make.height.equalTo(40)
        },
        events: {
          tapped: sender => {
            $ui.alert({
              title: "提示",
              message: "是否还原配置，还原后无法恢复",
              actions: [{
                title: 'Cancel',
                handler: () => {}
              }, {
                title: 'OK',
                handler: () => {
                  setDefaultSettings(true)
                  $addin.run($addin.current)
                }
              }]
            })
          }
        }
      }, {
        type: "label",
        props: {
          text: "上述设置点击完成生效，清空保存一次恢复默认",
          font: $font(12),
          textColor: $color("#595959"),
          align: $align.center
        },
        layout: (make, view) => {
          make.top.equalTo(view.prev.bottom).offset(0)
          make.width.equalTo(view.super)
          make.height.equalTo(30)
          make.centerX.equalTo(view.super)
        }
      }, {
        type: "label",
        props: {
          text: "使用Fndroid的Surge脚本修改而来，感谢Fndroid",
          font: $font(12),
          textColor: $color("#595959"),
          align: $align.center
        },
        layout: (make, view) => {
          make.top.equalTo(view.prev.bottom).offset(0)
          make.width.equalTo(view.super)
          make.height.equalTo(30)
          make.centerX.equalTo(view.super)
        }
      }]
    }, {
      type: "blur",
      props: {
        id: "progressView",
        style: 1,
        alpha: 0,
        hidden: true
      },
      layout: $layout.fill,
      views: [{
        type: "label",
        props: {
          text: "处理中，请稍后",
          textColor: $color("black"),
        },
        layout: (make, view) => {
          make.centerX.equalTo(view.super)
          make.centerY.equalTo(view.super).offset(-30)
        }
      }, {
        type: "progress",
        props: {
          id: "progressBar",
          value: 0
        },
        layout: (make, view) => {
          make.width.equalTo(screenWidth * 0.8)
          make.center.equalTo(view.super)
          make.height.equalTo(3)
        }
      }]
    }]
  })
}

function setUpWorkspace() {
  $app.listen({
      ready: function () {
          let file = JSON.parse($file.read(FILE).string)
          if (file && file.workspace) {
              let workspace = file.workspace
              console.log(file)
              $("fileName").text = workspace.fileName
              let usualSettingsData = workspace.usualData
              let nd = $("usualSettings").data.map(item => {
                  let sd = usualSettingsData.find(i => i.title.text == item.title.text)
                  if (sd) {
                      item.title.bgcolor = sd.title.bgcolor ? tintColor : defaultColor
                      item.title.textColor = sd.title.textColor ? defaultColor : blackColor
                  }
                  return item
              })
              $("usualSettings").data = nd
          }
      }
  })
}

function saveWorkspace() {
  let workspace = {
    fileName: $("fileName").text,
    usualData: $("usualSettings").data.map(i => {
      i.title.bgcolor = cu.isEqual(tintColor, i.title.bgcolor)
      i.title.textColor = cu.isEqual(defaultColor, i.title.textColor)
      return i
    })
  }
  let file = JSON.parse($file.read(FILE).string)
  file.workspace = workspace
  $file.write({
    data: $data({
      string: JSON.stringify(file)
    }),
    path: FILE
  })
}

function setDefaultSettings(clear) {
  let previewData = JSON.parse($file.read(FILE).string)
  for (let idx in settingKeys) {
    if (clear || !(settingKeys[idx] in previewData) || previewData[settingKeys[idx]] == "") {
      let defaultValue = $file.read(`defaultConf/${settingKeys[idx]}`).string
      previewData[settingKeys[idx]] = defaultValue
    }
  }
  $file.write({
    data: $data({
      "string": JSON.stringify(previewData)
    }),
    path: FILE
  })
}

function write2file(key, value) {
  let content = JSON.parse($file.read(FILE).string)
  content[key] = value
  $file.write({
    data: $data({
      "string": JSON.stringify(content)
    }),
    path: FILE
  })
}

function getPrototype(done) {
  return new Promise((resolve, reject) => {
    $http.get({
      url: "https://raw.githubusercontent.com/lhie1/Rules/master/Shadowrocket/Prototype.conf",
      handler: function (resp) {
        if (done) done()
        resolve(resp.data)
      }
    })
  })
}

function getAutoRules(url, done) {
  return new Promise((resolve, reject) => {
      $http.get({
          url: url,
          handler: function (resp) {
              if (done) done()
              resolve(resp.data)
          }
      })
  })
}

function makeConf(params) {
  'onStart' in params && params.onStart()
  try {
    let pu = {
      apple: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/Apple.conf',
      direct: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/DIRECT.conf',
      proxy: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/PROXY.conf',
      reject: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/REJECT.conf',
      host: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/HOST.conf',
      urlrewrite: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/URL%20Rewrite.conf',
      urlreject: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/URL%20REJECT.conf',
      hostname: 'https://raw.githubusercontent.com/lhie1/Rules/master/Auto/Hostname.conf',
    }
    let advanceSettings = JSON.parse($file.read(FILE).string)
    let workspace = advanceSettings.workspace
    let usualData = workspace.usualData

    let usualValue = function (key) {
      return usualData.find(i => i.title.text == key) ? usualData.find(i => i.title.text == key).title.bgcolor : false
    }

    let ads = usualValue('去广告')
    let isMitm = usualValue('开启MITM')

    let prototype = ''
    let rules = ''
    let host = ''
    let urlRewrite = ''
    let urlReject = ''
    let hostName = ''

    let pgs = 0

    let onPgs = function () {
      pgs += 0.1
      'onProgress' in params && params.onProgress(pgs)
    }

    let emptyPromise = function (done) {
      if (done) done()
      return Promise.resolve('')
    }

    let promiseArray = [
      getPrototype(onPgs), // 0
      getAutoRules(pu.apple, onPgs), // 1
      getAutoRules(pu.reject, onPgs), // 2
      getAutoRules(pu.proxy, onPgs), // 3
      getAutoRules(pu.direct, onPgs), // 4
      getAutoRules(pu.host, onPgs), // 5
      getAutoRules(pu.urlrewrite, onPgs), // 6
      getAutoRules(pu.urlreject, onPgs), // 7
      getAutoRules(pu.hostname, onPgs) // 8
    ]

    if (!ads) {
      promiseArray[2] = emptyPromise(onPgs)
      promiseArray[7] = emptyPromise(onPgs)
    }

    let replaceRule = function(content) {
      content = content.replace(/🍎 Only/g, 'DIRECT')
      content = content.replace(/🍃 Proxy/g, 'PROXY')
      content = content.replace(/🍂 Domestic/g, 'DIRECT')
      content = content.replace(/☁️ Others/g, 'DIRECT')
      return content;
    }    

    Promise.all(promiseArray).then(v => {
      v = v.map(i => replaceRule(i))
      console.log(v)
      prototype = v[0]
      rules += `\n${v[1]}\n${v[2]}\n${v[3]}\n${v[4]}\n`
      host = v[5]
      urlRewrite += v[6]
      urlReject += v[7]
      hostName = v[8].split('\n')

      let seperateLines = function (content) {
        return {
          add: content.split('\n').filter(i => !i.startsWith('-')).map(i => i.trim()),
          delete: content.split("\n").filter(i => i.startsWith('-')).map(i => i.replace('-', '').trim())
        }
      }

      let prettyInsert = function (lines) {
        return '\n\n' + lines.join('\n') + '\n\n'
      }

      // 配置常规设置
      if (advanceSettings.generalSettings) {
        prototype = prototype.replace(/\[General\][\s\S]+\[Rule\]/, advanceSettings.generalSettings + '\n\n[Rule]')
      }
      // 配置自定义规则
      let customRules = seperateLines(advanceSettings.customSettings)
      customRules.delete.forEach(i => rules = rules.replace(i, ''))
      // 配置本地DNS映射
      let userHost = seperateLines(advanceSettings.hostSettings)
      userHost.delete.forEach(i => host = host.replace(i, ''))
      // 配置URL重定向
      let userUrl = seperateLines(advanceSettings.urlrewriteSettings)
      userUrl.delete.forEach(i => {
        urlRewrite = urlRewrite.replace(i, '')
        urlReject = urlReject.replace(i, '')
      })

      // 配置MITM的Hostname
      let userHostname = seperateLines(advanceSettings.hostnameSettings)
      userHostname.delete.forEach(i => {
        if (hostName.indexOf(i) >= 0) {
          hostName.splice(hostName.indexOf(i), 1)
        }
      })

      prototype = prototype.replace('# Custom', prettyInsert(customRules.add))
      prototype = prototype.replace('# All Rules', rules)
      prototype = prototype.replace('# Host', host + prettyInsert(userHost.add))
      prototype = prototype.replace('# URL Rewrite', urlRewrite + prettyInsert(userUrl.add))
      prototype = prototype.replace('# URL REJECT', urlReject)
      prototype = prototype.replace('// Hostname', 'hostname = ' + hostName.concat(userHostname.add.filter(i => i != '')).join(', '))

      if (isMitm) {
        prototype = prototype.replace('# MITM', 'enable = true')
      } else {
        prototype = prototype.replace('# MITM', '')
      }

      prototype = replaceRule(prototype)

      $console.info(prototype)

      let fn = (workspace.fileName || 'lhie1') + '.conf'

      if ('onDone' in params) {
        ruleUpdateUtil.getGitHubFilesSha({
          handler: sha => {
            if (sha) {
              ruleUpdateUtil.setFilesSha(sha)
            } else {
              $console.info('sha 获取失败')
            }
          }
        })
        params.onDone({
          fileName: fn,
          fileData: prototype
        })
      }
    }).catch(e => {
      $console.error(e)
    })
  } catch (e) {
    'onError' in params && params.onError(e)
  }
}

function exportConf(fileName, fileData, actionSheetCancel) {

  $ui.push({
    props: {
      title: "规则预览"
    },
    layout: $layout.fill,
    views: [{
      type: "button",
      props: {
        title: "导出配置"
      },
      layout: function (make) {
        make.left.right.top.inset(10)
        make.height.equalTo(32)
      },
      events: {
        tapped: function (sender) {
          $share.sheet({
            items: [fileName, $data({
              "string": fileData
            })],
            handler: success => {
              if (!success && actionSheetCancel) {
                actionSheetCancel()
              }
            }
          })
        }
      }
    }, {
      type: "text",
      props: {
        text: fileData,
        font: $font(12),
        editable: false,
      },
      layout: function (make) {
        make.left.bottom.right.equalTo(0)
        make.top.equalTo($("button").bottom).offset(0)
      },
    }]
  })
}

module.exports = {
  renderUI: renderUI
}