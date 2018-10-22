
var pkg       = require("../package.json")
var core      = require("./core.js")
var path      = require("path")
var express   = require("express")
var fse       = require("fs-extra")
var contents  = "<h1>foobar</h1>"

module.exports = core()(Object.assign(pkg, {
  boilerplate: path.resolve(__dirname, "../boilerplate"),

  serve: function(props, addMiddleware){
    
    addMiddleware([
      function(req, rsp, next){
        if (["/foo.html", "/foo"].indexOf(req.url) === -1 ) return next()
        rsp.send(contents)
      }

      

      //express.static(props.argv["_"][0])
    ])
  },

  compile: function(props, addCompilers){
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
