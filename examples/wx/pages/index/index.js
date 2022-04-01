const app = getApp()
import {
    upload
} from 'qiniu-upload-mini';
Page({
    data: {
        imageUrl: '',
        videoUrl: ''
    },
    // 上传图片
    uploadImageTap() {
        wx.chooseImage({
            count: 1,
            success: (res) => {
                const filePath = res.tempFilePaths[0]
                const {
                    upToken,
                    uploadUrl,
                    domain,
                    region
                } = {
                    upToken: 'cDxk4BSsCK5WRNa_sgAx8dx6RdPfa9DhX57-wF9X:HPgYfFnf4sCz1AbQRXjbB8kxVcg=:eyJzY29wZSI6ImRvd25sb2FkIiwiZGVhZGxpbmUiOjE2NDg4MTQ5NTl9',
                    domain: 'http://download.midadata.com',
                    region: 'ECN'
                } // 替换成自己的配置
                const ext = filePath?.substring(filePath.lastIndexOf("."))
                const newFileName = `${this.dateFormat(new Date(), "yyyyMMddhhmmss")}_${Math.random() * 10000}${ext}`
                upload({
                    update: true, // 是否需要更新配置
                    filePath,
                    options: {
                        key: `${uploadUrl}${newFileName}`, // uploadUrl是后台传的目录名可有可无 下载域名后面的路径加后缀名
                        region, // 上传地区 ECN等根据自己的地区对照上面的表填写
                        upToken, // 上传凭证 服务端获取到存到全局数据中心
                        domain, // 图片下载前缀
                        shouldUseQiniuFileName: false // true采用七牛云自定义名称即参数种key值无效，false时为自定义名称
                    }
                }).then((res) => {
                    if (!res?.imageUrl) return
                    console.log(res?.imageUrl)
                    this.setData({
                        imageUrl: res?.imageUrl
                    })
                }).catch(res => {
                    // token过期或者错误
                    if (res?.statusCode === 401) {
                        return
                    }
                })
            }
        })
    },
    // 上传视频
    uploadVideoTap() {
        wx.chooseVideo({
            success: (res) => {
                const filePath = res.tempFilePath
                const {
                    upToken,
                    uploadUrl,
                    domain,
                    region
                } = {
                    upToken: 'cDxk4BSsCK5WRNa_sgAx8dx6RdPfa9DhX57-wF9X:HPgYfFnf4sCz1AbQRXjbB8kxVcg=:eyJzY29wZSI6ImRvd25sb2FkIiwiZGVhZGxpbmUiOjE2NDg4MTQ5NTl9',
                    domain: 'http://download.midadata.com',
                    region: 'ECN'
                } // 替换成自己的配置
                const ext = filePath?.substring(filePath.lastIndexOf("."))
                const newFileName = `${this.dateFormat(new Date(), "yyyyMMddhhmmss")}_${Math.random() * 10000}${ext}`
                upload({
                    update: true, // 是否需要更新配置
                    filePath,
                    options: {
                        key: `${uploadUrl}${newFileName}`, // uploadUrl是后台传的目录名可有可无 下载域名后面的路径加后缀名
                        region, // 上传地区 ECN等根据自己的地区对照上面的表填写
                        upToken, // 上传凭证 服务端获取到存到全局数据中心
                        domain, // 图片下载前缀
                        shouldUseQiniuFileName: false // true采用七牛云自定义名称即参数种key值无效，false时为自定义名称
                    }
                }).then((res) => {
                    if (!res?.imageUrl) return
                    console.log(res?.imageUrl)
                    this.setData({
                        videoUrl: res?.imageUrl
                    })
                }).catch(res => {
                    // token过期或者错误
                    if (res?.statusCode === 401) {
                        return
                    }
                })
            }
        })
    },
    /**
     * 时间格式化 201903041606
     */
    dateFormat(date = new Date(), fmt) {
        // 时间格式处理函数 
        const o = {
            "M+": date.getMonth() + 1, // 月份 
            "d+": date.getDate(), // 日 
            "h+": date.getHours(), // 小时 
            "m+": date.getMinutes(), // 分 
            "s+": date.getSeconds(), // 秒 
            "q+": Math.floor((date.getMonth() + 3) / 3), // 季度 
            "S": date.getMilliseconds() // 毫秒 
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (let k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k])
                    .length)));
            }
        }
        return fmt;
    }
})