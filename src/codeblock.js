/*
 * CodeBlock class
 *
 * A code block is a functional piece of code, eg a comment block, a function or a
 * class declaration
 */

const util = require("./util.js");

/*
 * Regex patterns used to read the code
 */
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

/*
 * CodeBlock class
 *
 * A code block is a functional piece of code, eg a comment block, a function or a
 * class declaration
 *
 * Blocks are linked like a list, but on three different levels:
 * - level 0: any block before or after, regardless of proximity
 * - level 1: any immediately adjacent block, regardless of type
 * - level 2: any block before or after, up to the first comment block that is not level1-linked
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
class CodeBlock {

	/*
	 * Create new content block based on string content
	 * `content`: either of the following
	 * - string, the content to read into this content block
	 * - CodeBlock object, use this as a copy constructor
	 * `row`: number, optional, starting row for the content (not used in copy-constructor mode)
	 *     default value is 0
	 *
	 * If more than one block is present in the content, only the first block
	 * will be processed into this CodeBlock object
	 */
	constructor (content, row) {
		if (content instanceof CodeBlock) {
			this.type = content.getType();
			this.content = content.getContent();
			this.rowCount = content.getRowCount();
			this.startingRow = content.getStartingRow();
			this.rowsBefore = content.getRowsBefore();
			this.rowsAfter = content.getRowsAfter();
			this.exportedName = content.getExportedName();
			this.aliases = [];
			this.assignedFields = {};
			this._parent = content.getParent();
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
			this.exportedName = null;
			this._parent = null;
		}
		// store previous and next blocks in this array, index is level
		this.link = [
			{ prev: null, next: null },
			{ prev: null, next: null },
			{ prev: null, next: null }
		];
	}

	/*
	 * Get class (constructor) name for this object
	 *
	 * Returns string, the class name, eg `CodeBlock` or `CommentBlock`
	 */
	getClassName () {
		return this.constructor.name;
	}

	/*
	 * Get the string type for this CodeBlock instance.
	 *
	 * Returns string, one of `commentLine`, `commentBlock`, `requireModule`, `funDeclaration`,
	 * `varDeclaration`, `classDeclaration`, `methodDeclaration`, `assignment` or `unknown`
	 */
	getType () {
		return this.type;
	}

	/*
	 * Get the starting row for this CodeBlock
	 *
	 * Returns number, the starting row passed as argument to the constructor
	 */
	getStartingRow () {
		return this.startingRow;
	}

	/*
	 * Get the total row count for this CodeBlock
	 *
	 * Returns number, the total number of rows for this codeblock
	 */
	getRowCount () {
		return this.rowCount;
	}

	/*
	 * Get the original content parsed by this CodeBlock
	 *
	 * Returns string, the content used to create this CodeBlock - only the content actually part
	 * of the codeblock will be returned, not the entire string passed to the constructor
	 */
	getContent () {
		return this.content;
	}

	/*
	 * Get the original content length parsed by this CodeBlock
	 *
	 * Returns number, the length of the content used to create this CodeBlock - only the content
	 * actually part of the codeblock will be considered, not the entire string passed to the constructor
	 */
	getContentLength () {
		return this.content.length;
	}

	/*
	 * Get the number of empty rows before this CodeBlock
	 *
	 * Returns number, the number of empty rows before the content of this CodeBlock
	 */
	getRowsBefore () {
		return this.rowsBefore;
	}

	/*
	 * Set the number of empty rows before this CodeBlock
	 * `rows`: number, the number of empty rows before the content parsed by this CodeBlock
	 */
	setRowsBefore (rows) {
		this.rowsBefore = rows;
	}

	/*
	 * Get the number of empty rows after this CodeBlock
	 *
	 * Returns number, the number of empty rows after the content of this CodeBlock
	 */
	getRowsAfter () {
		return this.rowsAfter;
	}

	/*
	 * Set the number of empty rows after this CodeBlock
	 * `rows`: number, the number of empty rows after the content parsed by this CodeBlock
	 */
	setRowsAfter (rows) {
		this.rowsAfter = rows;
	}

	/*
	 * Get the exported (identifier) name for this CodeBlock
	 *
	 * Returns string, the exported (identifier) name, for instance the class name or variable name.
	 */
	getExportedName () {
		return this.exportedName;
	}

	/*
	 * Set the exported (identifier) name for this CodeBlock
	 * `name`: string, the exported (identifier) name, for instance the class name or variable name.
	 */
	setExportedName (name) {
		this.exportedName = name;
	}

	/*
	 * Get a copy of the aliases list for this CodeBlock
	 *
	 * Returns: array of strings, copy of the aliases list
	 */
	getAliases () {
		return this.aliases.slice(0);
	}

	/*
	 * Set the aliases list to a new set of values provided in the array
	 * `aliases`: array of strings, the new values for the aliases list
	 */
	setAliases (aliases) {
		this.aliases = aliases.slice(0);
	}

	/*
	 * Add a new alias to the aliases list
	 * `alias`: string, new alias to add to the list
	 * Returns: boolean, true if successful, false if not (alias already in the list)
	 */
	addAlias (alias) {
		if (this.aliases.indexOf(alias) !== -1)
			return false;
		this.aliases.push(alias);
		return true;
	}

	/*
	 * Remove all aliases from the aliases list
	 */
	clearAliases () {
		this.aliases = [];
	}

	/*
	 * Get the number of aliases in the list
	 *
	 * Returns: number, the size of the aliases list
	 */
	getAliasCount () {
		return this.aliases.length;
	}

	/*
	 * Assign a value to an object field for this CodeBlock
	 * `field`: string, name of the field
	 * `value`: any type, value to assign - can be any value or a CodeBlock reference
	 *
	 * Fields are exported in the documentation, so assigned fields are one way to specify that an
	 * object contains a value or a reference to another object defined by a CodeBlock
	 */
	assignField (field, value) {
		this.assignedFields[field] = value;
	}

	/*
	 * Get a reference to the assigned fields of this CodeBlock
	 *
	 * Returns: object, reference to the internal assigned fields object.
	 */
	getAssignedFields () {
		return this.assignedFields;
	}

	/*
	 * Get a list of assigned field names for this CodeBlock
	 *
	 * Returns: array of strings, list of assigned fields
	 */
	getAssignedFieldNames () {
		let ret = [];
		for (let i in this.assignedFields)
			ret.push(i);
		return ret;
	}

	getParent () {
		return this._parent;
	}

	setParent (_parent) {
		this._parent = _parent;
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
	if (ret.length === -1)
		ret.length = content.length;
	return ret;
};

CodeBlock.getBlockMeta = function(content) {
	// quick-fix for minified files
	if (content.indexOf("\n") === -1 || content.indexOf("\n") > 1000)
		return CodeBlock.getUnknownBlockMeta(content);
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
					verb: dir.slice(1),
					args: row
				});
				this.text.splice(i, 1);
				i--;
			}
		}
	}

	hasDirectives () {
		return this.directives.length > 0;
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

	getTrimmedText () {
		let ret = this.text.slice(0);
		while (!ret[0].length)
			ret.shift();
		while (!ret[ret.length-1].length)
			ret.pop();
		return ret;
	}

	getCompactText () {
		let trimmed = this.getTrimmedText();
		return trimmed.map((row) => row.trim()).join(" ");
	}

	getTrimmedRowCount () {
		return this.getTrimmedText().length;
	}

	/*
	 * For bulleted rows, extract what looks like the bullet, eg ` * ` or ` - `
	 *
	 * Accepted bullets: \*, -, +, >, ->, =>, #
	 *
	 * Treats as bullets any row starting with [ `...`: ] (returns [ \``: ])
	 *
	 * Bullets must be followed by space
	 *
	 * Returns `null` if no bullet or the bullet string if a bullet was found
	 */
	extractRowBullet (row) {
		if (row.match(/^[ \t]*`.+`:/) !== null)
			return row.slice(0, row.indexOf("`")) + "``:";
		let bullet = row.match(/^[ \t]*(\*|\-|\+|>|\->|\=>|#)[ \t]+/);
		if (bullet === null)
			return null;
		return bullet[0];
	}

	/*
	 * A section is a bullet section if it ends with one or more identical bullet
	 * lines
	 */
	extractSectionBullet (section) {
		let bullet = null;
		for (let i=0; i<section.length; i++) {
			if (section[i] === "")
				continue;
			let rowBullet = this.extractRowBullet(section[i]);
			if (rowBullet !== null) {
				if (bullet === null)
					bullet = rowBullet;
				if (bullet !== rowBullet)
					return null;
			}
			else if (bullet !== null) {
				if (section[i].slice(0, bullet.length) !== util.strFill(bullet.length))
					return null;
			}
		}
		return bullet;
	}

	/*
	 * Section fields:
	 * - `text`: string, the paragraph text (without bullet text)
	 * - `bullet`: string, bullet for this section
	 * - `bulletText`: array of sections, the text contained in the bullets (allows for nested bullets)
	 * - `indent`: string, indentation for this section
	 * - `startingRow`: number, starting row for this section
	 * - `rowCount`: number, row count for this section
	 * - `rowsBefore`: number, empty rows before this section
	 * - `rowsAfter`: number, empty rows after this section
	 */
	getSections () {
		let ret = [];
		let text = this.text.slice(0);
		let empty = 0;
		let currentRow = this.startingRow;
		let previous = null;
		let current = null;
		let queue = [];

		let getSectionFormatting = function (section) {
			if (section.text.length && section.text[0].match(/^[ \t]*::/) !== null)
				return "block";
			return "paragraph";
		};

		let newSection = function (currentRow, empty, text) {
			return {
				text: text !== undefined ? [ text ] : [],
				format: null,
				bullet: null,
				bulletText: [],
				indent: null,
				startingRow: currentRow,
				rowCount: 0,
				rowsBefore: empty,
				rowsAfter: 0
			};
		};

		let closeSection = function (section, currentRow) {
			section.indent = util.getIndent(section.text);
			section.format = getSectionFormatting(section);
			if (section.format === "block")
				section.text = util.trim(section.text).map((el) => util.trim(el.replace("::", "")));
			else
				section.text = util.trim(section.text).join(" ");
			section.rowCount = currentRow - section.startingRow;
		};

		// section ends if an empty row is found or if the bullet section ends
		while (text.length) {

			let sectionEnd = false;

			// get next row
			let row = text.shift();

			if (row.length === 0) {
				// if empty row, count it and mark section end if we are currently parsing a section
				if (current !== null)
					sectionEnd = true;
				empty++;
			}
			else {
				// if row is not empty, create a new section if not created yet and store the
				// empty row count in previous section if any
				if (current === null) {
					current = newSection(currentRow, empty);
					if (previous !== null)
						previous.rowsAfter = empty;
					empty = 0;
				}
				// check if row is part of a bulleted list
				let bullet = this.extractRowBullet(row);
				if (bullet !== null) {
					// we have three options
					if (current.bullet === null) {
						// first bullet in the section
						current.bullet = bullet;
						if (bullet.indexOf("``:") !== -1)
							current.bulletText.push(util.trim(row));
						else
							current.bulletText.push(row.slice(current.bullet.length));
						row = null;
					}
					else if (current.bullet && current.bullet === bullet) {
						// same as other bullets
						if (bullet.indexOf("``:") !== -1)
							current.bulletText.push(util.trim(row));
						else
							current.bulletText.push(row.slice(current.bullet.length));
						row = null;
					}
					else {
						// different kind of bullet, either turn the last bullet into a new section so we can nest this
						// or go back to a previous section if this bullet is found in the previous list
						let queueIndex = -1;
						for (let i=0; i<queue.length; i++) {
							if (queue[i].bullet === bullet) {
								queueIndex = i;
								break;
							}
						}
						if (queueIndex === -1) {
							// not found, create new nested bullet
							current.bulletText[current.bulletText.length - 1] =
								newSection(currentRow - current.text.length - empty,
									empty, current.bulletText[current.bulletText.length - 1]);
							queue.push(current);
							current = current.bulletText[current.bulletText.length - 1];
							current.bullet = bullet;
							if (bullet.indexOf("``:") !== -1)
								current.bulletText.push(util.trim(row));
							else
								current.bulletText.push(row.slice(current.bullet.length));
							row = null;
						}
						else {
							// found, close all queues up to that point
							while (queue.length > queueIndex) {
								closeSection(current, currentRow);
								current = queue.pop();
							}
							if (current.bullet.indexOf("``:") !== -1)
								current.bulletText.push(util.trim(row));
							else
								current.bulletText.push(row.slice(current.bullet.length));
						}
					}
				}
				else {
					// this row has no bullet, we have three options
					if (current.bullet === null) {
						// if section does not have bullets yet, append to current section
						current.text.push(row);
						row = null;
					}
					else {
						// section has bullets
						if (row.slice(0, current.bullet.length) === util.strFill(current.bullet.length, " ")) {
							// part of a previous bullet
							current.bulletText.push(util.trim(current.bulletText.pop()) + " " + util.trim(row));
						}
						else {
							// this row is not part of previous bullet, so we have to start a new section
							// not setting row to null will add it to the new section when created
							sectionEnd = true;
							// put the row back so it's processed when doing the next section
							text.unshift(row);
							currentRow--;
						}
					}
				}
			}

			// we are at the end of a section, we have to push it to the returned list
			// and set the previous reference to it
			if (sectionEnd) {
				// close all sections in the queue
				while (queue.length > 0) {
					closeSection(current, currentRow);
					current = queue.pop();
				}
				// close the one current section and push it to the returned array
				if (current !== null) {
					closeSection(current, currentRow);
					ret.push(current);
				}
				previous = current;
				current = null;
			}

			currentRow++;

		}

		return ret;
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

	getExportedName () {
		if (this.exportedName)
			return this.exportedName;
		return this.identifier.name;
	}

	getNamespacePath () {
		let ret = [];
		let target = this;
		while (target) {
			let name = target.getExportedName();
			if (name !== "<empty>")
				ret.unshift(name);
			if (!(target.getParent instanceof Function))
				break;
			target = target.getParent();
		}
		return ret;
	}

	getArguments () {
		return this.args.slice(0);
	}

	getBody () {
		return this.body;
	}

	getContentBlock () {
		return this.contentBlock ? this.contentBlock : null;
	}

	buildMeta () {
		// only build meta if the first level 1 of this block contains the @parse directive
		let head = this.getPrev(1, CommentBlock);
		if (head === null)
			return;
		if (head.getDirectivesByVerb("parse").length > 0) {
			this.contentBlock = new ContentBlock(this.body, this.startingRow);
			this.contentBlock.setParent(this);
		}
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

	getExportedName () {
		if (this.exportedName)
			return this.exportedName;
		return this.identifier.name;
	}

	getNamespacePath () {
		let ret = [];
		let target = this;
		while (target) {
			let name = target.getExportedName();
			if (name !== "<empty>")
				ret.unshift(name);
			if (!(target.getParent instanceof Function))
				break;
			target = target.getParent();
		}
		return ret;
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
		this.contentBlock.setParent(this);
	}

	getIdentifierName () {
		return this.identifier.name;
	}

	getIdentifierType () {
		return this.identifier.type;
	}

	getExportedName () {
		if (this.exportedName)
			return this.exportedName;
		return this.identifier.name;
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

	getContentBlock () {
		return this.contentBlock;
	}

	getBlockByPath (path) {
		let first = path[0];
		if (first === "prototype")
			return this.contentBlock.getBlockByPath(path.slice(1));
		// TODO: handle cases which don't address the prototype object
		return null;
	}

	getAssignedFieldsList () {
		return this.contentBlock.getAssignedFieldsList([ this.getExportedName(), "prototype" ]);
	}

	getAssignedFieldsTree () {
		let ret = {};
		let tree = this.contentBlock.getAssignedFieldsTree();
		ret[this.getExportedName()] = { prototype: tree };
		return ret;
	}

	getAssignedFieldsPaths () {
		return this.contentBlock.getAssignedFieldsPaths([ this.getExportedName(), "prototype" ]);
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

	getExportedName () {
		if (this.exportedName)
			return this.exportedName;
		return this.name;
	}

	getNamespacePath () {
		let ret = [ this.getExportedName() ];
		let target = this.getParent();
		if (target === null)
			return ret;
		target = target.getParent();
		if (target === null)
			return ret;
		ret.unshift(target.getExportedName());
		return ret;
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
			specific.setParent(this);
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

	getExportedName () {
		return "<empty>";
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

	getBlockIndex (block) {
		return this.blocks.indexOf(block);
	}

	sliceContent (start, end) {
		this.blocks = this.blocks.slice(start, end);
		this.blocks[0].setPrev(0, null);
		this.blocks[0].setPrev(1, null);
		this.blocks[0].setPrev(2, null);
		this.blocks[this.blocks.length-1].setNext(0, null);
		this.blocks[this.blocks.length-1].setNext(1, null);
		this.blocks[this.blocks.length-1].setNext(2, null);
	}

	getFirstBlock () {
		return this.blocks[0];
	}

	getBlockByFieldName (name) {
		for (let i=0; i<this.blocks.length; i++) {
			if (this.blocks[i].getFieldName instanceof Function)
				if (this.blocks[i].getFieldName() === name)
					return this.blocks[i];
		}
		return null;
	}

	getBlockByIdentifierName (name) {
		for (let i=0; i<this.blocks.length; i++) {
			if (this.blocks[i].getIdentifierName instanceof Function)
				if (this.blocks[i].getIdentifierName() === name)
					return this.blocks[i];
		}
		return null;
	}

	getBlocksByType (type) {
		let ret = [];
		for (let i=0; i<this.blocks.length; i++)
			if (this.blocks[i].getType() === type)
				ret.push(this.blocks[i]);
		return ret;
	}

	getBlocksByInstance (instance) {
		let ret = [];
		for (let i=0; i<this.blocks.length; i++)
			if (this.blocks[i] instanceof instance)
				ret.push(this.blocks[i]);
		return ret;
	}

	getBlockByPath (path) {
		let first = this.getBlockByIdentifierName(path[0]);
		if (first === null)
			first = this.getBlockByFieldName(path[0]);
		if (path.length === 1)
			return first;
		if (first && (first.getBlockByPath instanceof Function))
			return first.getBlockByPath(path.slice(1));
		return null;
	}

	getAssignedFieldsList (path) {
		if (path === undefined)
			path = [];
		let ret = {};
		for (let i=0; i<this.blocks.length; i++) {
			let fields = this.blocks[i].getAssignedFields();
			for (let j in fields) {
				let field = path.slice(0);
				field.push(this.blocks[i].getExportedName());
				field.push(j);
				ret[field.join(".")] = fields[j];
			}
		}
		return ret;
	}

	getAssignedFieldsTree (tree) {
		if (tree === undefined)
			tree = {};
		for (let i=0; i<this.blocks.length; i++) {
			let fields = this.blocks[i].getAssignedFields();
			let exportedName = this.blocks[i].getExportedName();
			for (let j in fields) {
				if (tree[exportedName] === undefined)
					tree[exportedName] = {};
				tree[exportedName][j] = fields[j];
			}
		}
		return tree;
	}

	getAssignedFieldsPaths (path) {
		if (path === undefined)
			path = [];
		let ret = [];
		for (let i=0; i<this.blocks.length; i++) {
			let fields = this.blocks[i].getAssignedFields();
			for (let j in fields) {
				let toPush = path.slice(0);
				toPush.push(this.blocks[i].getExportedName());
				toPush.push(j);
				ret.push(toPush);
			}
		}
		return ret;
	}

	toString () {
		let ret = [];
		for (let i=0; i<this.blocks.length; i++)
			ret.push(this.blocks[i].toString());
		return ret.join("\n\n");
	}

}

module.exports = CodeBlock;

module.exports.AssignmentBlock = AssignmentBlock;
module.exports.ClassBlock = ClassBlock;
module.exports.MethodBlock = MethodBlock;
module.exports.VariableBlock = VariableBlock;
module.exports.FunctionBlock = FunctionBlock;
module.exports.RequireBlock = RequireBlock;
module.exports.CommentBlock = CommentBlock;

module.exports.ContentBlock = ContentBlock;
