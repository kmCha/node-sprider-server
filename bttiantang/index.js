const getDBClient = require('./db')
const getNextPage = require('./spider/listItem')
const getMovieInfo = require('./spider/detail')
const $ = require('cheerio')
const { to } = require('../utils')

var page = 1677

getDBClient().then(dbClient => {
  var db = dbClient.db('bttiantang')
  var collection = db.collection('movies')

  getListRec(page)

  async function getListRec(page) {

    var [err1, $listItem] = await to(getNextPage(page))
    if (!err1) {
      if ($listItem.length > 0) {
        $listItem.each(async (index, elem) => {
          let [err2, movieDetail] = await to(getMovieInfo($(elem)))
          if (!err2) {
            let [err3, count] = await to(collection.find({
              id: movieDetail.id
            }).count())
            if (!err3) {
              console.log(count, page, movieDetail.title)
              if (count === 0) {
                collection.insertOne(movieDetail)
              }
            }
          }
        })
        getListRec(page + 1)
      } else {
        dbClient.close()
      }
    } else {
      getListRec(page + 1)      
    }
  }

})
