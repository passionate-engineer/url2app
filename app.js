const exec = require('child_process').exec
const nativefier = require('nativefier').default
const http = require('http')
const express = require("express")
const cluster = require('express-cluster')
const app = express()
const server = http.createServer(app)

const tmpDir = __dirname + '/tmp'
const port = (process.argv[2]) ? process.argv[2] : 3000

function emptyTmp (callback) {
  exec('rm -r *', {cwd: tmpDir}, (err, stdout, stderr) => {
    callback()
  })
}

function url2app (url, platform, callback) {
  const appType = (platform === 'darwin') ? 'app' : 'exe'

  nativefier({out: tmpDir, targetUrl: url, platform: platform}, (error, appDir) => {
    exec('mv *.' + appType + ' app.' + appType, {cwd: appDir}, (err, stdout, stderr) => {
      if (appType === 'app') {
        exec('zip -r app.zip app.' + appType, {cwd: appDir}, (err, stdout, stderr) => {
          callback(appDir + '/app.zip')
        })
      } else {
        callback(appDir + '/app.' + appType)
      }
    })
  })
}

function upServer () {
  cluster(function(worker) {
    server.listen(port, function(){
      console.log("Node.js is listening to PORT:" + server.address().port)
    })
  })

  app.get("/url2app", function(req, res, next){
    const url = req.query.url
    const platform = (req.query.platform === 'darwin') ? 'darwin' : 'windows'

    url2app(url, platform, (file) => {
      // console.log(file)
      res.download(file)
    })
  })
}

function test () {
  url2app('https://qiita.com/taiyoslime/items/98be154455e76710df9d', 'darwin', (file) => {console.log(file)})
}

emptyTmp(() => {
  upServer()
})
