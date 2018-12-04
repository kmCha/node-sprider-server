var cheerio = require('cheerio')

module.exports = getOptions = (url) => {
  return {
    uri: url,
    transform(body) {
      return cheerio.load(body)
    }
  }
}