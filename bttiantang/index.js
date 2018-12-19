const getDBClient = require('./db')
const getNextPage = require('./spider/listItem')
const getMovieInfo = require('./spider/detail')
const $ = require('cheerio')
const { to } = require('../utils')

var initialPage = 0
const concurrency = 5
var requestQueue = []

getDBClient().then(dbClient => {
  var db = dbClient.db('bttiantang')
  var collection = db.collection('movies')
  var collectionTags = db.collection('tags')

  getListRec(initialPage)

  async function getListRec(page) {

    var [err1, $listItem] = await to(getNextPage(page))
    if (!err1) {
      if ($listItem.length > 0) {
        $listItem.each((index, elem) => {
          requestQueue.push(getListItemInfo.bind(this, page, elem))
        })
        await controlQueue()
        getListRec(page + 1)
      } else {
        dbClient.close()
      }
    } else {
      getListRec(page + 1)
    }
  }

  /**
   * 并发控制
   */
  async function controlQueue () {
    var promiseArr = []
    // 同步发出concurrency的请求数
    for (let i = 0; i < concurrency; i++) {
      promiseArr.push(runNext())
    }
    // 当前并发数下的所有请求都完成之后resolve
    return Promise.all(promiseArr)
  }

  /**
   * 同一并发链路下的串行请求
   */
  async function runNext() {
    let fn = requestQueue.shift()
    if (fn) {
      await fn()
      await runNext()
    }
  }

  /**
   *
   * @param {Number} page 元素所处页数
   * @param {CheerioElement} elem cheerio包装的类DOM元素
   */
  async function getListItemInfo(page, elem) {
    let [err2, movieDetail] = await to(getMovieInfo($(elem)))
    if (!err2) {
      movieDetail.tags.forEach(name => {
        collectionTags.updateOne({
          name
        }, {
          $set: {
            name
          }
        }, {
          upsert: true
        }).catch(e => {
          console.log(e)
        })
      })
      console.log(page, movieDetail.title, movieDetail.tags)
      collection.updateOne({
        id: movieDetail.id
      }, {
        $set: {
          ...movieDetail
        }
      }, {
        upsert: true
      }).catch(e => {
        console.log(e)
      })
    }
  }

})