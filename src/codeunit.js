/*
 * CodeUnit class
 */

const CodeBlock = require("./codeblock.js");

const CommentBlock = CodeBlock.CommentBlock;
const RequireBlock = CodeBlock.RequireBlock;
const FunctionBlock = CodeBlock.FunctionBlock;
const VariableBlock = CodeBlock.VariableBlock;
const ClassBlock = CodeBlock.ClassBlock;
const AssignmentBlock = CodeBlock.AssignmentBlock;
const ContentBlock = CodeBlock.ContentBlock;

/*
 * CodeUnit class
 *
 * A code unit is basically a file containing code
 *
 * Code units can be linked in a tree structure by adding CodeUnit references
 * to the link.prev and link.next arrays
 * Use the `linkNext()` and `linkPrev()` method for this purpose
 */
class CodeUnit {

	constructor (content, row, path, name, description) {
		this.content = content;
		this.contentBlock = new ContentBlock(content, row);
		this.contentBlock.setParent(this);
		this.path = path;
		this.name = name;
		this.exportedName = null;
		this.description = description;
		this.buildMeta();
		this.link = {
			prev: [],
			next: []
		};
	}

	loadCode (content, row) {
		this.content = content;
		this.contentBlock.loadCode(content, row);
		this.buildMeta();
	}

	buildMeta () {
		this.meta = {};
		this.declaredClasses = [];
		this.declaredFunctions = [];
		this.declaredValues = [];
		this.exportedMain = null;
		this.exportedObjects = [];
		this.importedObjects = [];

		let blocks = this.contentBlock.getBlocks();
		for (let i=0; i<blocks.length; i++) {

			if (blocks[i] instanceof RequireBlock) {
				// pick up all imported objects from require blocks
				this.importedObjects.push({
					word: blocks[i].getIdentifierType(),
					name: blocks[i].getIdentifierName(),
					type: blocks[i].getModuleType(),
					path: blocks[i].getModulePath(),
					field: blocks[i].getModuleField()
				});
			}

			if (blocks[i] instanceof FunctionBlock) {
				// pick up all function declarations
				this.declaredFunctions.push({
					word: blocks[i].getIdentifierType(),
					name: blocks[i].getIdentifierName(),
					args: blocks[i].getArguments()
				});
			}

			if (blocks[i] instanceof ClassBlock) {
				// pick up all class declarations
				this.declaredClasses.push({
					word: blocks[i].getIdentifierType(),
					name: blocks[i].getIdentifierName(),
					super: blocks[i].getSuperName(),
					methods: blocks[i].getDeclaredMethods()
				});
			}

		}

		// processing assignments and variable declarations
		// this requires information on required and declared objects
		// therefore we have to do them separately

		// processing secondary imports (as var declarations)
		blocks = this.contentBlock.getBlocksByType("varDeclaration");
		for (let i=0; i<blocks.length; i++) {
			// store the declaration
			this.declaredValues.push({
				word: blocks[i].getIdentifierType(),
				name: blocks[i].getIdentifierName(),
				value: blocks[i].getValue()
			});

			// we are looking for declarations that stem from an imported object
			let obj;
			for (let j=0; j<this.importedObjects.length; j++) {
				let imported = this.importedObjects[j].name;
				if (blocks[i].getValue().indexOf(imported + ".") === 0) {
					obj = this.importedObjects[j];
					break;
				}
			}
			if (obj === undefined)
				continue;
			let field = blocks[i].getValue().replace(obj.name + ".", "");
			this.importedObjects.push({
				word: blocks[i].getIdentifierType(),
				name: blocks[i].getIdentifierName(),
				type: obj.type,
				path: obj.path,
				field: field
			});
		}

		// processing exports
		blocks = this.contentBlock.getBlocksByType("assignment");
		for (let i=0; i<blocks.length; i++) {
			// we are looking for assignments to the module.exports object, which are
			// exported fields
			let target = blocks[i].getTarget();
			if (target.indexOf("module.exports") !== 0)
				continue;
			target = target.replace("module.exports", "");
			if (target === "")
				this.exportedMain = blocks[i].getValue();
			this.exportedObjects.push(blocks[i].getValue());
		}
	}

	getBlocks () {
		return this.contentBlock.getBlocks();
	}

	getBlocksByType (type) {
		return this.contentBlock.getBlocksByType(type);
	}

	getBlocksByInstance (instance) {
		return this.contentBlock.getBlocksByInstance(instance);
	}

	getBlockByPath (path) {
		return this.contentBlock.getBlockByPath(path);
	}

	getFirstBlock () {
		return this.contentBlock.getBlocks()[0];
	}

	getBlockAt (i) {
		return this.contentBlock.getBlocks()[i];
	}

	getBlockIndex (block) {
		return this.contentBlock.getBlocks().indexOf(block);
	}

	linkPrev (unit) {
		if (this.link.prev.indexOf(unit) === -1)
			this.link.prev.push(unit);
	}

	linkNext (unit) {
		if (this.link.next.indexOf(unit) === -1)
			this.link.next.push(unit);
	}

	getPrev () {
		return this.link.prev.slice(0);
	}

	getNext () {
		return this.link.next.slice(0);
	}

	getAllPrev () {
		let ret = [];
		let linked = this.getPrev();
		while (linked.length) {
			let unit = linked.shift();
			if (ret.indexOf(unit) !== -1)
				continue;
			ret.push(unit);
			linked = linked.concat(unit.getPrev());
		}
		return ret;
	}

	getAllNext () {
		let ret = [];
		let linked = this.getNext();
		while (linked.length) {
			let unit = linked.shift();
			if (ret.indexOf(unit) !== -1)
				continue;
			ret.push(unit);
			linked = linked.concat(unit.getNext());
		}
		return ret;
	}

	getFirst () {
		let ret = [];
		let done = [];
		let linked = this.getPrev();
		if (linked.length === 0)
			return [ this ];
		while (linked.length) {
			let unit = linked.shift();
			if (done.indexOf(unit) !== -1)
				continue;
			done.push(unit);
			let toConcat = unit.getPrev();
			if (toConcat.length)
				linked = linked.concat(toConcat);
			else
				ret.push(unit);
		}
		return ret;
	}

	getLast () {
		let ret = [];
		let done = [];
		let linked = this.getNext();
		if (linked.length === 0)
			return [ this ];
		while (linked.length) {
			let unit = linked.shift();
			if (done.indexOf(unit) !== -1)
				continue;
			done.push(unit);
			let toConcat = unit.getNext();
			if (toConcat.length)
				linked = linked.concat(toConcat);
			else
				ret.push(unit);
		}
		return ret;
	}

	getName () {
		return this.name;
	}

	getDescription () {
		return this.description;
	}

	getPath () {
		return this.path;
	}

	getContentBlock () {
		return this.contentBlock;
	}

	getContentLength () {
		return this.contentBlock.getContentLength();
	}

	getImportedObjects () {
		return this.importedObjects.slice(0);
	}

	getExportedObjects () {
		return this.exportedObjects.slice(0);
	}

	getExportedName () {
		if (this.exportedName !== null)
			return this.exportedName;
		if (this.exportedMain !== null)
			return this.exportedMain;
		if (this.path !== null)
			return this.path.split("/").pop().split(".").shift();
		return null;
	}

	setExportedName (name) {
		this.exportedName = name;
	}

	getMeta (field) {
		if (field === undefined)
			return this.meta;
		return this.meta[field];
	}

	setMeta (field, value) {
		if (field === undefined)
			return false;
		this.meta[field] = value;
	}

	toString () {
		let ret = this.contentBlock.toString();
		return ret;
	}

}

module.exports = CodeUnit;
