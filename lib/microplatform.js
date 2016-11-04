
var path      = require("path")
var pkg       = require("../package.json")
var surge     = require("surge")
var chalk     = require("chalk")
var minimist  = require("minimist")
var read      = require("read")
var fse       = require("fs-extra")
var tmp       = require("tmp")
var express   = require("express")

module.exports = function(config){

  var domain   = config.domain  || "surge.sh"
  var cmd      = config.cmd     || domain.split(".")[0]
  var name     = config.name    || cmd + " Platform"

  var platform = surge({
    name:   name,
    domain: domain
  })

  var help = function(){
    console.log()
    console.log(chalk.bold("  "+ name +" " +chalk.grey("v" + pkg.version)) + chalk.grey(" - powered by surge.sh "))
    console.log(chalk.grey("  dev server & web publishing to"), chalk.underline.green(domain))
    console.log()
    console.log(chalk.grey("  Usage:"))
    console.log("    "+ cmd +" <source>             Starts dev server on <source> directory")
    console.log("    "+ cmd +" <source> <domain>    Publishes <source> directory to the web at <domain>")
    console.log("    "+ cmd +" <source> <output>    Compiles <source> into <output>")
    console.log()
    console.log(chalk.grey("  Additional Usage:"))
    console.log("    "+ cmd +" <source> _           Prompt for publishing to random _." + domain, "subdomain")
    console.log("    "+ cmd +" teardown <domain>    Removes <domain> from the web")
    console.log("    "+ cmd +" <cmd>                Where <cmd> is one of: list, login, logout, or whoami")
    console.log()
    console.log(chalk.grey("  Examples:"))
    console.log("    "+ cmd +" .                    Serves current dir on port 9966")
    console.log("    "+ cmd +" . example.com        Publishes current dir to 'example.com'")
    console.log("    "+ cmd +" . www                Compiles current dir to 'www' directory")
    console.log()
    console.log(chalk.grey("  please visit ") + chalk.underline.green(domain) + chalk.grey(" for more information"))
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


  var init = config.init || function(argv, done){
    if (config.default){
      fse.copy(config.default, argv._[0], function(err){
        if (err) console.log(err)
        return done(argv)
      })
    }else{
      fse.writeFile(argv._[0] + "/index.html", "<!doctype html><h1>hello world</h1>", function(err){
        console.log("      created", argv._[0])
        return done(argv)
      })  
    }
  }

  var compile = config.compile || function(argv, done){
    fse.copy(argv["_"][0], argv["_"][1], function(){
      return done(argv)
    })
  }

  var server = config.server || function(argv, done){
    var port = process.env.PORT || argv.p || argv.port || 9000
    var app = express()
    app.use(express.static(argv["_"][0]))
    app.listen(port, function(){
      console.log("    Server running at " + chalk.underline(chalk.green("http://localhost:" + port)))
      console.log()
      return done(argv)
    })
  }


  var findOrCreateProject = function(argv, callback){
    var projectPath = argv._[0]
    var projectAbsolutePath = path.resolve(projectPath)
    fse.readdir(projectAbsolutePath, function(err, contents){
      var prompt;
      if (err)
        prompt = "Creating " + chalk.green(projectPath)
      if (contents && contents.length < 1)
        prompt = "Polulating " + chalk.green(projectPath)

      if (prompt) {
        console.log("    " + prompt)
        fse.mkdirp(projectAbsolutePath,function(){
          init(argv, function(){
            return callback(argv)
          })
        })
      } else {
        prompt = "Found " + chalk.green(projectPath)
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
          compile(argv, function(argv){
            
            var args = [tmpPath]
            argv["_"][1] = destination
            
            if (argv["_"][1] !== "_"){
              args.push(destination)
            }else{}

            console.log("    Publishing via surge...")
            platform.publish({
              postPublish: function(req, next){
                fse.remove(tmpPath)
                next()
              }
            })({ "_": args })
          })
        })
      } else {
        compile(argv, callback)
      }
    }
  }

  
  return function(arg){
    var full = process.argv.slice()
    var argv = minimist(full.slice(2))
    var cmds = argv["_"]

    if (cmds.length < 1) return help()
      
    var hooks = {}
    if(cmds[0] === "whoami") {
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
          compileOrPublish(argv, function(argv){})
        } else {
          return server(argv, new Function)
        }
      })
    }
  }

}

// process.on('SIGINT', function() {
//   console.log("\n")
//   global.ponr == true
//     ? console.log("    Disconnected".green, "-", "Past point of no return, completing in background.")
//     : console.log("    Cancelled".yellow, "-", "Upload aborted, publish not initiated.")
//   console.log()
//   process.exit(1)
// })
