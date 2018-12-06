
var microplatform = require("../")
var should = require("should")
var path = require("path")
var url = require("url")
var request = require("superagent")
var fse = require("fs-extra")

describe("microplatform", function(){

  var contents = "<h1>foobar</h1>"

  before(function(done){
    
    var platform = microplatform({
      boilerplate: __dirname + "/projects/staticy"
    })

    // platform.before(function(props, next){
    //   platform.listFiles()
    //   props.cool = true
    //   next(props)
    // })

    platform.file("/props.json", function(req, rsp){
      var obj = {
        projectPath: req.projectPath,
        publicPath: req.publicPath,
        filePath: req.filePath,
        file: req.file
      }
      rsp.send(JSON.stringify(obj, null, 2))
    })

    platform.exec("test/temp/staticy test/temp/_staticy", function(err){
      platform.exec("test/temp/staticy --port 9004", function(err){
        done()
      })
    })
  })

  var check = function(web, file, status, done){
    var webPath = url.resolve("http://localhost:9004", web)
    //var filePath = path.normalize(__dirname + "/temp/foo" + file)
    var compilefilePath = path.normalize(__dirname + "/temp/_staticy" +  file)
    request.get(webPath).end(function(err, res){
      try {
        var compilefileContents = fse.readFileSync(compilefilePath).toString()
      } catch(e) { var compilefileContents = null; }
      should.exist(res.text)
      res.status.should.be.equal(status)
      res.text.should.be.exactly(compilefileContents)
      done(compilefileContents)
    })  
  }

  it("should return root", function(done){
    check("/index.html", "/index.html", 200, function(contents){
      done()
    })
  })

  it("should return root", function(done){
    check("/", "/index.html", 200, function(contents){
      done()
    })
  })

  // after(function(done){
  //   fse.remove(__dirname + "/temp",function(){
  //     done()
  //   })
  // })

})