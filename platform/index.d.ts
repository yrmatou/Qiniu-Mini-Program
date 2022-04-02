export interface Config {
  qiniuShouldUseQiniuFileName?: boolean,
  qiniuRegion: string,
  qiniuBucketURLPrefix: string,
  qiniuUploadToken?: string,
  qiniuUploadTokenUrl?: string
}

export interface Keys {
  shouldUseQiniuFileName: string,
  region: string,
  upToken: string,
  upTokenUrl: string,
  domain: string
}

export interface Upload {
  filePath: string,
  options: any,
  update?: boolean,
  progress?: (...args: any[]) => any,
  cancelTask?: (...args: any[]) => any
}

export interface Responed {
  data: {
    upToken: string;
    domain: string;
    region: string
  }
}