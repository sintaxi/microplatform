
var chalk     = require("chalk")
var path      = require("path")
var syncexec  = require("sync-exec")
var debug     = require("debug")
var fs        = require("fs")
var log       = debug("micrplatform:helpers")

exports.ls = fs.readdir

exports.help = function(config){
  var versiontxt = ''
  if (config.version){
    versiontxt = chalk.grey("v" + config.version)
  }
  console.log()
  console.log(chalk.grey("  "+ config.name +" "+ versiontxt) + " / ".grey + chalk.underline.grey(config.platform))
  console.log(chalk.grey("  "+ config.description))
  console.log()
  console.log(chalk.grey("  Usage:"))
  console.log("    "+ config.name +" <source>             Starts dev server on <source> directory")
  console.log("    "+ config.name +" <source> <domain>    Publishes <source> directory to the web at <domain>")
  console.log("    "+ config.name +" <source> <output>    Compiles <source> into <output>")
  console.log()
  console.log(chalk.grey("  Global Commands:"))
  console.log("    "+ config.name +" list                 List all projects")
  console.log("    "+ config.name +" whoami               Show authenticated user")
  console.log("    "+ config.name +" plan                 Upgrade/downgrade surge account")
  console.log("    "+ config.name +" login                Authenticate and begin session")
  console.log("    "+ config.name +" logout               Terminate session")
  console.log("    "+ config.name +" help                 This help message")
  console.log()
  console.log(chalk.grey("  Project Commands:"))
  console.log("    "+ config.name +" teardown <domain>    Removes <domain> from the web")
  console.log()
  console.log(chalk.grey("  Examples:"))
  console.log("    "+ config.name +" .                    Serves current dir on port 9966")
  console.log("    "+ config.name +" . example.com        Publishes current dir to 'example.com'")
  console.log("    "+ config.name +" . www                Compiles current dir to 'www' directory")
  console.log("    "+ config.name +" . _                  Publishes and generates sub domain")
  console.log()
  console.log(chalk.grey("  please visit ") + chalk.underline.grey(config.platform) + chalk.grey(" for more information"))
  console.log()
  return process.exit()
}


exports.quickhelp = function(config){
  var versiontxt = ''
  if (config.version){
    versiontxt = chalk.grey("v" + config.version)
  }
  console.log()
  console.log(chalk.grey("  "+ config.name +" "+ versiontxt) + " / ".grey + chalk.underline.grey(config.platform))
  console.log(chalk.grey("  "+ config.description))
  console.log()
  console.log(chalk.grey("  Usage: "))
  console.log("    " + config.name +" <project> [domain]")
  console.log()
  console.log(chalk.grey("  Examples:"))
  console.log("    "+ config.name +" ./                    Serves current dir on port 9966")
  console.log("    "+ config.name +" ./ example.com        Publishes current dir to 'example.com'")
  console.log("    "+ config.name +" help                  Displays more info")
  console.log()
  return process.exit()
}


exports.isDomain = function(destination){
  log("isDomain", destination)
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


exports.installSync = function(argv){
  log("installSync")
  var projectPath = argv._[0]
  var projectAbsolutePath = path.resolve(projectPath)
  var command = `cd ${projectAbsolutePath}; npm install`
  try{ 
    var pkg = require(projectAbsolutePath + "/package.json")
    console.log("   " + "Installing dependencies: ".grey + chalk.grey.underline("npm install"))
    console.log()
    syncexec(command, { stdio: [0, 1, 2] })
  }catch(r){
    console.log("   " + ("Not Found: " + projectPath + "/package.json").grey)
  }
}


exports.sift = function(record, stack, callback){
  log("sift")
  if(!stack) stack = []
  
  var that  = this;
  var index = 0;
  
  function next(record){
    var layer = stack[index++]
    if(!layer) return callback(record)
    layer.call(that, record, next)
  }
  
  next(record)
}


exports.runCompilers = function(argv, compilers, callback){
  log("runCompilers")
  if (compilers.length === 0) return callback()
  var total = compilers.length
  var count = 0
  var stack = []

  var sourceDir = argv["_"][0]
  var destDir = argv["_"][1]

  delete argv["_"]

  compilers.forEach(function(cluster){
    cluster({
      root: sourceDir
    }, function(fns){
      count++
      stack = stack.concat(fns)
      if (count == total){
        var that = this
        var index = 0

        function next(){
          var layer = stack[index++]
          if(!layer) return callback()
          layer.call(that, sourceDir, destDir, next)
        }
        next()
      }
    })
  })

}