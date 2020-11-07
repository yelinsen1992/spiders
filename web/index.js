const express = require('express') // 服务器框架
const fs = require('fs') // 文件模块
const path = require('path') // path模块
const app = express()
const bodyParser = require('body-parser') // 请求解析模块
const debug = require('debug')('my-application') // debug模块

const cheerio = require('cheerio') // node版jq模块，只能爬取静态页面
const { fsWrite, fsRead, axReq } = require('./msfun.js')
const puppeteer = require('puppeteer') // 浏览器模块，可爬取动态页面
const saveDir = 'download/pl.txt'
const xlsx = require('xlsx')

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false })) // 解析post请求数据

app.use('/download', express.static('download')) // 允许目录文件可以访问
app.use('/public', express.static(path.join(__dirname, 'public'))) // 允许目录文件可以访问
// app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'favicon.ico'))) // 设置图标

app.get('/', (req, res) => { // 返回index首页
  fs.readFile(path.join(__dirname, 'index.html'), function(err, data) {
    if (!err) {
      res.end(data)
    } else {
      throw err
    }
  })
})

// 查找taptap游戏并返回匹配性最高的一个游戏
app.get('/getReview', async(req, res) => {
  const id = req.query.gameId
  const page = req.query.page
  ;(async () => {
    try {
      const flag = await pl(id, page)
      if (flag === false) {
        const data = await parseTxt(saveDir)
        data.sort(compare('star')) // 按星级排序
        const xlsxObj = xlsx.utils.json_to_sheet(data) // json转表对象
        const workbook = { // 定义操作文档
          SheetNames: ['nodejs-sheetname'], // 定义表明
          Sheets: {
            'nodejs-sheetname': Object.assign({}, xlsxObj) // 表对象[注意表名]
          },
        }
        xlsx.writeFile(workbook, './download/pl.xlsx')
        const downLink = './download/pl.xlsx'
        res.send({ status: true, msg: '评论爬取完毕', downLink, page })
      } else {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.send(page)
      }
    } catch (err) {
      console.log(err)
      res.send({ status: false, msg: '服务器出错了' })
    }
  })()
})
// 查找游戏
app.get('/gameSearch', async(req, res) => {
  const keyWord = encodeURI(req.query.name)
  const url = 'https://www.taptap.com/search/apps/' + keyWord
  ;(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForSelector('.van-tabs__content > div:nth-of-type(2) .van-list > div:nth-of-type(1) > a')
    const gameId = (await page.$eval('.van-tabs__content > div:nth-of-type(2) .van-list > div:nth-of-type(1) > a', el => el.href)).replace('https://www.taptap.com/app/', '')
    const gameName = await page.$eval('.van-tabs__content > div:nth-of-type(2) .van-list > div:nth-of-type(1) > a .game-list-item__name', el => el.innerText)
    const iconUrl = await page.$eval('.van-tabs__content > div:nth-of-type(2) .van-list > div:nth-of-type(1) > a .game-list-item__image img', el => el.src)
    const gameRate = await page.$eval('.van-tabs__content > div:nth-of-type(2) .van-list > div:nth-of-type(1) > a .app-item-layout-item__right .app-rating__rate', el => el.innerText)
    const gameType = await page.$eval('.van-tabs__content > div:nth-of-type(2) .van-list > div:nth-of-type(1) > a .app-item-layout-item__right .game-list-item__labels', el => el.innerText)
    const obj = {
      gameId,
      gameName,
      iconUrl,
      gameRate,
      gameType
    }
    res.send({ status: true, obj })
  })()
})

// 爬取评论
const pl = async (id, page) => {
  if (page === '1') { // 清空文档
    await fsWrite(saveDir, '', 'w')
  }
  const body = await axReq('https://www.taptap.com/app/' + id + '/review?order=update&page=' + page + '#review-list')
  const $ = cheerio.load(body.data)
  const num = $('#reviewsList>.taptap-review-item.collapse')
  if (num.length === 0) {
    return false
  }
  for (let i = 0; i < num.length; i++) {
    const ele = $(num)[i]
    let star = $(ele).children('.review-item-text').children('.item-text-score').find('.colored').attr('style').replace(/[^0-9]/ig, '')
    switch (star) {
      case '14': {
        star = 1
        break
      }
      case '28': {
        star = 2
        break
      }
      case '42': {
        star = 3
        break
      }
      case '56': {
        star = 4
        break
      }
      case '70': {
        star = 5
        break
      }
    }
    const name = $(ele).children('.review-item-text').children('.item-text-header').find('.taptap-user a').text()
    const time = $(ele).children('.review-item-text').children('.item-text-header').find('.text-header-time span span').eq(1).text() || $(ele).children('.review-item-text').children('.item-text-header').find('.text-header-time span').eq(0).text()
    const intr = $(ele).children('.review-item-text').children('.item-text-body').find('p').text()
    const content = `{"name":"${strFuc(name)}","time":"${strFuc(time)}","star":"${star}","intr":"${strFuc(intr)}"},\n`
    await fsWrite(saveDir, content, 'a')
  }
}
// 处理特殊字符串
const strFuc = (str) => {
  str = str.replace(/\\/g, '\\\\')
  str = str.replace(/\n/g, '\\n')
  str = str.replace(/\r/g, '\\r')
  str = str.replace(/\t/g, '\\t')
  str = str.replace(/("")+/g, '""')
  str = str.replace(/'/g, '&#39;')
  // str = str.replace(/ /g, '&nbsp;')
  str = str.replace(/</g, '&lt;')
  str = str.replace(/>/g, '&gt;')
  str = str.replace(/"/g, '&quot;')
  return str
}
// 读取文本内容转JSON对象
const parseTxt = async (url) => {
  let text = (await fsRead(url)).replace(/\n/g, '')
  text = '[' + text + ']'
  text = text.replace('},]', '}]')
  const arr = JSON.parse(text)
  return arr
}
// 降序排列
const compare = (type) => {
  return (a, b) => {
    return (b[type] - a[type])
  }
}

const port = 8787
app.set('port', process.env.PORT || port) // 设定监听端口
const server = app.listen(app.get('port'), () => { // 启动监听
  console.log(`Example app listening on http://127.0.0.1:${port}`)
  debug('Express server listening on port ' + server.address().port)
})
