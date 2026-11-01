const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

http.createServer((req, res)=>{
    if (req.url!=='/' && req.url!=='/index.html') {
        res.writeHead(404).end()
        return
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(fs.readFileSync(path.join(__dirname, '..', 'index.html')))
}).listen(8764, '127.0.0.1')
