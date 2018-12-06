
var helpers = require("./helpers.js")
var path    = require("path")
var debug   = require("debug")("microplatform:project")
var fs      = require("fs")

/**

    project({
      argv: argv,
      glob: "*",
      virtuals: [],
      middleware: []
    }, function(errors, list){
      console.log([])
    })

**/

module.exports = function(args, callback){
  var list = {}
  var projectPath = args.argv._[0]
  var projectAbsolutePath = path.resolve(projectPath)

  //debug output
  debug("projectAbsolutePath", projectAbsolutePath)

  helpers.ls(projectAbsolutePath, function(err, items){
    
    // static files
    for (var item in items)(function(item){
      var key = "/" + items[item]
      list[key] = function(cb){
        fs.readFile(path.resolve(projectAbsolutePath, items[item]), function(e, c){
          if (e) return cb(e)
          return cb(null, c.toString())
        })
      }
    })(item)
    // TODO: VirtualFiles

    // done
    debug(Object.keys(list))
    return callback(null, list)
  })

  
}