
var path      = require("path")
var pkg       = require("../package.json")
var surge     = require("surge")
var chalk     = require("chalk")
var minimist  = require("minimist")
var read      = require("read")
var fse       = require("fs-extra")
var tmp       = require("tmp")
var express   = require("express")
var syncexec  = require("sync-exec")
var inquirer  = require('inquirer')
var choices   = require("choices")
var Menu      = require('terminal-menu')
var helpers   = require('./helpers.js')
var debug     = require("debug")
var project   = require("./project.js")
var fs        = require("fs")

var microplatform = function(mstr){
  if (!mstr) mstr = {}

  if (!mstr.hasOwnProperty("servers"))
    mstr.servers = []

  if (!mstr.hasOwnProperty("compilers"))
    mstr.compilers = []

  if (!mstr.hasOwnProperty("beforeStack"))
    mstr.beforeStack = []

  if (!mstr.hasOwnProperty("virtualFiles"))
    mstr.virtualFiles = []

  if (!mstr.hasOwnProperty("toolchain"))
    mstr.toolchain = []

  return function(config){
    for (var attr in config) { 
      if (attr == "serve"){
        mstr.servers.push(config[attr])
      }else if (attr == "compile"){
        mstr.compilers.push(config[attr])
      }else{
        mstr[attr] = config[attr]  
      }
    }

    var log = debug("microplatform:" + mstr.name || "unknown")
    var obj = microplatform(mstr)

    log("debugging...")

    var platform = surge({
      name: mstr.name,
      platform: mstr.platform
    }) 

    obj.init = mstr.init || function(argv, done){
      log("init project")
      if (mstr.boilerplates){
        log("boilerplates:", mstr.boilerplates)
        fse.readdir(mstr.boilerplates, function(err, results){
          var dirs = results.filter(function (file) {
            return fse.statSync(path.join(mstr.boilerplates, file)).isDirectory()
          }).map(function(dir){
            //return {  title: dir, value: dir }
            return dir
          })
          if (dirs.length > 1){
            inquirer.prompt({
              type: 'list',
              name: 'boilerplate',
              message: 'please choose boilerplate',
              choices: dirs
            }).then(function(answers) {
              console.log()
              fse.copy(path.join(mstr.boilerplates, answers.boilerplate), argv["_"][0], function(){
                console.log("   Project generated".grey, chalk.grey.underline(argv["_"][0]))
                return done(argv)
              })
            })  
          } else if (dirs.length == 1) {
            fse.copy(path.join(mstr.boilerplates, dirs[0]), argv["_"][0], function(){
              console.log("   Project generated".grey, chalk.grey.underline(argv["_"][0]))
              return done(argv)
            })
          } else {
            fse.writeFile(argv._[0] + "/index.html", "<!doctype html><h1>hello world</h1>", function(err){
              return done(argv)
            })
          }
        })
      }else if (mstr.boilerplate){
        log("boilerplate:", mstr.boilerplates)
        fse.copy(path.join(mstr.boilerplate), argv["_"][0], function(){
          console.log("   Project generated".grey, chalk.grey.underline(argv["_"][0]))
          return done(argv)
        })
      }else{
        log("boilerplate:", "fallback")
        fse.writeFile(argv._[0] + "/index.html", "<!doctype html><h1>hello world</h1>", function(err){
          return done(argv)
        })  
      }
    }

    //obj.compile = mstr.compile || fse.copy
    obj.server  = mstr.server  || []

    var findOrCreateProject = function(argv, callback){
      log("findOrCreateProject")
      var projectPath = argv._[0]
      var projectAbsolutePath = path.resolve(projectPath)
      log("projectAbsolutePath:", projectAbsolutePath)
      // check project to see if it exists or is empty
      fse.readdir(projectAbsolutePath, function(err, contents){
        if (err || (contents && contents.length < 1)) {
          fse.mkdirp(projectAbsolutePath,function(){
            obj.init(argv, callback)
          })
        } else {
          prompt = "Project found: ".grey + chalk.grey.underline(projectPath)
          console.log("   " + prompt)
          return callback(argv)
        }
      })
    }


    var compileOrPublish = function(argv, callback){
      log("compileOrPublish")

      var compile = function(compileAbsolutePath, cb){
        project({ 
          argv: argv,
          virtuals: mstr.virtualFiles,
          glob: mstr.glob || "*"
        }, function(err, list){
          var total = Object.keys(list).length
          var count = 0
          for (var key in list)(function(key){
            var fn = list[key]
            fn(function(err, contents){
              var filePath = path.join(compileAbsolutePath, key)
              fs.writeFile(filePath, contents, 'utf8', function(e){
                count++
                if (count == total) return cb()
              })
            })
          })(key)
        })
      }

      if (argv._.length > 1) {
        var destination = argv._[1]
        if (helpers.isDomain(destination)){
          var domain = destination
          log("publish:", domain)
          tmp.dir(function(err, tmpPath, cleanupCallback) {
            if (err) throw err

            compile(tmpPath, function(){
              argv["_"][0] = tmpPath
              platform.publish({
                postPublish: function(req, next){
                  fse.remove(tmpPath)
                  return next()
                }
              })(argv)
            })
          
            //console.log("    compiling and publishing to", chalk.green(destination))              
            // obj.compile(argv["_"][0], tmpPath, function(err){
            //   if (err) throw err

              
            // })

          })

        } else {
          log("compile:", destination)
          prompt = "Compiling to: ".grey + chalk.grey.underline(destination)
          console.log("   " + prompt)
          log(mstr.compilers)

          //helpers.runCompilers(argv, mstr.compilers, callback)
          
          var compilePath = argv._[1]
          var compileAbsolutePath = path.resolve(compilePath)
          fse.mkdirp(compileAbsolutePath, function(){
            return compile(compileAbsolutePath, callback)  
          })

          // project({ 
          //   argv: argv,
          //   virtuals: mstr.virtualFiles,
          //   glob: mstr.glob || "*"
          // }, function(err, list){
          //   var compilePath = argv._[1]
          //   var compileAbsolutePath = path.resolve(compilePath)
          //   var total = Object.keys(list).length
          //   var count = 0
          //   fse.mkdirp(compileAbsolutePath, function(){
          //     for (var key in list)(function(key){
          //       var fn = list[key]
          //       fn(function(err, contents){
          //         var filePath = path.join(compileAbsolutePath, key)
          //         fs.writeFile(filePath, contents, 'utf8', function(e){
          //           count++
          //           if (count == total) return callback()
          //         })
          //       })
          //     })(key)
          //   })
          // })
          
          
        }
      }
    }

    obj.settings = function(){
      log("settings")
      return mstr
    }

    obj.file = function(filePath, args, done){
      log("file")
      if (!done){
        done = args
        args = {}
      }

      mstr.virtualFiles[filePath] = done

      // add server
      // mstr.servers.push(function(props, addMiddleware){
      //   addMiddleware([function(req, rsp, next){
      //     if ([filePath, filePath.replace(".html", "")].indexOf(req.url) === -1 ) return next()
          
      //     var r = function(cont){
      //       rsp.send(cont)
      //     }

      //     r.send = r
      //     r.json = function(cont){
      //       rsp.json(cont)
      //     }
      //     done(props, r)
      //   }])
      // })

      // add compiler
      // mstr.compilers.push(function(props, addCompilers){  
      //   addCompilers([
      //     function(publ, dist, next){
      //       var fileName = path.resolve(dist + filePath)
            
      //       var rq = function(cont){
      //         fse.writeFile(fileName, cont, function(err){
      //           next()
      //         })
      //       }
      //       rq.file = filePath
      //       rq.send = rq
      //       done(props, rq)
      //     }
      //   ])
      // })

      return obj
    }


    obj.before = function(fn){
      mstr.beforeStack.push(fn)
    }


    obj.exec = function(args, callback){
      if (!callback) callback = new Function

      // we only have a callback
      if (typeof args === 'function'){
        callback = args
        args = null
      }

      // fetch args from process
      if (!args)
        args = process.argv.slice(2)

      // change string args to array
      if (typeof args === 'string')
        args = args.match(/\S+/g) || []

      // change array arguments to minimist object
      var argv = minimist(args)
      var cmds = argv["_"]

      // no aguments we output help message
      if (cmds.length < 1) 
        return helpers.help(mstr)
      
      // may use surg hooks in future API
      var hooks = {}

      // check for reserved command
      if(cmds[0] === "help") {
        return helpers.help(mstr)
      } else if(cmds[0] === "whoami") {
        platform.whoami(hooks)(argv._.slice(1))
      } else if(cmds[0] === "login") {
        platform.login(hooks)(argv._.slice(1))
      } else if(cmds[0] === "logout") {
        platform.logout(hooks)(argv._.slice(1))
      } else if(cmds[0] === "list") {
        platform.list(hooks)(argv._.slice(1))
      } else if(cmds[0] === "teardown") {
        platform.teardown(hooks)(argv._.slice(1))
      } else {
        console.log()

        findOrCreateProject(argv, function(argv){
          helpers.installSync(argv)

          // global

          var listFilesSync = function(){
            return fse.readDirSync(argv["_"][0])
          }


          if (argv._.length > 1){
            compileOrPublish(argv, function(argv){
              console.log()
              return callback()
            })  
          } else {
            var port = process.env.PORT || argv.p || argv.port || 9000
            var app;
            // we get an object that responds to listen (PRIVATE level API)
            if (obj.server.listen){
              app = obj.server
            }else{

              //server = express()

              // // we get an array of middleware (MED level API)
              // if (Array.isArray(obj.server)){
              //   server = express()
                
              // } else {
              //   // we get a function that we pass helpful args into (HIGH level API)
              //   var tmpDir = tmp.dirSync()
              //   middleware = obj.server(argv["_"][0], tmpDir)
              // }

              // mstr.servers.push(defaultMiddleware)
              // mstr.servers = mstr.servers.concat(defaultMiddleware)

              // fallback if none exist
              if (mstr.servers.length === 0){
                mstr.servers.push(function(props, addMiddleware){
                  addMiddleware([function(req, rsp, next){ return next(); }])
                })
              }

              var total = mstr.servers.length
              var count = 0
              var all   = []
              var that = this
              //delete argv["_"]

              mstr.servers.forEach(function(cluster){

                cluster.call(this, { argv: argv }, function(fns){
                  count++
                  all = all.concat(fns)
                  if (count == total){
                    app = express()


                    // custom middleare
                    app.use(function(req, rsp, next){
                      if (req.url === "/"){ req.url = "/index.html" }
                      next()
                    })


                    // custom middleare
                    all.forEach(function(m){
                      app.use(m)
                    })


                    // initialize project
                    app.use(function(req, rsp, next){
                      project({ 
                        argv: argv,
                        virtuals: mstr.virtualFiles,
                        glob: mstr.glob || "*"
                      }, function(err, list){
                        req.list = list
                        return next()
                      })
                    })


                    // /index.html
                    app.use(function(req, rsp, next){
                      if (!req.list[req.url]) return next()
                      req.list[req.url](function(err, contents){
                        var charset = 'UTF-8'
                        rsp.setHeader('Content-Type', 'text/html' + (charset ? '; charset=' + charset : ''))
                        rsp.setHeader('Content-Length', Buffer.byteLength(contents, charset))
                        rsp.status(200).send(contents)
                      })
                    })


                    // /200.html
                    app.use(function(req, rsp, next){
                      if (!req.list["/200.html"]) return next()
                      req.list["/200.html"](function(err, contents){
                        var charset = 'UTF-8'
                        rsp.setHeader('Content-Type', 'text/html' + (charset ? '; charset=' + charset : ''))
                        rsp.setHeader('Content-Length', Buffer.byteLength(contents, charset))
                        rsp.status(200).send(contents)
                      })
                    })


                    // /404.html
                    app.use(function(req, rsp, next){
                      if (!req.list["/404.html"]) return next()
                      req.list["/404.html"](function(err, contents){
                        var charset = 'UTF-8'
                        rsp.setHeader('Content-Type', 'text/html' + (charset ? '; charset=' + charset : ''))
                        rsp.setHeader('Content-Length', Buffer.byteLength(contents, charset))
                        rsp.status(404).send(contents)
                      })
                    })


                    app.listen(port, function(){
                      console.log("   Dev server running ".grey + chalk.underline(chalk.grey("http://localhost:" + port)))
                      console.log()
                      return callback(argv)
                    })

                  }
                })
              })
               
            }

          }
        })
      }
    }

    return obj
  }
}

//pkg.boilerplate = path.resolve(__dirname, "../boilerplate")
module.exports = microplatform()
