const app = require('scripts/app')
const updateUtil = require('scripts/updateUtil')

$app.autoKeyboardEnabled = true
// $app.keyboardToolbarEnabled = true

app.renderUI()

updateUtil.getLatestVersion({
    handler: version => {
        console.log([version, updateUtil.getCurVersion()])        
        if (needUpdate(version, updateUtil.getCurVersion())) {
            $http.get({
                url: 'https://raw.githubusercontent.com/c7i/Rules-lhie1-SR/master/updateLog.md' + '?t=' + new Date().getTime(),
                handler: resp=> {
                    $ui.push({
                        props: {
                            title: "更新可用"
                        },
                        views: [{
                            type: "markdown",
                            props: {
                                id: "",
                                content: `## 新版：${version}\n> 当前：${updateUtil.getCurVersion()}\n\n${resp.data}`
                            },
                            layout: (make, view) => {
                                make.width.equalTo(view.super)
                                make.height.equalTo(view.super).offset(-50)
                            }
                        }, {
                            type: 'button',
                            props: {
                                title: "更新",
                                id: "updateBtn"
                            },
                            layout: (make, view)=> {
                                make.bottom.equalTo(view.super).offset(-10)
                                make.width.equalTo(view.super).offset(-30)
                                make.centerX.equalTo(view.super)
                                make.height.equalTo(40)
                            },
                            events: {
                                tapped: sender=> {
                                    updateUtil.updateScript(version)
                                }
                            }
                        }]
                    })
                }
            })
            
        }
    }
})

function needUpdate(nv, ov) {
    let getVersionWeight = i => {
        return i.split('.').map(i => i * 1).reduce((s, i) => s * 100 + i)
    }
    return getVersionWeight(nv) > getVersionWeight(ov)
}
