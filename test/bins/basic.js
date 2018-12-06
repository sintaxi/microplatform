
var microplatform = require("../../")

var ssg = module.exports = microplatform({
  name: "basic",
  version: "0.17.0",
  boilerplates: __dirname + "/../../boilerplate"
})

ssg.file("/props.json", function(props, done){
  done(JSON.stringify(props, null, 2))
})

ssg.file("/mayo.html", function(props, done){
  done("mayo")
})

ssg.file("/layo.html", function(props, done){
  done("layo")
})

