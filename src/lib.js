
var pkg       = require("../package.json")
var core      = require("./core.js")
var path      = require("path")
var express   = require("express")
var fse       = require("fs-extra")

module.exports = core()(Object.assign(pkg, {
  boilerplate: path.resolve(__dirname, "../boilerplate")//,
  // compile: function(props, addCompilers){
  //   addCompilers([fse.copy])
  // }
}))
