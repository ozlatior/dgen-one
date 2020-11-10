const fs = require("fs");

const CodeTree = require("./src/codetree.js");
const CodeUnit = require("./src/codeunit.js");

let units = [
	"./sample/index.js",
	"./sample/src/assert.js",
	"./sample/src/condition.js",
	"./sample/src/message/message.js"
];

let tree = new CodeTree();

for (let i=0; i<units.length; i++) {
	let code = fs.readFileSync(units[i]).toString();
	let unit = new CodeUnit(code, 1, units[i]);
	tree.linkUnit(unit);
}

let roots = tree.findRoots();

console.log(roots);
