/*
 * Utility functions
 *
 * Some of these should be moved to the util-one package and included from there
 */

const trim = function(str) {
	if (str instanceof Array) {
		return str.map((row) => trim(row));
	}
	return str.replace(/^[ \t]*/, "").replace(/[ \t]*$/, "");
};

const deduplicateSpaces = function(str) {
	return str.replace(/[ \t]+/g, " ");
};

const clean = function(str) {
	return trim(deduplicateSpaces(str));
};

const getIndent = function(str) {
	if (str instanceof Array) {
		let indent = null;
		for (let i=0; i<str.length; i++) {
			// skip empty rows
			if (str[i].match(/[^ \t]/) === null)
				continue;
			if (indent !== null)
				indent = getCommonStr(indent, getIndent(str[i]));
			else
				indent = getIndent(str[i]);
		}
		return indent;
	}
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
	let indent = getIndent(block);
	let ret = block.map((row) => row.replace(indent, ""));
	if (type === "string")
		return ret.join("\n");
	return ret;
};

const padString = function(str, length, pad) {
	while (str.length < length)
		str = pad + str;
	return str;
};

const padBlock = function(block, options) {
	if (options === undefined || !options.width)
		return block.slice(0);
	if (options.empty === undefined)
		options.empty = " ";
	if (options.mode === undefined)
		options.mode = "continuous";
	let padding = options.padding;
	if (padding === undefined) {
		padding = [];
		if (options.firstRow !== undefined)
			padding.push(options.firstRow);
		if (options.otherRows !== undefined)
			padding.push(options.otherRows);
	}
	padding = padding.map((pad) => padString(pad, options.width, options.empty));
	let ret = [];
	for (let i=0; i<block.length; i++) {
		switch (options.mode) {
			case "alternate":
				ret.push(padding[i % padding.length] + block[i]);
				break;
			default:
				ret.push(padding[ i < padding.length ? i : padding.length-1 ] + block[i]);
		}
	}
	return ret;
};

const wrapText = function(str, max, min) {
	if (min === undefined)
		min = 0;
	let ret = [];
	while (str.length > max) {
		let p = max;
		while (str[p] !== " " && p >= min)
			p--;
		if (p < min)
			p = max;
		ret.push(str.slice(0, p));
		if (str[p] === " ")
			str = str.slice(p + 1);
		else
			str = str.slice(p);
	}
	ret.push(str);
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

const applyDefaults = function(target, source) {
	for (let i in source) {
		if (typeof(source[i]) === "object" && !(source[i] instanceof Array)) {
			if (target[i] === undefined)
				target[i] = {};
			if (target[i] !== null && typeof(target[i]) === "object")
				applyDefaults(target[i], source[i]);
		}
		else if (target[i] === undefined) {
			if (source[i] instanceof Array)
				target[i] = source[i].slice(0);
			else
				target[i] = source[i];
		}
	}
};

const strFill = function(len, seq) {
	if (seq === undefined)
		seq = " ";
	let ret = "";
	while (ret.length < len)
		ret += seq;
	return ret.slice(0, len);
};

module.exports.applyDefaults = applyDefaults;
module.exports.clean = clean;
module.exports.concatUnique = concatUnique;
module.exports.deduplicateSpaces = deduplicateSpaces;
module.exports.deindentBlock = deindentBlock;
module.exports.getCommonIndent = getCommonIndent;
module.exports.getCommonStr = getCommonStr;
module.exports.getIndent = getIndent;
module.exports.indentBlock = indentBlock;
module.exports.joinPaths = joinPaths;
module.exports.padBlock = padBlock;
module.exports.padString = padString;
module.exports.strFill = strFill;
module.exports.trim = trim;
module.exports.wrapText = wrapText;
