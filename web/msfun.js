const fs = require('fs')
const axios = require('axios')

const fsDir = async (path) => { // 创建目录
  return new Promise((resolve, reject) => { // 创建目录,recursive:true已存在也不会报错
    fs.mkdir(path, { recursive: true }, (err) => {
      if (err) {
        console.log('报错路径:' + path)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
const fsRmdir = async (path, recursive) => { // 删除目录  recursive为true时，递归删除（递归删除目前不稳定）
  if (!recursive) { recursive = false }
  return new Promise((resolve, reject) => {
    fs.rmdir(path, { recursive: recursive }, (err) => {
      if (err) {
        console.log('报错路径:' + path)
        reject(err)
      } else {
        console.log('删除成功')
        resolve()
      }
    })
  })
}
const fsWrite = async (path, content, flag) => { // 写入文件
  if (!flag) { flag = 'w' }
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, { flag: flag, encoding: 'utf-8' }, (err) => {
      if (err) {
        console.log('报错路径:' + path)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
const fsRead = async (path) => { // 读取文件
  return new Promise((resolve, reject) => {
    fs.readFile(path, { flag: 'r', encoding: 'utf-8' }, (err, data) => {
      if (err) {
        console.log('报错路径:' + path)
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
const fsUnlink = async (path) => { // 删除文件
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        console.log('报错路径:' + path)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
const writeStream = async (pathUrl, linkUrl) => { // 创建写入流
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(pathUrl)
    axios.get(linkUrl, { responseType: 'stream' }).then((res) => {
      res.data.pipe(ws)
      // 关闭写入流
      res.data.on('close', () => {
        ws.close()
      })
      resolve()
    }).catch((err) => {
      reject(err)
    })
  })
}
const axReq = async (linkUrl) => { // 网络请求
  return new Promise((resolve, reject) => {
    axios.get(linkUrl, {}).then((res) => {
      resolve(res)
    }).catch((erro) => {
      console.log('报错链接：' + linkUrl)
      reject(erro)
    })
  })
}
const msWait = async (time) => { // 延迟函数
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // console.log('延迟执行'+ time +'ms')
      resolve('延迟执行' + time + 'ms')
    }, time)
  })
}
const delStrip = (str) => { // 删除符号
  str = str.replace(/[@#$%^&*{}:"L<>?|？'"\\/\b\f\n\r\t]/g, '')
  return str
}
module.exports = { fsWrite, fsRead, fsUnlink, fsDir, fsRmdir, writeStream, delStrip, axReq, msWait }
