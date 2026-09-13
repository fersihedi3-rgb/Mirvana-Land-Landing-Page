/* Tiny static server for local preview.
   Byte-range support is not optional here: without 206 responses the
   browser marks the hero video non-seekable (video.seekable.end(0)
   returns 0) and the scroll scrub silently does nothing. */
const http = require('http'), fs = require('fs'), p = require('path');

const root = process.argv[2] || '.', port = +process.argv[3] || 8099;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let file = p.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (file.endsWith(p.sep) || req.url.split('?')[0] === '/') file = p.join(file, 'index.html');

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('404 ' + req.url); }

    const type = MIME[p.extname(file).toLowerCase()] || 'application/octet-stream';
    const base = {
      'Content-Type': type,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    };

    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (m) {
        let start = m[1] === '' ? null : parseInt(m[1], 10);
        let end = m[2] === '' ? null : parseInt(m[2], 10);
        if (start === null && end !== null) {            // suffix range
          start = Math.max(0, stat.size - end); end = stat.size - 1;
        } else {
          if (start === null) start = 0;
          if (end === null || end >= stat.size) end = stat.size - 1;
        }
        if (start > end || start >= stat.size) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + stat.size });
          return res.end();
        }
        res.writeHead(206, Object.assign({}, base, {
          'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
          'Content-Length': end - start + 1
        }));
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
    }

    res.writeHead(200, Object.assign({}, base, { 'Content-Length': stat.size }));
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, () => console.log('serving ' + p.resolve(root) + ' on http://127.0.0.1:' + port));
