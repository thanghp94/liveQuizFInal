const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>Test Server Working!</h1>');
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Test server running on port 8080');
  console.log('Try accessing:');
  console.log('- http://localhost:8080');
  console.log('- http://127.0.0.1:8080');
  console.log('- http://192.168.31.156:8080');
  console.log('- http://192.168.31.168:8080');
});