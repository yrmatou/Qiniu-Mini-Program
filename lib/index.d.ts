import { Upload } from '../types';
/**
 * 七牛云配置初始化
 */
declare function setConfig(options: {
    [x: string]: string;
    region: string;
}): Promise<void>;
/**
 * 正式上传的前置方法，做预处理，初始化七牛云配置
 * filePath：上传的文件本地路径，options：初始化参数，update：是否需要更新初始化参数，
 * progress：上传进度函数，cancelTask：取消上传任务
 */
declare function upload({ filePath, options, update, progress, cancelTask }: Upload): Promise<unknown>;
export { setConfig, upload };
