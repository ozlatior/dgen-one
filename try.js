const fs = require("fs");

const CodeTree = require("./src/codetree.js");
const CodeUnit = require("./src/codeunit.js");
const DirectiveEngine = require("./src/directive_engine.js");
const Generator = require("./src/generator.js");

const util = require("./src/util.js");

let units = [
	"./sample/src/assert.js",
	"./sample/src/condition.js",
	"./sample/src/message/message.js"
];

let tree = new CodeTree();

tree.linkUnit(new CodeUnit(fs.readFileSync("./sample/index.js").toString(), 1, "./sample/index.js",
	"Library Root", "Exposes the main Assert class"));

for (let i=0; i<units.length; i++) {
	let code = fs.readFileSync(units[i]).toString();
	let unit = new CodeUnit(code, 1, units[i]);
	tree.linkUnit(unit);
}

// apply directives
let directiveEngine = new DirectiveEngine(tree);
directiveEngine.runDirectives();

// generate file content
let generator = new Generator(tree);
let content = generator.generateFileContent({}, 2);

for (let i=0; i<content.length; i++) {
	let path = util.joinPaths(
		"./sample/doc/generated",
		content[i].path.split("/").slice(2).join("/").replace(/\.js$/, ".rst")
	);
	fs.writeFileSync(path, content[i].content.join("\n"));
}
