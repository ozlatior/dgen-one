const trim = function(str) {
	return str.replace(/^[ \t]*/, "").replace(/[ \t]*$/, "");
};

const deduplicateSpaces = function(str) {
	return str.replace(/[ \t]+/g, " ");
};

const clean = function(str) {
	return trim(deduplicateSpaces(str));
};

const getIndent = function(str) {
	let m = str.match(/^[ \t]+/);
	if (m === null)
		return "";
	return m[0];
};

const getCommonStr = function(str1, str2) {
	let l = str1.length;
	if (str2.length < str1.length)
		l = str2.length;
	let ret = "";
	for (let i=0; i<l; i++) {
		if (str1[i] === str2[i])
			ret += str1[i];
		else
			break;
	}
	return ret;
};

const getCommonIndent = function(str1, str2) {
	return getCommonStr(getIndent(str1), getIndent(str2));
};

const indentBlock = function(block, indent) {
	let type = typeof(block);
	if (type === "string")
		block = block.split("\n");
	else
		block = block.slice(0);
	if (indent === undefined)
		indent = "  ";
	let ret = block.map((row) => indent + row);
	if (type === "string")
		return ret.join("\n");
	return ret;
};

const deindentBlock = function(block) {
	let type = typeof(block);
	if (type === "string")
		block = block.split("\n");
	else
		block = block.slice(0);
	let indent = null;
	for (let i=0; i<block.length; i++) {
		// skip empty rows
		if (block[i].match(/[^ \t]/) === null)
			continue;
		if (indent !== null)
			indent = getCommonStr(indent, getIndent(block[i]));
		else
			indent = getIndent(block[i]);
	}
	let ret = block.map((row) => row.replace(indent, ""));
	if (type === "string")
		return ret.join("\n");
	return ret;
};

const joinPaths = function() {
	let paths = [];
	for (let i=0; i<arguments.length; i++)
		paths.push(arguments[i]);
	paths = paths.join("/");
	paths = paths.replace(/\/+/g, "/");
	paths = paths.replace(/\/\.\//g, "/");
	paths = paths.split("/");
	for (let i=1; i<paths.length; i++) {
		if (paths[i] === "..") {
			paths = paths.splice(i-1, 2);
			i -= 2;
		}
	}
	return paths.join("/");
};

const concatUnique = function() {
	if (arguments.length === 0)
		return [];
	let ret = [];
	for (let i=0; i<arguments.length; i++) {
		for (let j=0; j<arguments[i].length; j++) {
			if (ret.indexOf(arguments[i][j]) === -1)
				ret.push(arguments[i][j]);
		}
	}
	return ret;
};

module.exports.clean = clean;
module.exports.concatUnique = concatUnique;
module.exports.deduplicateSpaces = deduplicateSpaces;
module.exports.deindentBlock = deindentBlock;
module.exports.getCommonIndent = getCommonIndent;
module.exports.getCommonStr = getCommonStr;
module.exports.getIndent = getIndent;
module.exports.indentBlock = indentBlock;
module.exports.joinPaths = joinPaths;
module.exports.trim = trim;
