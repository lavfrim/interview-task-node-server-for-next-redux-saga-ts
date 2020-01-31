var http = require("http");
var fs = require("fs");
var mime = require("mime-types");

var methods = Object.create(null);

http.createServer(function(request, response) {
  function respond(code, body, type) {
    if (!type) type = "text/plain";
    response.writeHead(code, {
        "Content-Type": type || "text/plain",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, OPTIONS, PUT"
    });
    if (body && body.pipe)
      body.pipe(response);
    else
      response.end(body);
  }

  if (request.method in methods)
      methods[request.method](urlToPath(request.url), respond, request);
  else
    respond(405, "Method " + request.method + " not allowed.");
}).listen(8000);

function urlToPath(url) {
  var path = require("url").parse(url).pathname;
  return "." + decodeURIComponent(path);
}

methods.GET = function(path, respond) {
  fs.stat(path, function(error, stats) {
    if (error && error.code == "ENOENT")
      respond(404, "File not found");
    else if (error)
      respond(500, error.toString());
    else if (stats.isDirectory())
      fs.readdir(path, function(error, files) {
        if (error)
          respond(500, error.toString());
        else
          respond(200, files.join("\n"));
      });
    else
      respond(200, fs.createReadStream(path),
        mime.lookup(path));
  });
};

methods.PUT = function(path, respond, request) {
  var outStream = fs.createWriteStream(path);
  outStream.on("error", function(error) {
    respond(500, error.toString());
  });
  outStream.on("finish", function() {
    respond(204);
  });
  request.pipe(outStream);
};

methods.OPTIONS = function(path, respond) {
  respond(200);
}