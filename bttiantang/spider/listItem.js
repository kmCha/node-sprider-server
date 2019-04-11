const { getCheerioRequestOpt, to } = require('../../utils')
const { host } = require('../config')
const rp = require('request-promise')

module.exports = async function getNextPage(page) {

  console.log('On page:' + page)
  var [err, $] = await to(rp(getCheerioRequestOpt(`${host}/e/action/ListInfo/?classid=11&page=${page}`)))
  if (err) {
    console.error(`请求${page}页错误`)
    return Promise.reject(`请求${page}页错误`)
  }
  return $('li.post.box')

}