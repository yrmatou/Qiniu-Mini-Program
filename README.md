## 各平台小程序使用七牛云上传图片或者视频 

[toc]

### 资料
- [七牛云直接上传文档](https://developer.qiniu.com/kodo/1312/upload)  

### 准备
- 根据你创建的七牛`存储空间`，把对应的 https 上传地址添加到小程序的访问白名单中，方法如下：

>1. 登录 [微信公众平台](https://mp.weixin.qq.com/)，前往 **设置 - 开发设置**，点击 **服务器配置** 下的「**修改**」链接。
>2. 修改 uploadFile 域名(比如华东 https 上传地址为：`https://upload.qiniup.com`，地址不清楚写什么请参见[https地址附录](#region))
>3. 如果需要下载文件，则还需要一同设置 **downloadFile 域名**，为你的 bucket 下载地址
>4. 保存即可

| 字段名             | 内容                             |
| --------------- | ------------------------------ |
| request 域名      | https://yourServce.com         |
| uploadFile 域名   | https://upload.qiniup.com （根据存储区域填写）  |
| downloadFile 域名 | https://baldkf.bkt.clouddn.com |

- **对于存储区域和 options 中 region**

七牛云文件上传接口，文件向匹配的接口中传输，存储区域对应 HTTPS 地址，我这里用的是**加速上传**路径，参考[官方文档](https://developer.qiniu.com/kodo/1671/region-endpoint-fq)

<a id="region"></a>

| 存储区域 | 区域代码 | HTTPS 地址             |
| -------- | -------- | ---------------------- |
| 华东     | ECN      | https://upload.qiniup.com |
|华东浙2   | ECNZ     | https://upload-cn-east-2.qiniup.com |
| 华北     | NCN      | https://upload-z1.qiniup.com  |
| 华南     | SCN      | https://upload-z2.qiniup.com  |
| 北美     | NA       | https://upload-na0.qiniup.com |
| 新加坡   | ASG      | https://upload-as0.qiniup.com |


### 安装
```js
npm install qiniu-upload-mini 或者 yarn add qiniu-upload-mini
```

### upload 方法参数
```js
upload({
  filePath: '', // 调用小程序相册获取到的文件本地临时路径 举例：http://tmp/35GWmAhZDg5O784a1.png。
  update: true, // 是否需要更新配置 例如当token过时的时候需要重置config
  options: {
    key: '', // shouldUseQiniuFileName为false时取此值，自定义下载域名后面的路径加后缀名
    /**
     * bucket 所在区域。ECN, SCN, NCN, NA, ASG，ECN2分别对应七牛云的
     * 华东，华东浙2，华南，华北，北美，新加坡 6 个区域，后续新增的话再补充
     */
    region: '',
    /**
     * 七牛云bucket 外链前缀，外链在下载资源时用到 图片的下载域名前缀 http(s)://xxxx等
     */
    domain: '',
    /**
     * 获取upToken方法二选一即可，执行优先级为：upToken > upTokenUrl
     * 二选一，极力推荐使用 upToken 外部传入token方式最好
     */
    upToken: '',
    /**
     * 自己的请求token的服务地址，从指定url通过 HTTP GET获取upToken
     * 1. 该接口不用鉴权比如：必须传token或者cookie
     * 2. 返回的格式必须是
     * {
     *  domain: "http://download.midadata.com",
        expire: 3590,
        preUrl: "mida/",
        region: "ECN",
        upToken: "wqeqweqweqw12312312312sdads"
      }
    */
    upTokenUrl: '',
    shouldUseQiniuFileName: false // true采用七牛云自定义名称即参数种key值无效，false时为自定义名称取key值
  }
})
```

### 1分钟使用教程

- **页面调用方法**
```js
  1. import { setConfig, upload } from 'qiniu-upload-mini';

  // 自己封装的Promise方法
  export const uploadQiniuCommon = (filePath) => {
    return new Promise((resolve, reject) => {
      // 上传需要的参数 可从服务端获取后保存到全局store里面
      const { upToken, uploadUrl, domain, region } = getState('global').qiniuOptions || {}
      // 获取上传文件的类型.png、.jpg等
      const ext = filePath?.substring(filePath.lastIndexOf("."))
      // 自定义设置的key值 dateFormat方法在下面
      const newFileName = `${dateFormat(new Date(), "yyyyMMddhhmmss")}_${Math.random() * 10000}${ext}`
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
      }).then(res => {
        if (!res?.imageUrl) return reject(res)
        resolve(res?.imageUrl)
      }).catch(res => {
        // token过期或者错误
        if (res?.statusCode === 401) {
          // 根据自己所用框架清除全局七牛云配置
          // 一般这里需要做无感知刷新token重新上传
          // doSoming
          reject(res)
          return
        }
        reject(res)
      })
    })
  }

  // 附带时间格式化 201903041606
  export const dateFormat = (date = new Date(), fmt) => {
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
    for (const k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k])
          .length)));
      }
    }
    return fmt;
  }

```

### TODO
* 单元测试

### 各平台支持
* 目前npm包方式支持taro，uni-app编译成微信小程序和原生小程序
* 其他平台单独下载js文件就行[下载](/platform/)

### License
[MIT](https://github.com/liuxing/translator-cli/blob/master/LICENSE)

### Keywords
小程序，Taro，uni-app
