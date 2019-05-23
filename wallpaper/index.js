const getDBClient = require('../db')
const rp = require('request-promise')

var initialPage = 1

getDBClient().then(dbClient => {
    var db = dbClient.db('wallpaper')
    var collection = db.collection('list')
    getWallpaperList(initialPage);
    
    function getWallpaperList(page) {
        console.log(`抓取第${page}页中...`);
        rp(`https://api.desktoppr.co/1/wallpapers?page=${page}`)
            .then(function (res) {
                // Process html...
                var obj = JSON.parse(res);
                obj.response.forEach(item => {
                    collection.updateOne({
                        id: item.id
                    }, {
                            $set: {
                                ...item
                            }
                    }, {
                        upsert: true
                    }).catch(e => {
                        console.error(e)
                    })
                })
                if (obj.pagination.current >= obj.pagination.pages) {
                    process.exit();
                } else {
                    getWallpaperList(page+1);
                }
            })
            .catch(function (err) {
                // Crawling failed...
                console.error(err);
                console.warn(`抓取第${page}页失败，尝试第${page+1}页`);
                getWallpaperList(page + 1);
            });
    }
})