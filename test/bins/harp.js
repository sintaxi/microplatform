
var microplatform = require("../../")

module.exports = microplatform({
  name: "harp",
  domain: "harp.sh",
  cmd: "harp",
  version: "1.0.0",
  boilerplates: __dirname + "/../boilerplates",


  server: function(globals){
    return [
      function setGlobals (req, rsp, next) {
        req.globals = globals
        next()
      }
    ]
  },

  compile: function(globals){
    return [
      function copyFiles (locals, next) {
        fs.copy(globals.glob, project.publicPath, project.tmpPath, function(){
          next()
        })
      }
    ]
  }

})
