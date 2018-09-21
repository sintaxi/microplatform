

var microplatform = require("../../")

var platform1 = microplatform({
  
  server: function(globals){
    return [
      
      function setGlobals (req, rsp, next) {
        req.globals = globals
        next()
      },

      function outputPlatform1 (req, rsp, next) {
        console.log("platform1")
        next()
      },

    ]
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

