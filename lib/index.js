/**
 * 七牛云上传直连：https://developer.qiniu.com/kodo/1312/upload
 */
(function () {
  /**
   * 请参考demo的index.js中的initQiniu()方法，若在使用处对options进行了赋值，则此处config不需要赋默认值。
   * init(options) 即updateConfigWithOptions(options)，会对config进行赋值
   */
  let config = {
    /**
     * bucket 所在区域。ECN, SCN, NCN, NA, ASG，ECN2分别对应七牛云的
     * 华东，华东浙2，华南，华北，北美，新加坡 6 个区域
     */
    qiniuRegion: '',
    // 七牛云bucket 外链前缀，外链在下载资源时用到
    qiniuBucketURLPrefix: '',
    /**
     * 获取upToken方法三选一即可，执行优先级为：upToken > upTokenURL > upTokenFunc。
     * 三选一，剩下两个置空。推荐使用 qiniuUploadToken 详情请见 README.md
     */
    // 由其他程序生成七牛云upToken，然后直接写入upToken
    qiniuUploadToken: '',
    // 从指定 url 通过 HTTP GET 获取 upToken，返回的格式必须是 json 且包含 upToken 字段，例如： {"upToken": "0MLvWPnyy..."}
    qiniuUploadTokenURL: '',
    // upTokenFunc 这个属性的值可以是一个用来生成upToken的函数，详情请见 README.md
    qiniuUploadTokenFunction: function () { },
    /**
     * qiniuShouldUseQiniuFileName 如果是 true，则文件的 key 由 qiniu 服务器分配（全局去重）。
     * 如果是 false，则文件的 key 使用微信自动生成的 filename。出于初代sdk用户升级后兼容问题的考虑，默认是 false。
     * 微信自动生成的 filename较长，导致fileURL较长。
     * 推荐使用{qiniuShouldUseQiniuFileName: true} + "通过fileURL下载文件时，自定义下载名" 的组合方式。
     * 自定义上传key 需要两个条件：1. 此处shouldUseQiniuFileName值为false。 2. 通过修改qiniuUploader.upload方法传入的options参数，可以进行自定义key。
     * （请不要直接在sdk中修改options参数，修改方法请见demo的index.js）
     * 通过fileURL下载文件时，自定义下载名，请参考：七牛云“对象存储 > 产品手册 > 下载资源 > 下载设置 > 自定义资源下载名”（https://developer.qiniu.com/kodo/manual/1659/download-setting）。
     * 本sdk在README.md的"常见问题"板块中，有"通过fileURL下载文件时，自定义下载名"使用样例。
    */
    qiniuShouldUseQiniuFileName: false
  }
  let configBool = false; // 是否已经初始化过
  // init(options) 将七牛云相关配置初始化进本sdk
  // 在整个程序生命周期中，只需要 init(options); 一次即可
  // 如果需要变更七牛云配置，再次调用 init(options); 即可
  function init(options) {
    configBool = true
    if (!options || !options.region) {
      return Promise.reject('qiniu uploader need your bucket region')
    }
    const keys = {
      'upToken': 'qiniuUploadToken',
      'upTokenURL': 'qiniuUploadTokenURL',
      'upTokenFunc': 'qiniuUploadTokenFunction',
      'qiniuBucketURLPrefix': 'domain',
      'qiniuShouldUseQiniuFileName': 'qiniuShouldUseQiniuFileName'
    }
    Object.keys(options).forEach(k => {
      config[keys[k]] = options.k ? options.k : ''
    })
    return Promise.resolve()
  }
  /**
   * 正式上传的前置方法，做预处理，应用七牛云配置
   */
  function upload({ filePath, options, update = false, progress, cancelTask }) {
    return new Promise(async (resolve, reject) => {
      try {
        if (null == filePath) {
          return reject('qiniu uploader need filePath to upload');
        }
        if (!configBool || update) {
          configBool = true
          await init(options)
        }
        await getToken()
        await doUpload({ filePath, options, progress, cancelTask });
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }
  /**
   * 三种方式获取token 
   */
  function getToken() {
    return new Promise(async (resolve, reject) => {
      // 第一种 直接赋值token
      if (config.qiniuUploadToken) {
        return resolve()
      }
      // 第二种 方法内request获取token
      if (config.qiniuUploadTokenURL) {
        await getQiniuToken()
        return resolve()
      }
      // 第三种方法 callback获取token
      if (config.qiniuUploadTokenFunction) {
        config.qiniuUploadToken = await Promise.resolve(config.qiniuUploadTokenFunction());
        if (null == config.qiniuUploadToken && config.qiniuUploadToken.length > 0) {
          return reject('qiniu UploadTokenFunction result is null, please check the return value');
        }
        return resolve()
      }
      reject('qiniu uploader need one of [upToken, upTokenURL, upTokenFunc]');
    })
  }
  /**
   * 上传函数
   */
  function doUpload({ filePath, options, progress, cancelTask }) {
    return new Promise(async (resolve, reject) => {
      if (null == config.qiniuUploadToken && config.qiniuUploadToken.length > 0) {
        return reject('qiniu UploadToken is null, please check the init config or networking');
      }
      const url = await uploadURLFromRegionCode(config.qiniuRegion);
      const fileName = filePath.split('//')[1];
      // 自定义上传key（即自定义上传文件名）。通过修改qiniuUploader.upload方法传入的options参数，可以进行自定义文件名称。
      // 如果options非空，则使用options中的key作为fileName
      if (options && options.key) fileName = options.key;
      let formData = { 'token': config.qiniuUploadToken };
      // qiniuShouldUseQiniuFileName 如果是 true，则文件的 key 由 qiniu 服务器分配（全局去重）。
      // 如果是 false，则文件的 key 使用微信自动生成的 filename。出于初代sdk用户升级后兼容问题的考虑，默认是 false。
      if (!config.qiniuShouldUseQiniuFileName) { formData['key'] = fileName }
      const uploadTask = wx.uploadFile({
        url: url,
        filePath,
        name: 'file',
        formData,
        success: (res) => {
          if (res.statusCode !== 200) return reject(res)
          const dataString = res.data
          try {
            const dataObject = JSON.parse(dataString);
            dataObject.imageURL = `${config.qiniuBucketURLPrefix}/${dataObject.key}`; // 拼接fileURL
            resolve()
          } catch (e) {
            reject(e)
          }
        },
        fail: (error) => {
          reject(error)
        }
      })
      // 文件上传进度
      uploadTask.onProgressUpdate((res) => {
        progress && progress(res)
      })
      // 中断文件上传
      cancelTask && cancelTask(() => {
        uploadTask.abort()
      })
    })
  }
  /**
   * 获取七牛云upToken, url为后端服务器获取七牛云upToken接口
   * 这种形式接口返回参数格式必须严格按照下面来
   */
  function getQiniuToken() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.qiniuUploadTokenURL,
        success: (res) => {
          const token = res.data.upToken;
          if (token && token.length > 0) {
            config.qiniuUploadToken = token;
            return resolve()
          }
          reject('qiniuUploader cannot get your token, please check the upTokenURL or server')
        },
        fail: (error) => {
          reject('qiniu UploadToken is null, please check the init config or networking: ' + error)
        }
      })
    })
  }
  /**
   * 选择七牛云文件上传接口，文件向匹配的接口中传输。
   * ECN, SCN, NCN, NA, ASG，ECN2分别对应七牛云的：华东，华东浙2，华南，华北，北美，新加坡。6个区域
   * 新增的区域自行添加就行
   */
  function uploadURLFromRegionCode(code) {
    const map = new Map([
      ['ECN', 'https://upload.qiniup.com'],
      ['ECN2', 'https://upload-cn-east-2.qiniup.com'],
      ['NCN', 'https://upload-z1.qiniup.com'],
      ['SCN', 'https://upload-z2.qiniup.com'],
      ['NA', 'https://upload-na0.qiniup.com'],
      ['ASG', 'https://upload-as0.qiniup.com']
    ])
    if (!map.has(code)) return Promise.reject('region code error')
    return Promise.resolve(map.get(code))
  }

  module.exports = {
    init,
    upload
  }
})();