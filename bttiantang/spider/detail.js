const { getCheerioRequestOpt, to } = require('../../utils')
const rp = require('request-promise')
const { host } = require('../config')

module.exports = async function getMovieInfo($elem) {
  let title = $elem.find('a.zoom').attr('title')
  let link = host + $elem.find('a.zoom').attr('href')
  let id = parseInt($elem.find('a.zoom').attr('href').match(/\/(\d+)\.html/)[1])
  let [err, _$] = await to(rp(getCheerioRequestOpt(link)))
  if (err) {
    return Promise.reject('请求错误')
  }

  let $content = _$('#content')
  let $coverWrap = $content.find('.tpic-cont-s').remove()
  let coverImg = $coverWrap.find('img').attr('src')
  let $movieInfo = $content.find('#post_content').find('p').eq(0)
  let releaseDateMatch = $movieInfo.text().match(/(\d+\-\d+\-\d+)/)
  let releaseDate = releaseDateMatch ? releaseDateMatch[1] : ''
  let tags = $movieInfo.find('a').filter((index, item) => {
    return _$(item).attr('href').indexOf('sb') >= 0
  }).map((index, elem) => {
    return _$(elem).text()
  }).get()
  let releaseInChina = $movieInfo.text().indexOf('中国大陆') > -1
  let doubanLink = $movieInfo.find('a').filter((index, el) => {
    return _$(el).attr('href').indexOf('douban') >= 0
  }).attr('href') || ''
  let doubanScoreMatch = $movieInfo.text().match(/豆瓣评分[\s\b]*([\d.]+)[\s\b]*分/)
  let doubanScore = parseFloat(doubanScoreMatch ? doubanScoreMatch[1] : 0)

  let downloadList = $content.find('.dlist li').map(function (i, el) {
    var $a = _$(el).find('a').eq(1)
    return {
      title: $a.text(),
      href: $a.attr('href')
    }
  }).get()

  var movieModal = {
    id,
    title,
    coverImg,
    releaseDate,
    releaseInChina,
    doubanScore,
    doubanLink,
    downloadList,
    tags
  }
  return movieModal
}