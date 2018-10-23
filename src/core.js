
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
var helpers   = require('./helpers')


var microplatform = function(mstr){
  if (!mstr) mstr = {}

  if (!mstr.hasOwnProperty("servers"))
    mstr.servers = []

  if (!mstr.hasOwnProperty("compilers"))
    mstr.compilers = []

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
    
    var obj = microplatform(mstr)

    var platform = surge({
      name: mstr.name,
      platform: mstr.platform
    }) 

    obj.init = mstr.init || function(argv, done){
      if (mstr.boilerplates){
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
        fse.copy(path.join(mstr.boilerplate), argv["_"][0], function(){
          console.log("   Project generated".grey, chalk.grey.underline(argv["_"][0]))
          return done(argv)
        })
      }else{
        fse.writeFile(argv._[0] + "/index.html", "<!doctype html><h1>hello world</h1>", function(err){
          return done(argv)
        })  
      }
    }

    //obj.compile = mstr.compile || fse.copy
    obj.server  = mstr.server  || []

    var findOrCreateProject = function(argv, callback){
      var projectPath = argv._[0]
      var projectAbsolutePath = path.resolve(projectPath)
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
      if (argv._.length > 1) {
        var destination = argv._[1]
        if (helpers.isDomain(destination)){
          var domain = destination
          tmp.dir(function(err, tmpPath, cleanupCallback) {
            if (err) throw err
            //console.log("    compiling and publishing to", chalk.green(destination))              
            obj.compile(argv["_"][0], tmpPath, function(err){
              if (err) throw err

              argv["_"][0] = tmpPath
              platform.publish({
                postPublish: function(req, next){
                  fse.remove(tmpPath)
                  return next()
                }
              })(argv)
            })
          })
        } else {
          prompt = "Compiling to: ".grey + chalk.grey.underline(argv["_"][1])
          console.log("   " + prompt)
          helpers.runCompilers({ argv: argv }, mstr.compilers, callback)
        }
      }
    }

    obj.settings = function(){
      return mstr
    }

    obj.file = function(filePath, args, done){
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
      mstr.compilers.push(function(props, addCompilers){  
        addCompilers([
          function(publ, dist, next){
            var fileName = path.resolve(dist + filePath)
            
            var r = function(cont){
              fse.writeFile(fileName, cont, function(err){
                next()
              })
            }
            r.send = r
            done(props, r)
          }
        ])
      })

      return obj
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

              //mstr.servers.push(defaultMiddleware)
              //mstr.servers = mstr.servers.concat(defaultMiddleware)

              // fallback if none exist
              if (mstr.servers.length === 0){
                mstr.servers = function(cli, addMiddleware){
                  addMiddleware([function(req, rsp, next){ return next(); }])
                }
              }

              var total = mstr.servers.length
              var count = 0
              var all   = []
              var that = this
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


                    // look for virtual files first.
                    app.use(function(req, rsp, next){
                      var fn = mstr.virtualFiles[req.url] || mstr.virtualFiles[req.url + ".html"] || null
                      // return object
                      var r = function(cont){ rsp.send(cont); }
                      r.send = r
                      r.json = function(cont){ rsp.json(cont); }
                      // use if virtual file exists
                      if (fn) return fn({ argv: argv }, r)
                      return next()
                    })


                    // static middleare goes here
                    app.use(express.static(argv["_"][0]))


                    // look for virtual 200 file.
                    app.use(function(req, rsp, next){
                      var fn = mstr.virtualFiles["/200.html"] || null
                      // return object
                      var r = function(cont){ rsp.send(cont); }
                      r.send = r
                      r.json = function(cont){ rsp.json(cont); }
                      // use if virtual file exists
                      if (fn) return fn({ argv: argv }, r)
                      return next()
                    })


                    // fallback 200 file
                    app.use(function(req, rsp, next){
                      fse.readFile(path.resolve(argv["_"][0], "200.html"), function(err, contents){
                        if(contents){
                          var body    = contents.toString()
                          var type    = mime.getType("html")
                          var charset = 'UTF-8'
                          rsp.setHeader('Content-Type', 'text/html' + (charset ? '; charset=' + charset : ''))
                          rsp.setHeader('Content-Length', Buffer.byteLength(body, charset));
                          rsp.statusCode = 200
                          rsp.end(body)
                        }else{
                          next()
                        }
                      })
                    })


                    // look for virtual 404 file.
                    app.use(function(req, rsp, next){
                      var fn = mstr.virtualFiles["/404.html"] || null
                      // return object
                      var r = function(cont){ rsp.send(cont); }
                      r.send = r
                      r.json = function(cont){ rsp.json(cont); }
                      // use if virtual file exists
                      if (fn) return fn({ argv: argv }, r)
                      return next()
                    })


                    // fallback 404 file
                    app.use(function(req, rsp, next){
                      fse.readFile(path.resolve(argv["_"][0], "404.html"), function(err, contents){
                        if(contents){
                          var body    = contents.toString()
                          var charset = 'UTF-8'
                          rsp.setHeader('Content-Type', 'text/html' + (charset ? '; charset=' + charset : ''))
                          rsp.setHeader('Content-Length', Buffer.byteLength(body, charset));
                          rsp.statusCode = 200
                          rsp.end(body)
                        }else{
                          next()
                        }
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
