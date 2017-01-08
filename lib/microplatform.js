
var path      = require("path")
var pkg       = require("../package.json")
var surge     = require("surge")
var chalk     = require("chalk")
var minimist  = require("minimist")
var read      = require("read")
var fse       = require("fs-extra")
var tmp       = require("tmp")
var express   = require("express")

var inquirer    = require('inquirer')
var choices = require("choices")
var Menu = require('terminal-menu')

var microplatform = function(mstr){
  if (!mstr) mstr = {}
  
  return function(config){
    for (var attr in config) { mstr[attr] = config[attr] }
    
    var obj = microplatform(mstr)

    var platform = surge({
      name: mstr.name,
      platform: mstr.platform
    })

    var help = function(){

      var versiontxt = ''

      if (mstr.version){
        versiontxt = chalk.green("v" + mstr.version)
      }

      console.log()
      console.log(chalk.bold("  "+ mstr.name +" "+versiontxt))
      console.log(chalk.grey("  dev server & web publishing to"), chalk.underline.green(mstr.platform), chalk.grey("(powered by surge)"))
      console.log()
      console.log(chalk.grey("  Usage:"))
      console.log("    "+ mstr.cmd +" <source>             Starts dev server on <source> directory")
      console.log("    "+ mstr.cmd +" <source> <domain>    Publishes <source> directory to the web at <domain>")
      console.log("    "+ mstr.cmd +" <source> <output>    Compiles <source> into <output>")
      console.log()
      console.log(chalk.grey("  Global Commands:"))
      console.log("    "+ mstr.cmd +" list                 List all projects")
      console.log("    "+ mstr.cmd +" whoami               Show authenticated user")
      console.log("    "+ mstr.cmd +" login                Authenticate and begin session")
      console.log("    "+ mstr.cmd +" logout               Terminate session")
      console.log("    "+ mstr.cmd +" help                 This help message")
      console.log()
      console.log(chalk.grey("  Project Commands:"))
      console.log("    "+ mstr.cmd +" teardown <domain>    Removes <domain> from the web")
      console.log()
      console.log(chalk.grey("  Examples:"))
      console.log("    "+ mstr.cmd +" .                    Serves current dir on port 9966")
      console.log("    "+ mstr.cmd +" . example.com        Publishes current dir to 'example.com'")
      console.log("    "+ mstr.cmd +" . www                Compiles current dir to 'www' directory")
      console.log()
      console.log(chalk.grey("  please visit ") + chalk.underline.green(mstr.platform) + chalk.grey(" for more information"))
      console.log()
      return process.exit()
    }

    var quickhelp = function(){
      console.log()
      console.log("  "+ mstr.name + " – " + chalk.underline.green("https://" + mstr.platform))
      console.log()
      console.log(chalk.grey("  Usage: "))
      console.log("    " + mstr.cmd +" <project> [domain]")
      console.log()
      console.log(chalk.grey("  Examples:"))
      console.log("    "+ mstr.cmd +" ./                    Serves current dir on port 9966")
      console.log("    "+ mstr.cmd +" ./ example.com        Publishes current dir to 'example.com'")
      console.log("    "+ mstr.cmd +" help                  Displays more info")
      console.log()
      return process.exit()
    }

    var isDomain = function(destination){
      if (destination == "_"){
        return true
      }
      if (destination.indexOf("./") === 0){
        return false
      }
      if (destination.split(".").length > 1){
        return true
      }
      return false
    } 

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
                console.log("    generated", chalk.green(argv["_"][0]))
                return done(argv)
              })
            })  
          } else if (dirs.length == 1) {
            fse.copy(path.join(mstr.boilerplates, dirs[0]), argv["_"][0], function(){
              console.log("    generated", chalk.green(argv["_"][0]))
              return done(argv)
            })
          } else {
            fse.writeFile(argv._[0] + "/index.html", "<!doctype html><h1>hello world</h1>", function(err){
              return done(argv)
            })
          }
        })

      }else{
        fse.writeFile(argv._[0] + "/index.html", "<!doctype html><h1>hello world</h1>", function(err){
          return done(argv)
        })  
      }
    }

    obj.compile = mstr.compile || function(argv, done){
      fse.copy(argv["_"][0], argv["_"][1], function(){
        return done(argv)
      })
    }

    obj.server = mstr.server || function(argv, done){
      var port = process.env.PORT || argv.p || argv.port || 9000
      var app = express()
      app.use(express.static(argv["_"][0]))
      app.listen(port, function(){
        console.log("    server running at " + chalk.underline(chalk.green("http://localhost:" + port)))
        console.log()
        return done(argv)
      })
    }

    var findOrCreateProject = function(argv, callback){
      var projectPath = argv._[0]
      var projectAbsolutePath = path.resolve(projectPath)
      // check project to see if it exists or is empty
      fse.readdir(projectAbsolutePath, function(err, contents){
        if (err || (contents && contents.length < 1)) {
          fse.mkdirp(projectAbsolutePath,function(){
            obj.init(argv, function(){
              return callback(argv)
            })
          })
        } else {
          prompt = "project " + chalk.green(projectPath)
          console.log("    " + prompt)
          return callback(argv)
        }
      })
    }


    var compileOrPublish = function(argv, callback){
      if (argv._.length > 1) {
        var destination = argv._[1]
        if (isDomain(destination)){
          var domain = destination
          tmp.dir(function(err, tmpPath, cleanupCallback) {
            if (err) throw err
            argv._[1] = tmpPath
            obj.compile(argv, function(argv){
              
              var args = [tmpPath]
              argv["_"][1] = destination
              
              if (argv["_"][1] !== "_"){
                args.push(destination)
              }else{}

              console.log("    compiling and publishing to", chalk.green(destination))
              platform.publish({
                postPublish: function(req, next){
                  fse.remove(tmpPath)
                  next()
                }
              })({ "_": args })
            })
          })
        } else {
          console.log("    Compiling to", chalk.green(argv["_"][1]) )
          obj.compile(argv, callback)
        }
      }
    }



    obj.exec = function(arg){
      var full = process.argv.slice()
      var argv = minimist(full.slice(2))
      var cmds = argv["_"]

      if (cmds.length < 1) return quickhelp()
        
      var hooks = {}
      if(cmds[0] === "help") {
        return help()
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
          if (argv._.length > 1){
            compileOrPublish(argv, function(argv){
              console.log()
            })
          } else {
            return obj.server(argv, new Function)
          }
        })
      }
    }

    return  obj
  }
}

module.exports = microplatform()({
  platform: "surge.sh",
  cmd: "mp",
  name: "MicroPlatform",
  version: pkg.version
})
