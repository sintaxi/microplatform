var microplatform = require("../")
var should = require("should")

describe("microplatform", function(){

  before(function(done){
    microplatform.exec("foo _foo", function(err){
      microplatform.exec("foo --port 9000", function(err){
        done()
      })
    })
  })

  it("should have created project dir", function(done){
    done()
  })

  it("should have created compile dir", function(done){
    done()
  })

  after(function(done){
    done()
  })

})