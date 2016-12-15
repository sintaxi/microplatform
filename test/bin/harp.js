
var microplatform = require("../../")

module.exports = microplatform({
  name: "Harp",
  domain: "harp.sh",
  cmd: "harp",
  version: "1.0.0",
  boilerplates: __dirname + "/../boilerplates"
})
