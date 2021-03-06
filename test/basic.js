
var microplatform = require("../")
var should = require("should")
var path = require("path")
var url = require("url")
var request = require("superagent")
var fse = require("fs-extra")

describe("basic", function(){

  var contents = "<h1>foobar</h1>"

  before(function(done){
    
    var platform = microplatform({
      serve: function(props, addMiddleware){
        addMiddleware([
          function(req, rsp, next){
            if (["/foo.html", "/foo"].indexOf(req.url) === -1 ) return next()
            rsp.send(contents)
          }
        ])
      },

      compile: function(props, addCompilers){
        addCompilers([
          function(publ, dist, next){
            var fileName = path.resolve(dist + "/foo.html")
            fse.writeFile(fileName, contents, function(err){
              next()
            })
          }
        ])
      }
    })

    platform.exec("test/temp/foo test/temp/_foo", function(err){
      platform.exec("test/temp/foo --port 9000", function(err){
        done()
      })
    })
  })

  var check = function(web, file, status, done){
    var webPath = url.resolve("http://localhost:9000", web)
    //var filePath = path.normalize(__dirname + "/temp/foo" + file)
    var compilefilePath = path.normalize(__dirname + "/temp/_foo" +  file)
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

  it("should return root", function(done){
    check("/", "/index.html", 200, done)
  })

  it("should return index.html file", function(done){
    check("/index.html", "/index.html", 200, done)
  })

  // it("should return foo.html file", function(done){
  //   check("/foo", "/foo.html", 200, done)
  // })

  after(function(done){
    fse.remove(__dirname + "/temp",function(){
      done()
    })
  })

})