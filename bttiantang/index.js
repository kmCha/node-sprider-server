const getDBClient = require('../db')
const getNextPage = require('./spider/listItem')
const getMovieInfo = require('./spider/detail')
const $ = require('cheerio')
const { to } = require('../utils')

var initialPage = 0
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
        requestQueue = []
        getListRec(page + 1)
      } else {
        process.exit()
      }
    } else {
      console.error('请求特定页码数据错误，请求下一页')
      getListRec(page + 1)
    }
  }

  /**
   * 同时发出一页的详情请求
   */
  async function controlQueue () {
    var promiseArr = []
    for (let i = 0; i < requestQueue.length; i++) {
      let fn = requestQueue[i]
      promiseArr.push(fn())
    }
    //所有请求都完成之后resolve
    return Promise.all(promiseArr)
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
          console.error(e)
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
        console.error(e)
      })
    } else {
      console.error('请求特定详情页数据错误')
    }
  }

})