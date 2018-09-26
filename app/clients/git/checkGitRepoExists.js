var helper = require("helper");
var localPath = helper.localPath;
var Git = require("simple-git");
var debug = require("debug")("clients:git:checkGitRepoExists");
var fs = require('fs-extra');

module.exports = function (blogID, callback) {

  var git, blogFolder;

  blogFolder = localPath(blogID,'/');

  // Throws an error if folder does not exist
  try {
    git = Git(blogFolder).silent(true);    
  } catch (err) {
    return callback(err);
  }

  // We want to compare the path to the blog folder with the path
  // to the repository that simple-git is operating on. It is not
  // as simple as just checking Git.checkIsRepo() because all of the
  // blogs git repos are inside the Blot codebase git repo. This means
  // that Git.checkIsRepo() ALWAYS returns true even if there is no
  // repo in the user's blog's folder. So we use this git command which
  // tells us the top level of the current git repository:

  git.revparse(['--show-toplevel'], function(err, pathToGitRepository){

    if (err) {
      return callback(new Error(err));
    }

    // Has a space at the start, in my testing at least
    pathToGitRepository = pathToGitRepository.trim();

    // Right now localPath returns a path with a trailing slash for some 
    // crazy reason. This means that we need to remove the trailing
    // slash for this to work properly. In future, you should be able
    // to remove this line when localPath works properly.
    if (blogFolder.slice(-1) === '/') blogFolder = blogFolder.slice(0, -1);

    debug('Comparing path to git repository and blog folder:');
    
    if (pathToGitRepository !== blogFolder) {
      
      var message = ['Git repo does not exist in blog folder for ' + blogID,
        '- Path to git: ' + pathToGitRepository,
        '- Blog folder: ' + blogFolder + ' exists? ' + fs.existsSync(blogFolder),
        'Match? ' + pathToGitRepository === blogFolder, 
      ];

      return callback(new Error(message.join('\n')));
    }

    callback(null);
  });
};