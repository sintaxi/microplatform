
var pkg       = require("../package.json")
var core      = require("./core.js")
var path      = require("path")
var express   = require("express")
var fse       = require("fs-extra")
var contents  = "<h1>foobar</h1>"

module.exports = core()(Object.assign(pkg, {
  boilerplate: path.resolve(__dirname, "../boilerplate"),

  serve: function(cliProperties, addMiddleware){
    
    addMiddleware([
      function(req, rsp, next){
        if (["/foo.html", "/foo"].indexOf(req.url) === -1 ) return next()
        rsp.send(contents)
      },

      function(req, rsp, next){
        if (["/bar.html", "/bar"].indexOf(req.url) === -1 ) return next()
        rsp.send(contents)
      },

      express.static(cliProperties.argv["_"][0])
    ])
  },

  compile: function(cliProperties, addCompilers){
    addCompilers([
      fse.copy,
      function(publ, dist, next){
        var fileName = path.resolve(dist + "/foo.html")
        fse.writeFile(fileName, contents, function(err){
          next()
        })
      },
      function(publ, dist, next){
        var fileName = path.resolve(dist + "/bar.html")
        fse.writeFile(fileName, contents, function(err){
          next()
        })
      }
    ])
  }

}))
