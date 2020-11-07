/*
 * CodeBlock class
 *
 * A code block is a functional piece of code, eg a comment block, a function or a
 * class declaration
 *
 * Blocks are linked like a list, but on three different levels:
 * - level 0: any block before or after, regardless of proximity
 * - level 1: any immediately adjacent block, regardless of type
 * - level 2: any block before or after, up to the first comment block that it's not level1-linked
 * 
 * For example:
 *
 * 1: <comment block> (section header 1)
 *
 * 2: <comment block> (function documentation)
 * 3: <function block>
 *
 * 4: <comment block> (class documentation)
 * 5: <class block>
 *
 * 6: <comment block> (section header 2)
 *
 * 7: <comment block> (variable documentation)
 * 8: <variable block>
 * 9: <variable block>
 * 10: <variable block>
 * 11: <variable block>
 *
 * Links at level 0:
 *     all blocks (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
 * Links at level 1:
 *     groups (1), (2, 3), (4, 5), (6), (7, 8, 9, 10, 11)
 * Links at level 2:
 *     groups (1, 2, 3, 4, 5), (6, 7, 8, 9, 10, 11)
 *
 * To link two blocks, use:
 *     block.setPrev(level, prevBlock);
 *     block.setNext(level, nextBlock);
 *
 * To access a linked block, use:
 * Use the optional `of` argument to select only blocks of specific type
 *     block.getPrev(level, of);
 *     block.getNext(level, of);
 *
 * To get the first (head) or last (tail) linked block, use:
 *     block.getHead(level);
 *     block.getTail(level);
 *
 * To get all blocks before or after, use:
 * Use the optional `of` argument to select only blocks of specific type
 *     block.getAllPrev(level, of);
 *     block.getAllNext(level, of);
 *
 * To get the full list, use:
 * Use the optional `of` argument to select only blocks of specific type
 *     block.getList(level, of);
 */

const util = require("./util.js");

const PATTERNS = {
	COMMENT_LINE: /^[ \t\n]*\/{2}.*\n/,
	COMMENT_BLOCK: /^[ \t\n]*\/\*.*\n/,
	REQUIRE_MODULE: /^[ \t\n]*(var|const)[ \t\n]+[a-zA-Z1-9_]+[ \t\n]*=[ \t\n]*require\(['"].+['"]\);?/,
	FUN_DECLARATION: /^[ \t\n]*(((let|var|const)[ \t\n]+[a-zA-Z0-9_]+[ \t\n]*=[ \t\n]*function)|(function[ \t\n]+[a-zA-Z0-9]+))[ \t\n]*\([^()]*\)[ \t\n]*{/,
	VAR_DECLARATION: /^[ \t\n]*(const|var|let)[ \t\n]+[a-zA-Z0-9_]+[ \t\n]*=[ \t\n]*.*/,
	CLASS_DECLARATION: /^[ \t\n]*class[ \t\n]+[a-zA-Z0-9_]+[ \t\n]*( extends[ \t\n]+[a-zA-Z0-9_]+[ \t\n]*)?{/,
	ASSIGNMENT: /^[ \t\n]*[a-zA-Z0-9_.]+[ \t\n]*=[ \t\n]*.*;/,
	METHOD_DECLARATION: /^[ \t\n]*[a-zA-Z0-9_]+[ \t\n]*\([^()]*\)[ \t\n]*{/
};

class CodeBlock {

	/*
	 * The content can have multiple code blocks, in which case only the
	 * first block will be assimilated as content
	 */
	constructor (content, row) {
		if (content instanceof CodeBlock) {
			this.type = content.getType();
			this.content = content.getContent();
			this.rowCount = content.getRowCount();
			this.startingRow = content.getStartingRow();
			this.rowsBefore = content.getRowsBefore();
			this.rowsAfter = content.getRowsAfter();
		}
		else {
			if (content) {
				let meta = CodeBlock.getBlockMeta(content);
				this.type = meta.type;
				this.content = content.slice(0, meta.length);
				this.rowCount = this.content.split("\n").length;
			}
			this.startingRow = row !== undefined ? row : 0;
			this.rowsBefore = 0;
			this.rowsAfter = 0;
		}
		// store previous and next blocks in this array, index is level
		this.link = [
			{ prev: null, next: null },
			{ prev: null, next: null },
			{ prev: null, next: null }
		];
	}

	getClassName () {
		return this.constructor.name;
	}

	getType () {
		return this.type;
	}

	getStartingRow () {
		return this.startingRow;
	}

	getRowCount () {
		return this.rowCount;
	}

	getContent () {
		return this.content;
	}

	getContentLength () {
		return this.content.length;
	}

	getRowsBefore () {
		return this.rowsBefore;
	}

	setRowsBefore (rows) {
		this.rowsBefore = rows;
	}

	getRowsAfter () {
		return this.rowsAfter;
	}

	setRowsAfter (rows) {
		this.rowsAfter = rows;
	}

	setPrev (level, block) {
		this.link[level].prev = block;
	}

	setNext (level, block) {
		this.link[level].next = block;
	}

	getPrev (level, of) {
		if (of === undefined)
			return this.link[level].prev;
		let block = this;
		while (block.link[level].prev !== null) {
			block = block.link[level].prev;
			if (block instanceof of)
				return block;
		}
		return null;
	}

	getNext (level, of) {
		if (of === undefined)
			return this.link[level].next;
		let block = this;
		while (block.link[level].next !== null) {
			block = block.link[level].next;
			if (block instanceof of)
				return block;
		}
		return null;
	}

	getHead (level) {
		let block = this;
		while (block.link[level].prev !== null)
			block = block.link[level].prev;
		return block;
	}

	getTail (level) {
		let block = this;
		while (block.link[level].next !== null)
			block = block.link[level].next;
		return block;
	}

	getAllPrev (level, of) {
		let ret = [];
		let block = this;
		while (block.link[level].prev !== null) {
			block = block.link[level].prev;
			if (of === undefined || block instanceof of)
				ret.push(block);
		}
		return ret;
	}

	getAllNext (level, of) {
		let ret = [];
		let block = this;
		while (block.link[level].next !== null) {
			block = block.link[level].next;
			if (of === undefined || block instanceof of)
				ret.push(block);
		}
		return ret;
	}

	getList (level, of) {
		let block = this.getHead(level);
		let ret = [];
		if (of === undefined || block instanceof of)
			ret.push(block);
		while (block.link[level].next !== null) {
			block = block.link[level].next;
			if (of === undefined || block instanceof of)
				ret.push(block);
		}
		return ret;
	}

	buildMeta () {
	}

	toSpecificInstance () {
		switch (this.type) {
			case "commentLine":
			case "commentBlock":
				return new CommentBlock(this);
			case "requireModule":
				return new RequireBlock(this);
			case "funDeclaration":
				return new FunctionBlock(this);
			case "varDeclaration":
				return new VariableBlock(this);
			case "classDeclaration":
				return new ClassBlock(this);
			case "methodDeclaration":
				return new MethodBlock(this);
			case "assignment":
				return new AssignmentBlock(this);
		}
		// if unknown, just return a new CodeBlock instance
		return new CodeBlock(this);
	}

	toString () {
		let content = this.content.replace(/\n/g, "\\n").replace(/\t/g, "\\t");
		if (content.length > 100)
			content = content.slice(0, 100) + " ... ";

		let ret = [];
		ret.push(this.constructor.name);
		ret.push("type: " + this.type);
		ret.push([
			"starting row: " + this.startingRow,
			"content rows: " + this.rowCount,
			"rows before: " + this.rowsBefore,
			"rows after: " + this.rowsAfter
		].join(", "));
		ret.push("content: " + content);

		return ret.join("\n  ");
	}

}

CodeBlock.getBlockLength = function(content) {
	let l = content.indexOf("{");
	let c = 0;
	while (l < content.length) {
		if (content[l] === "{")
			c++;
		if (content[l] === "}")
			c--;
		l++;
		if (c === 0)
			break;
	}
	while (content[l] === ";")
		l++;
	return l;
}

CodeBlock.getCommentLineMeta = function(content) {
	let ret = {
		type: "commentLine"
	};
	let len = 0;
	while (content.match(PATTERNS.COMMENT_LINE) !== null) {
		let blen = content.indexOf("\n") + 1;
		content = content.slice(blen);
		len += blen;
	}
	ret.length = len - 1;
	return ret;
};

CodeBlock.getCommentBlockMeta = function(content) {
	let ret = {
		type: "commentBlock"
	};
	ret.length = content.indexOf("*/") + 2;
	return ret;
};

CodeBlock.getRequireModuleMeta = function(content) {
	let ret = {
		type: "requireModule"
	};
	ret.length = content.indexOf("\n");
	return ret;
};

CodeBlock.getFunDeclarationMeta = function(content) {
	let ret = {
		type: "funDeclaration"
	};
	ret.length = CodeBlock.getBlockLength(content);
	return ret;
};

CodeBlock.getVarDeclarationMeta = function(content) {
	let ret = {
		type: "varDeclaration"
	};
	let match = content.match(PATTERNS.VAR_DECLARATION);
	ret.length = match[0].length;
	return ret;
};

CodeBlock.getClassDeclarationMeta = function(content) {
	let ret = {
		type: "classDeclaration"
	};
	ret.length = CodeBlock.getBlockLength(content);
	return ret;
};

CodeBlock.getAssignmentMeta = function(content) {
	let ret = {
		type: "assignment"
	};
	let match = content.match(PATTERNS.ASSIGNMENT);
	ret.length = match[0].length;
	return ret;
};

CodeBlock.getMethodDeclarationMeta = function(content) {
	let ret = {
		type: "methodDeclaration"
	};
	ret.length = CodeBlock.getBlockLength(content);
	return ret;
};

CodeBlock.getUnknownBlockMeta = function(content) {
	let ret = {
		type: "unknown"
	};
	ret.length = content.indexOf("\n");
	return ret;
};

CodeBlock.getBlockMeta = function(content) {
	if (content.match(PATTERNS.COMMENT_LINE) !== null)
		return CodeBlock.getCommentLineMeta(content);
	if (content.match(PATTERNS.COMMENT_BLOCK) !== null)
		return CodeBlock.getCommentBlockMeta(content);
	if (content.match(PATTERNS.REQUIRE_MODULE) !== null)
		return CodeBlock.getRequireModuleMeta(content);
	if (content.match(PATTERNS.FUN_DECLARATION) !== null)
		return CodeBlock.getFunDeclarationMeta(content);
	if (content.match(PATTERNS.VAR_DECLARATION) !== null)
		return CodeBlock.getVarDeclarationMeta(content);
	if (content.match(PATTERNS.CLASS_DECLARATION) !== null)
		return CodeBlock.getClassDeclarationMeta(content);
	if (content.match(PATTERNS.ASSIGNMENT) !== null)
		return CodeBlock.getAssignmentMeta(content);
	if (content.match(PATTERNS.METHOD_DECLARATION) !== null)
		return CodeBlock.getMethodDeclarationMeta(content);
	return CodeBlock.getUnknownBlockMeta(content);
};

/*
 * CommentBlock class - represents comments in code
 */

class CommentBlock extends CodeBlock {

	constructor (codeblock) {
		super(codeblock);
		this.text = this.content.split("\n");
		if (this.type === "commentLine")
			this.text = this.text.map(
				(row) => row.replace(/^[ \t]*\/\//, ""));
		if (this.type === "commentBlock")
			this.text = this.text.map(
				(row) => row.replace(/(^[ \t]*)?\*\/[ \t]*$/, "").replace(/^[ \t]*((\/\*)|(\*))?/, ""));
		let indent = "";
		this.text = this.text.map((row) => row.replace(/[ \t]*$/, ""));
		this.directives = [];
		for (let i=0; i<this.text.length; i++) {
			if (this.text[i].match(/^[ \t]*@[a-zA-Z0-9_]+/g) !== null) {
				let row = util.clean(this.text[i]).split(" ");
				let dir = row.shift();
				this.directives.push({
					verb: dir,
					args: row
				});
				this.text.splice(i, 1);
				i--;
			}
		}
	}

	getDirectives () {
		return this.directives.slice(0);
	}

	getDirectivesByVerb (verb) {
		let ret = [];
		for (let i=0; i<this.directives.length; i++) {
			if (this.directives[i].verb === verb)
				ret.push(this.directives[i]);
		}
		return ret;
	}

	getText () {
		return this.text.slice(0);
	}

	toString () {
		let ret = [ super.toString() ];

		let text = this.text.join("\\n");
		if (text.length > 100)
			text = text.slice(0, 100) + " ... ";

		ret.push("text: " + text);

		return ret.join("\n    ");
	}

}

/*
 * RequireBlock class - represents require statements in code
 */

class RequireBlock extends CodeBlock {

	constructor (codeblock) {
		super(codeblock);

		let parts = this.content.replace(/[ \t]+/g, " ").split("=");
		let l = util.trim(parts[0]).split(" ");
		let r = parts[1].replace(/ */, "");

		this.identifier = {
			type: l[0],
			name: l[1]
		};

		let field = r.match(/\.[a-zA-Z0-9_.]+;?$/);
		if (field !== null)
			field = field[0].replace(/^\./, "").replace(/;$/, "");

		this.module = {
			path: r.match(/["'].+["']/g)[0].slice(1, -1),
			field: field
		}
		if (this.module.path.match(/^.{0,2}\//) === null)
			this.module.type = "external";
		else
			this.module.type = "internal";
	}

	getIdentifierName () {
		return this.identifier.name;
	}

	getIdentifierType () {
		return this.identifier.type;
	}

	getModuleType () {
		return this.module.type;
	}

	getModulePath () {
		return this.module.path;
	}

	getModuleField () {
		return this.module.field;
	}

	toString () {
		let ret = [ super.toString() ];

		ret.push("identifier: " + this.identifier.type + " " + this.identifier.name);
		ret.push("module: [" + this.module.type + "] " + this.module.path);

		return ret.join("\n    ");
	}

}

/*
 * FunctionBlock class - represents function declarations in code
 */

class FunctionBlock extends CodeBlock {

	constructor (codeblock) {
		super(codeblock);

		let k = this.content.indexOf("{");
		let header = util.clean(this.content.slice(0, k));

		let arglist = header.match(/\(.*\)/g)[0];
		header = header.replace(arglist, " ");
		arglist = util.trim(arglist.slice(1, -1));

		this.identifier = {};

		let m = header.match(/^(const|var|let) /);
		if (m !== null)
			this.identifier.type = m[0];
		else
			this.identifier.type = "none";

		this.identifier.name =
			util.clean(header.replace(/^(const|var|let) /, "").replace(/(( |^)function( |$)|=)/g, ""));

		if (arglist.length)
			this.args = arglist.split(",").map((arg) => util.trim(arg));
		else
			this.args = [];

		this.body = util.deindentBlock(this.content.slice(k+1).replace(/};?$/, ""));
	}

	getIdentifierName () {
		return this.identifier.name;
	}

	getIdentifierType () {
		return this.identifier.type;
	}

	getArguments () {
		return this.args.slice(0);
	}

	getBody () {
		return this.body;
	}

	buildMeta () {
		// only build meta if the first level 1 of this block contains the @parse directive
		let head = this.getPrev(1, CommentBlock);
		if (head === null)
			return;
		if (head.getDirectivesByVerb("@parse").length > 0)
			this.contentBlock = new ContentBlock(this.body, this.startingRow);
	}

	toString () {
		let ret = [ super.toString() ];

		let body = this.body.replace(/\n/g, "\\n");
		if (body.length > 100)
			body = body.slice(0, 100) + " ... ";

		ret.push("identifier: " + this.identifier.type + " " + this.identifier.name);
		ret.push("arguments: " + this.args.join(", "));
		ret.push("body: " + body);

		return ret.join("\n    ");
	}

}

/*
 * VariableBlock class - represents const, var or let declarations in code
 */

class VariableBlock extends CodeBlock {

	constructor (codeblock) {
		super(codeblock);

		let parts = this.content.replace(/[ \t]+/g, " ").split("=");
		let l = util.trim(parts[0]).split(" ");
		let r = util.trim(parts[1].replace(/\n/g, " ").replace(/;[ \t]*$/, ""));

		this.identifier = {
			type: l[0],
			name: l[1]
		};
		this.value = r;
	}

	getIdentifierName () {
		return this.identifier.name;
	}

	getIdentifierType () {
		return this.identifier.type;
	}

	getValue () {
		return this.value;
	}

	toString () {
		let ret = [ super.toString() ];

		ret.push("identifier: " + this.identifier.type + " " + this.identifier.name);
		ret.push("value: " + this.value);

		return ret.join("\n    ");
	}

}

/*
 * ClassBlock class - represents class declarations in code
 */

class ClassBlock extends CodeBlock {

	constructor (codeblock) {
		super(codeblock);

		let k = this.content.indexOf("{");
		let header = util.clean(this.content.slice(0, k)).split(" extends ");

		this.identifier = {
			type: "class",
			name: header[0].split(" ")[1]
		};

		if (header.length === 2)
			this.super = header[1];
		else
			this.super = null;

		this.body = util.deindentBlock(this.content.slice(k+1).replace(/};?$/, ""));

		this.contentBlock = new ContentBlock(this.body, this.startingRow);
	}

	getIdentifierName () {
		return this.identifier.name;
	}

	getIdentifierType () {
		return this.identifier.type;
	}

	getSuperName () {
		return this.super;
	}

	getDeclaredMethods () {
		return this.declaredMethods.slice(0);
	}

	getBody () {
		return this.body;
	}

	buildMeta () {
		this.declaredMethods = [];
		let blocks = this.contentBlock.getBlocks();
		for (let i=0; i<blocks.length; i++) {
			if (blocks[i] instanceof MethodBlock) {
				this.declaredMethods.push({
					name: blocks[i].getFieldName(),
					args: blocks[i].getArguments()
				});
			}
		}
	}

	toString () {
		let ret = [ super.toString() ];

		let body = this.body.replace(/\n/g, "\\n");
		if (body.length > 100)
			body = body.slice(0, 100);

		ret.push("identifier: " + this.identifier.type + " " + this.identifier.name);
		ret.push("super: " + (this.super !== null ? this.super : "<none>"));
		ret.push("body: " + body);
		ret.push("");

		let sub = this.contentBlock.toString();
		sub = util.indentBlock(sub, "      ");

		return ret.join("\n    ") + "\n" + sub;
	}

}

/*
 * MethodBlock class - represents member method of class
 */
class MethodBlock extends CodeBlock {

	constructor (codeblock) {
		super(codeblock);

		let k = this.content.indexOf("{");
		let header = util.clean(this.content.slice(0, k));

		let arglist = header.match(/\(.*\)/g)[0];
		header = header.replace(arglist, " ");
		arglist = util.trim(arglist.slice(1, -1));

		this.name = util.clean(header);

		if (arglist.length)
			this.args = arglist.split(",").map((arg) => util.trim(arg));
		else
			this.args = [];

		this.body = util.deindentBlock(this.content.slice(k+1).replace(/};?$/, ""));
	}

	getFieldName () {
		return this.name;
	}

	getArguments () {
		return this.args.slice(0);
	}

	toString () {
		let ret = [ super.toString() ];

		let body = this.body.replace(/\n/g, "\\n");
		if (body.length > 100)
			body = body.slice(0, 100) + " ... ";

		ret.push("name: " + this.name);
		ret.push("arguments: " + this.args.join(", "));
		ret.push("body: " + body);

		return ret.join("\n    ");
	}

}

/*
 * AssignmentBlock class - represents value assignments in code
 */

class AssignmentBlock extends CodeBlock {

	constructor (codeblock) {
		super(codeblock);

		let k = this.content.indexOf("=");
		let l = util.trim(this.content.slice(0, k));
		let r = util.trim(this.content.slice(k+1).replace(/;$/, ""));

		this.target = l;
		this.value = r;
	}

	getTarget () {
		return this.target;
	}

	getValue () {
		return this.value;
	}

	toString () {
		let ret = [ super.toString() ];

		ret.push("target: " + this.target);
		ret.push("value: " + this.value);

		return ret.join("\n    ");
	}

}

/*
 * ContentBlock - represents a group of blocks (for nesting, etc)
 */

class ContentBlock extends CodeBlock {

	constructor (content, row) {
		super();
		this.blocks = [];
		if (content !== undefined) {
			this.loadCode(content, row);
			this.type = "contentBlock";
			this.content = content;
			this.rowCount = this.content.split("\n").length;
		}
		this.startingRow = row !== undefined ? row : 0;
		this.rowsBefore = 0;
		this.rowsAfter = 0;
	}

	loadCode (content, row) {
		this.content = content;
		this.blocks = [];

		if (row === undefined)
			row = 1;
		let emptyRows = 0;

		// remove and count any leading empty rows
		while (content[0] === "\n") {
			content = content.slice(1);
			emptyRows++;
		}
		row += emptyRows;

		let lastBlock = null;

		while (content.length > 0) {
			// get next block and convert it to specific block instance
			let block = new CodeBlock(content, row);
			content = content.slice(block.getContentLength());
			let specific = block.toSpecificInstance();
			this.blocks.push(specific);

			// store the rows before in this block instance
			specific.setRowsBefore(emptyRows);

			// increment current row
			row += block.getRowCount();

			// remove leftover new line if any
			if (content[0] === "\n")
				content = content.slice(1);

			// remove and count subsequent empty rows
			emptyRows = 0;
			while (content[0] === "\n") {
				content = content.slice(1);
				emptyRows++;
			}
			specific.setRowsAfter(emptyRows);
			row += emptyRows;

			// perform the linking to previous block
			if (lastBlock !== null) {
				// always link level 0
				lastBlock.setNext(0, specific);
				specific.setPrev(0, lastBlock);
				// link level 1 if adjacent
				if (specific.getRowsBefore() === 0) {
					lastBlock.setNext(1, specific);
					specific.setPrev(1, lastBlock);
				}
				// link level 2 if this block is not an isolated comment
				if (!((specific instanceof CommentBlock) && specific.getRowsAfter() > 0)) {
					lastBlock.setNext(2, specific);
					specific.setPrev(2, lastBlock);
				}
			}
			lastBlock = specific;

			// finally, build the metadata
			specific.buildMeta();
		}
	}

	getContentLength () {
		return this.content.length;
	}

	getBlockCount () {
		return this.blocks.length;
	}

	getBlocks () {
		return this.blocks.slice(0);
	}

	getBlocksByType (type) {
		let ret = [];
		for (let i=0; i<this.blocks.length; i++)
			if (this.blocks[i].getType() === type)
				ret.push(this.blocks[i]);
		return ret;
	}

	toString () {
		let ret = [];
		for (let i=0; i<this.blocks.length; i++)
			ret.push(this.blocks[i].toString());
		return ret.join("\n\n");
	}

}

CodeBlock.AssignmentBlock = AssignmentBlock;
CodeBlock.ClassBlock = ClassBlock;
CodeBlock.VariableBlock = VariableBlock;
CodeBlock.FunctionBlock = FunctionBlock;
CodeBlock.RequireBlock = RequireBlock;
CodeBlock.CommentBlock = CommentBlock;

CodeBlock.ContentBlock = ContentBlock;

module.exports = CodeBlock;
