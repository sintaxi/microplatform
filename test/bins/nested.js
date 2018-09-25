

var microplatform = require("../../")

middleware = [
  
  function setGlobals (project, next) {
    req.globals = globals
    next()
  },

  function outputPlatform1 (project, next) {
    console.log("platform1")
    next()
  },

]

var platform1 = microplatform({
  
  serve: function(project, server){
    server(middleware)
  }

  compile: function(project, compiler){
    compiler(compilers)
  }

})

var platform2 = platform1({
  
  server: function(globals){
    return [

      function outputPlatform2 (req, rsp, next) {
        console.log("platform2")
        next()
      },

      function outputGlobals (req, rsp, next) {
        console.log(req.globals)
        next()
      },

    ]
  }

})

module.exports = platform2({

  server: function(globals){
    return [
      function setGlobals (req, rsp, next) {
        console.log("hello platform!")
        next()
      }
    ]
  }

})

