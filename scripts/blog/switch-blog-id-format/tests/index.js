describe("switchBlogID script", function() {
  var switchBlogID = require("../index");
  var redisSearch = require("helper").redisSearch;
  var generateID = require("../../../../app/models/blog/generateID");

  global.test.blog();

  // We need to modify this property so the cleanup
  // function can remove the blog safely.
  beforeEach(function() {
    this.oldID = this.blog.id;
    this.newID = generateID();
    this.blog.id = this.newID;
  });

  afterEach(function(done) {
    var test = this;

    switchBlogID(test.oldID, test.newID, function(err) {
      if (err) return done.fail(err);

      redisSearch(test.oldID, function(err, results) {
        if (err) return done.fail(err);
        expect(results).toEqual([]);
        done();
      });
    });
  });

  it("can be run multiple times without breaking anything", function(done) {
    var oldID = this.oldID;
    var newID = this.newID;

    switchBlogID(oldID, newID, function(err) {
      if (err) return done.fail(err);

      switchBlogID(oldID, newID, done);
    });
  });

  it("handles blogs who change their handle", function(done) {
    require("blog").set(this.oldID, { handle: "example" }, done);
  });

  it("handles blogs who change their domain", function(done) {
    var test = this;
    require("blog").set(test.oldID, { domain: "example.com" }, function(err) {
      if (err) return done.fail(err);

      require("blog").set(test.oldID, { domain: "newexample.com" }, done);
    });
  });

  it("handles Templates", function(done) {
    require("template").create(
      this.oldID,
      "example",
      { name: "example", isPublic: false },
      done
    );
  });

  it("handles blogs with posts", function(done) {
    var test = this;

    var files = {
      "/welcome.txt": "Tags: Hello, World\n\nHello, world!",
      "/welcome.js": "alert()",
      "/xY/z.jpg": require("fs").readFileSync(__dirname + "/small.jpg")
    };

    require("sync")(test.oldID, function(err, folder, finish) {
      require("async").eachOf(
        files,
        function(content, path, next) {
          require("fs-extra").outputFileSync(
            test.blogDirectory + path,
            content
          );
          folder.update(path, next);
        },
        function(err) {
          finish(err, done);
        }
      );
    });
  });
});
