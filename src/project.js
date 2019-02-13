
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
  var statics = {}

  var projectPath = args.argv._[0]
  var projectAbsolutePath = path.resolve(projectPath)

  //debug output
  debug("projectAbsolutePath", projectAbsolutePath)
  debug("virtuals", Object.keys(args.virtuals))

  helpers.ls(projectAbsolutePath, function(err, items){
    
    // static files
    for (var item in items)(function(item){
      var key = "/" + items[item]
      statics[key] = function(cb){
        fs.readFile(path.resolve(projectAbsolutePath, items[item]), function(e, c){
          if (e) return cb(e)
          return cb(null, c.toString())
        })
      }
    })(item)

    // borrow
    for(var i in statics)(function(i){
      list[i] = statics[i]
    })(i)
    

    // virtuals

    for (var item in args.virtuals)(function(item){

      list[item] = function(cb){
        
        if (statics[item]){
          statics[item](function(err, contents){
            var req = {
              file: item,
              text: contents,
              list: list
            }
            var rsp = function(cont){
              cb(null, cont)
            }; rsp.send = rsp

            return args.virtuals[item](req, rsp)
          })
        } else {
          var req = { 
            file: item,
            text: null,
            list: list
          }
          var rsp = function(cont){
            cb(null, cont)
          }; rsp.send = rsp
          return args.virtuals[item](req, rsp)
        }

        
      }

    })(item)

    // done
    debug(Object.keys(list))
    return callback(null, list)
  })

  
}