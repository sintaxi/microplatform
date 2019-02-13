
var microplatform = require("../")
var should = require("should")
var path = require("path")
var url = require("url")
var request = require("superagent")
var fse = require("fs-extra")

describe("simple", function(){

  var contents = "<h1>foobar</h1>"

  before(function(done){
    
    var platform = microplatform()

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

    platform.exec("test/temp/props test/temp/_props", function(err){
      platform.exec("test/temp/props --port 9003", function(err){
        done()
      })
    })
  })

  var check = function(web, file, status, done){
    var webPath = url.resolve("http://localhost:9003", web)
    //var filePath = path.normalize(__dirname + "/temp/foo" + file)
    var compilefilePath = path.normalize(__dirname + "/temp/_props" +  file)
    request.get(webPath).end(function(err, res){
      try {
        var compilefileContents = fse.readFileSync(compilefilePath).toString()
      } catch(e) { var compilefileContents = null; }
      should.exist(res.text)
      res.text.should.be.exactly(compilefileContents)
      res.status.should.be.equal(status)
      done(compilefileContents)
    })  
  }
  
  it("should have access to properties", function(done){
    var properties = microplatform.settings()
    properties.should.have.property("version")
    properties.should.have.property("name", "microplatform")
    done()
  })

  it("should return root", function(done){
    check("/props.json", "/props.json", 200, function(contents){
      var obj = JSON.parse(contents)
      obj.should.have.property("file")
      // obj.should.have.property("filePath")
      // obj.should.have.property("projectPath")
      // obj.should.have.property("publicPath")
      done()
    })
  })

  after(function(done){
    fse.remove(__dirname + "/temp",function(){
      done()
    })
  })

})