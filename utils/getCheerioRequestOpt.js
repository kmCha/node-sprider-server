var cheerio = require('cheerio')

module.exports = getOptions = (url) => {
  return {
    uri: url,
    timeout: 5000,
    transform(body) {
      return cheerio.load(body)
    }
  }
}