/*
 * Directive Engine Class
 *
 * The Directive Engine Class applies directives to CodeUnits and/or CodeBlocks.
 * Directives can be either specified in comments or applied programatically.
 *
 * To specify a directive in comments, use the @ annotation: `@<directive> <args>`
 *
 * Some directives apply to the next code block, others apply to the entire unit.
 * They are used to specify things that are not directly obvious to the CodeUnit
 * engine or to provide metadata for better documentation output.
 *
 * Available directives:
 * - `alias <altName>`: the following code block implements an alias of `altName`
 * - `alias <what> <altName>`: sets an alias for what under `altName`
 * - `assign <target> <value>`: assigns a variable or value to target field of object
 * - `export <exportName>`: sets the exported name of the next block
 * - `export <what> <exportName>`: sets the exported name of `what` to `exportName`
 * - `parse`: this has two effects - forces the CodeUnit engine to parse the contents
 *   of the following block, even if normally that would not be the case (eg. for
 *   function blocks) and it applies any directives found in the parse block
 * - `pattern <type> <args>`: specify a particular pattern implemented by this CodeUnit;
 *   for now only singleton patterns can be specified: `pattern singleton <className>`
 *
 * Directives placed at the end of the file (after all code) refer to the CodeUnit file
 * instead of the following block
 *
 * Objects can be specified in the assign, alias, export directives by path. An object
 * directly on CodeUnit level can be specified directly by identifier name, while a
 * nested (assigned) object or a prototype object can be specified by path (with dots).
 *
 * The object path can contain expressions between `{}` brakets, which will be parsed
 * by reading the lines of code directly under the directive. Parsing can use regular
 * expressions and keywords: `{<keyword><regex>}`
 *
 * Available keywords:
 * - `target`: in an assignment, apply the regex to extract the name from the target
 *   of the assignment; return extracted name
 * - `value`: in an assignment, use the regex to extract the name from the value of
 *   the assignment; return extracted name
 * - `arg[i]`: in a function call, use the regex to extract the name from the index i
 *   argument of the call, starting from zero; return extracted name
 */

const CodeBlock = require("./codeblock.js");

const CommentBlock = CodeBlock.CommentBlock;
const ContentBlock = CodeBlock.ContentBlock;

const directive = require("./directive.js");

const util = require("./util.js");

/*
 * Default settings object
 */
const DEFAULT_SETTINGS = {
};

class DirectiveEngine {

	constructor (codeTree, settings) {
		this.codeTree = codeTree;
		this.settings = settings !== undefined ? settings : {};

		util.applyDefaults(this.settings, DEFAULT_SETTINGS);
	}

	runContentDirectives (contentBlock, codeUnit, settings) {
		let current = contentBlock.getFirstBlock();

		while (current !== null) {
			if ((current instanceof CommentBlock) && current.hasDirectives()) {
				let directives = current.getDirectives();
				let parse = false;
				let stop = false;
				let block = current.getNext(0);
				while (block instanceof CommentBlock)
					block = block.getNext(0);

				directives.map((dir) => {
					if (dir.verb === "parse")
						parse = true;
					if (dir.verb === "stop")
						stop = true;
					if (directive[dir.verb] instanceof Function)
						return directive[dir.verb](codeUnit, current, block, dir.args)
					directive._logError("Unknown directive " + dir.verb, codeUnit, current);
				});

				if (parse) {
					if (block.getContentBlock instanceof Function)
						this.runContentDirectives(block.getContentBlock(), codeUnit, settings);
					else
						directive._logError(
							"Bad target (row " + block.getStartingRow() + ") for parse directive",
							codeUnit, current
						);
				}

				if (stop) {
					let index = contentBlock.getBlockIndex(current) + 1;
					contentBlock.sliceContent(0, index);
				}
			}
			current = current.getNext(0);
		}
	}

	runCodeUnitDirectives (codeUnit, settings) {
		return this.runContentDirectives(codeUnit.getContentBlock(), codeUnit, settings);
	}

	runDirectives (settings) {
		if (settings === undefined)
			settings = {};
		util.applyDefaults(settings, this.settings);

		let roots = this.codeTree.findRoots();
		let objects = roots.slice(0);
		for (let i=0; i<roots.length; i++) {
			let upstream = roots[i].getAllPrev();
			objects = util.concatUnique(objects, upstream);
		}

		for (let i=0; i<objects.length; i++)
			this.runCodeUnitDirectives(objects[i], settings);

	}

}

module.exports = DirectiveEngine;
