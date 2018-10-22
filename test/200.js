
var microplatform = require("../")
var should = require("should")
var path = require("path")
var url = require("url")
var request = require("superagent")
var fse = require("fs-extra")

describe("200 fallback", function(){

  before(function(done){
    var platform = microplatform({})
    
    // platform.file("/200.html", function(props, rsp){
    //   rsp("hello fallback")
    // })

    platform.exec("test/projects/200test test/temp/_200test", function(err){
      platform.exec("test/projects/200test --port 9002", function(err){
        done()
      })
    })
  })

  var check = function(web, file, status, done){
    var webPath = url.resolve("http://localhost:9002", web)
    var compilefilePath = path.normalize(__dirname + "/temp/_200test" +  file)
    request.get(webPath).end(function(err, res){
      try {
        var compilefileContents = fse.readFileSync(compilefilePath).toString()
      } catch(e) { var compilefileContents = null; }
      should.exist(res.text)
      res.text.should.be.exactly(compilefileContents)
      res.status.should.be.equal(status)
      done()
    })  
  }
  
  it("should have access to properties", function(done){
    var properties = microplatform.settings()
    properties.should.have.property("version")
    properties.should.have.property("name", "microplatform")
    done()
  })

  it("should return / root", function(done){
    check("/", "/200.html", 200, done)
  })

  it("should return /200.html file", function(done){
    check("/200.html", "/200.html", 200, done)
  })

  it("should return /whatever file", function(done){
    check("/whatever", "/200.html", 200, done)
  })

  after(function(done){
    fse.remove(__dirname + "/temp",function(){
      done()
    })
  })

})