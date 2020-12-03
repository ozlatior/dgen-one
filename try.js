const Environment = require("./src/environment.js");

let env = new Environment();

env.autoloadProjectFiles("./sample");

env.outputFilesDocumentation("./sample/documentation/files");
env.outputObjectsDocumentation("./sample/documentation/objects");
