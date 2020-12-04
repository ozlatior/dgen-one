/*
 * Directive handlers
 *
 * Directive handlers take arguments, CodeUnit and CodeBlock references and
 * change them to implement the directive
 *
 * General signature:
 *
 * handler = function (codeUnit, commentBlock, codeBlock, args)
 */

const CodeBlock = require("./codeblock.js");

const AssignmentBlock = CodeBlock.AssignmentBlock;
const CommentBlock = CodeBlock.CommentBlock;

const util = require("./util.js");

const PATTERN_GENERIC = /\{.+\}/g;

const _logError = function (message, codeUnit, commentBlock) {
	console.log("Directive error: " + message +
		" [ " + codeUnit.getPath() + ":" + commentBlock.getStartingRow() + " ]");
};

/*
 * Split argument list by commas, but don't split inside paranthesis
 * `argString`: string, argument string, eg `1, null, fn(1, 2, 3))`
 */
const _splitArgList = function (argString) {
	let ret = [];
	let c = 0;
	let i = 0;
	while (argString.length > 0) {
		if (argString[i] === "(")
			c++;
		if (argString[i] === ")")
			c--;
		if (c < 0)
			return null;
		if (c === 0 && argString[i] === ",") {
			ret.push(util.trim(argString.slice(0, i)));
			argString = argString.slice(i + 1);
			i = 0;
		}
		else if (i > argString.length) {
			ret.push(util.trim(argString));
			argString = "";
		}
		else
			i++;
	}
	return ret;
}

/*
 * Build argument tree for a nested call string
 * `callString`: string, the nested call string, eg `myFun(1, myOtherFun(2, 3))`
 * Returns: nested array of strings, the arguments of the nested call, eg `[ 1, [ 2, 3 ] ]`
 */
const _buildArgTree = function (callString) {
	// TODO: tokenize string
	let l = callString.indexOf("(");
	let r = callString.lastIndexOf(")");
	// not an arglist, just return the string
	if (l === -1 && r === -1)
		return callString;
	// unmatched ( or ), return null - this will propagate up so we know it's not a valid expression
	if (l === -1 || r === -1)
		return null;
	callString = callString.slice(l+1, r);
	callString = _splitArgList(callString);
	if (callString === null)
		return null;
	let ret = [];
	for (let i=0; i<callString.length; i++) {
		let el = _buildArgTree(util.trim(callString[i]));
		if (el === null)
			return null;
		ret.push(el);
	}
	return ret;
};

/*
 * Read an argument from a nested call string
 * `callString`: string, the code for the function call, `eg myFun(1, myOtherFun(2, 3));`
 * `argPath`: array of numbers, argument path to read, eg `[ 0, 1 ]`
 * Returns: string, the argument at path, eg. in the example above `3`, or null if not found
 */
const _readArgAt = function (callString, argPath) {
	let current = _buildArgTree(callString);
	if (current === null)
		return null;
	for (let i=0; i<argPath.length; i++) {
		current = current[argPath[i]];
		if (current === undefined)
			return null;
	}
	return current;
};

const _parseExpression = function (expression, ctx) {
	let sliced = expression.replace(/^\{/, "").replace(/\}$/, "");
	let index = sliced.indexOf("/");
	let regex = null;

	if (index !== -1) {
		try {
			regex = new RegExp(sliced.slice(index+1, -1), "g");
		}
		catch (e) {
			_logError(e.message, ctx.codeUnit, ctx.commentBlock);
		}
	}

	let element = sliced;
	if (regex !== null)
		element = sliced.slice(0, index);

	if (element === "value" || element === "target")
		return { expression: expression, element: element, regex: regex }
	if (element.match(/^arg\[[0-9]+\]$/g) !== null) {
		element = element.split("[");
		return { expression: expression, element: element.shift(),
			index: element.map((i) => parseInt(i.slice(0, -1))), regex: regex }
	}

	_logError("Unknown element '" + element + "' in expression", ctx.codeUnit, ctx.commentBlock);
	return { expression: expression, element: null };
};

const _extractExpression = function (argument, parsedExpression, block, ctx) {
	// TODO: check if block is of correct type for each expression type
	if (!(block instanceof AssignmentBlock))
		return parsedExpression.expression;

	let element = null;
	switch (parsedExpression.element) {
		case "arg":
			element = _readArgAt(block.getValue(), parsedExpression.index);
			break;
		case "target":
			element = block.getTarget();
			break;
		case "value":
			element = block.getValue();
			break;
	}

	if (element === null)
		return null;

	if (parsedExpression.regex) {
		element = element.match(parsedExpression.regex);
		if (element === null)
			return null;
		element = element[0];
	}

	return element;
};

const _replaceExpressions = function (argument, parsedExpressions, block, ctx) {
	// TODO: check if block is of correct type for each expression type
	for (let i=0; i<parsedExpressions.length; i++) {
		let extracted = _extractExpression(argument, parsedExpressions[i], block, ctx);
		if (extracted === null)
			return null;
		argument = argument.replace(parsedExpressions[i].expression, extracted);
	}
	return argument;
};

const _expandArgs = function (args, block, includeFirst, ctx) {
	let found = false;
	let matches = args.map((arg) => {
		let m = arg.match(PATTERN_GENERIC);
		if (m === null)
			return [];
		found = true;
		return m.map((match) => _parseExpression(match, ctx));
	});

	if (!found)
		return [ args ];

	let ret = [];

	let blocks = block.getAllNext(1);
	if (includeFirst)
		blocks.unshift(block);

	for (let i=0; i<blocks.length; i++) {
		// for now only assignment blocks do anything, this might change later
		if (!(blocks[i] instanceof AssignmentBlock))
			continue;
		let toPush = [];
		for (let j=0; j<args.length; j++) {
			let replaced = _replaceExpressions(args[j], matches[j], blocks[i], ctx);
			if (replaced === null)
				break;
			toPush.push(replaced);
		}
		if (toPush.length)
			ret.push(toPush);
	}

	return ret;
};

/*
 * alias <altName>
 */
const _aliasNext = function (codeUnit, commentBlock, codeBlock, args) {
	if (codeBlock === null) // apply to codeUnit is not allowed for alias
		_logError("alias directive cannot be applied to code unit", codeUnit, commentBlock);
	else
		throw new Error("not implemented");
};

/*
 * alias <what> <altName>
 */
const _aliasSpecific = function (codeUnit, commentBlock, codeBlock, args) {
	let expanded = _expandArgs(args, codeBlock, true, { commentBlock: commentBlock, codeUnit: codeUnit });
	if (expanded.length === 0)
		_logError("Expression expansion did not find any matching code", codeUnit, commentBlock);
	for (let i=0; i<expanded.length; i++) {
		let target = expanded[i][0];
		let name = expanded[i][1];
		let targetBlock = codeUnit.getBlockByPath(target.split("."));
		targetBlock.addAlias(name);
	}
};

/*
 * alias <altName>
 * alias <what> <altName>
 */
const _alias = function (codeUnit, commentBlock, codeBlock, args) {
	if (args.length === 1)
		return _aliasNext(codeUnit, commentBlock, codeBlock, args);
	if (args.length === 2)
		return _aliasSpecific(codeUnit, commentBlock, codeBlock, args);
	_logError("Bad argument count for alias, expected 1 or 2, got " + args.length, codeUnit, commentBlock);
};

/*
 * assign <target> <value>
 */
const _assign = function (codeUnit, commentBlock, codeBlock, args) {
	if (args.length !== 2) {
		_logError("Bad argument count for assign, expected 2, got " + args.length, codeUnit, commentBlock);
		return;
	}
	let expanded = _expandArgs(args, codeBlock, true, { commentBlock: commentBlock, codeUnit: codeUnit });
	if (expanded.length === 0)
		_logError("Expression expansion did not find any matching code", codeUnit, commentBlock);
	for (let i=0; i<expanded.length; i++) {
		let target = expanded[i][0];
		let value = expanded[i][1];
		target = target.split(".");
		let field = target.pop();
		let targetBlock = codeUnit.getBlockByPath(target);
		let valueBlock = codeUnit.getBlockByPath(value.split("."));
		if (targetBlock === null) {
			_logError("No such path in code unit: " + target.join("."), codeUnit, commentBlock);
			continue;
		}
		if (valueBlock === null) {
			_logError("No such path in code unit: " + value, codeUnit, commentBlock);
			continue;
		}
		targetBlock.assignField(field, valueBlock);
	}
};

/*
 * export <exportName>
 */
const _exportNext = function (codeUnit, commentBlock, codeBlock, args) {
	if (codeBlock === null) // apply to codeUnit
		codeUnit.setExportedName(args[0]);
	else
		throw new Error("not implemented");
};

/*
 * export <what> <exportName>
 */
const _exportSpecific = function (codeUnit, commentBlock, codeBlock, args) {
	let expanded = _expandArgs(args, codeBlock, true, { commentBlock: commentBlock, codeUnit: codeUnit });
	if (expanded.length === 0)
		_logError("Expression expansion did not find any matching code", codeUnit, commentBlock);
	for (let i=0; i<expanded.length; i++) {
		let target = expanded[i][0];
		let name = expanded[i][1];
		let targetBlock = codeUnit.getBlockByPath(target.split("."));
		targetBlock.setExportedName(name);
	}
};

/*
 * export <exportName>
 * export <what> <exportName>
 */
const _export = function (codeUnit, commentBlock, codeBlock, args) {
	if (args.length === 1)
		return _exportNext(codeUnit, commentBlock, codeBlock, args);
	if (args.length === 2)
		return _exportSpecific(codeUnit, commentBlock, codeBlock, args);
	_logError("Bad argument count for export, expected 1 or 2, got " + args.length, codeUnit, commentBlock);
};

/*
 * does nothing, parse is handled directly by the engine
 */
const _parse = function () {
};

/*
 * does nothing, stop is handled directly by the engine
 */
const _stop = function () {
};

/*
 * pattern <pattern> <args>
 */
const _pattern = function (codeUnit, commentBlock, codeBlock, args) {
	codeUnit.setMeta("pattern", args[0]);
	switch (args[0]) {
		case "singleton":
			codeUnit.setMeta("exportedInstance", args[1]);
			break;
		default:
			_logError("Unknown value for pattern (" + args[0] + ")", codeUnit, commentBlock);
	}
};

module.exports._logError = _logError;

module.exports.alias = _alias;
module.exports.assign = _assign;
module.exports.export = _export;
module.exports.parse = _parse;
module.exports.pattern = _pattern;
module.exports.stop = _stop;
