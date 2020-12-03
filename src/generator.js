/*
 * Generator class
 *
 * A generator is built around a code tree and performs the document generation steps:
 * - building document structure
 * - extracting comments and generating documentation text
 * - building text hierarchy within a file
 *
 * Content generation (file-based):
 * File-based content generation converts files into documentation files, with sections for
 * classes, functions, etc
 *
 * Content generation (object-based):
 * Object-based content generation creates an API-style documentation for each object
 * in the code
 */

const fs = require("fs");
const path = require("path");

const CodeBlock = require("./codeblock.js");

const CommentBlock = CodeBlock.CommentBlock;
const RequireBlock = CodeBlock.RequireBlock;
const FunctionBlock = CodeBlock.FunctionBlock;
const VariableBlock = CodeBlock.VariableBlock;
const ClassBlock = CodeBlock.ClassBlock;
const MethodBlock = CodeBlock.MethodBlock;
const AssignmentBlock = CodeBlock.AssignmentBlock;
const ContentBlock = CodeBlock.ContentBlock;

const util = require("./util.js");

const DEFAULT_CONF_PY_TEMPLATE = fs.readFileSync(path.join(__dirname, "../templates/conf.py.template")).toString();
const DEFAULT_MAKEFILE_TEMPLATE = fs.readFileSync(path.join(__dirname, "../templates/Makefile.template")).toString();
const DEFAULT_MAKE_BAT_TEMPLATE = fs.readFileSync(path.join(__dirname, "../templates/make.bat.template")).toString();

const DEFAULT_SETTINGS = require("./default_settings.js");

class Generator {

	/*
	 * The Generator is built around a CodeTree object
	 * `codeTree`: CodeTree object, the code tree for this generator
	 * `settings`: object, any settings in this object will replace the default settings for
	 *    this Generator object
	 */
	constructor (codeTree, settings) {
		this.codeTree = codeTree;
		this.settings = settings !== undefined ? settings : {};
		this.introSections = [];
		this.endingSections = [];
		this.templates = {};
		this.project = {};
		this.confPyTemplate = DEFAULT_CONF_PY_TEMPLATE;
		this.makefileTemplate = DEFAULT_MAKEFILE_TEMPLATE;
		this.makeBatTemplate = DEFAULT_MAKE_BAT_TEMPLATE;

		util.applyDefaults(this.settings, DEFAULT_SETTINGS);
	}

	/*
	 * Set project meta from object (key-value pairs); Only specified keys will be set/replaced
	 * `meta`: object, metadata in package.json format; Relevant fields
	 * - `name`: string, project name
	 * - `copyright`: string, copyright information
	 * - `author`: string, author name
	 * - `version`: string, version number, including tags
	 */
	setProjectMeta (meta) {
		if (typeof(meta) === "string")
			meta = JSON.parse(meta);
		if (meta.name)
			this.project.name = meta.name;
		if (meta.copyright)
			this.project.copyright = meta.copyright;
		if (meta.author)
			this.project.author = meta.author;
		if (meta.version)
			this.project.version = meta.version;
		if (!(this.project.name))
			this.project.name = "Unnamed Project";
		if (!(this.project.author))
			this.project.author = "Unknown Author";
		if (!(this.project.copyright))
			this.project.copyright = (new Date()).getFullYear() + ", " + this.project.author;
		if (!(this.project.version))
			this.project.version = "0.0.1";
	}

	/*
	 * Set conf.py template to replace the defaults loaded at object creation
	 * `template`: string, template contents
	 */
	setConfPyTemplate (template) {
		this.confPyTemplate = template;
	}

	/*
	 * Set Makefile template to replace the defaults loaded at object creation
	 * `template`: string, template contents
	 */
	setMakefileTemplate (template) {
		this.makefileTemplate = template;
	}

	/*
	 * Set make.bat template to replace the defaults loaded at object creation
	 * `template`: string, template contents
	 */
	setConfPyTemplate (template) {
		this.makeBatTemplate = template;
	}

	/*
	 * Intro sections are files to be included before the actual documentation
	 * `path`: string, path for this file
	 * `content`: content for this file (string or rows), this will be copied directly
	 */
	addIntroSection (path, content) {
		this.introSections.push({
			path: path,
			content: content
		});
	}

	/*
	 * Ending sections are files to be included after the actual documentation
	 * `path`: string, path for this file
	 * `content`: content for this file (string or rows), this will be copied directly
	 */
	addEndingSection (path, content) {
		this.endingSections.push({
			path: path,
			content: content
		});
	}

	/*
	 * Return an array of rows (most likely empty) to separate two text elements,
	 * eg two paragraphs or a paragraph and a title
	 * `before`: object, first text element object `{ style, text }`
	 * `after`: object, second text element object `{ style, text }`
	 * `settings`: object, settings object
	 * Returns the array of output rows (array of strings)
	 */
	interRows (before, after, settings) {
		let ret = [];
		switch (after.style) {
			case "l1":
			case "l2":
			case "l3":
			case "l4":
			case "l5":
			case "l6":
			case "l7":
			case "l8":
				if (before.style[0] !== "l")
					ret.push("");
				break;
			case "dl":
				if (before.style !== "dl" && before.style !== "dh")
					ret.push("");
				break;
			case "db":
				if (before.style !== "db" && before.style !== "dh")
					ret.push("");
				break;
			case "h1":
			case "h2":
			case "h3":
			case "h4":
			case "h5":
				ret.push("");
				ret.push("");
				break;
			case "p":
			case "b":
			case "c":
			case "dh":
			default:
				ret.push("");
		}
		return ret;
	}

	/*
	 * Intro sections are files to be included before the actual documentation
	 * `path`: string, path for this file
	 * `content`: content for this file (string or rows), this will be copied directly
	 */
	addIntroSection (path, content) {
		this.introSections.push({
			path: path,
			content: content
		});
	}

	/*
	 * Ending sections are files to be included after the actual documentation
	 * `path`: string, path for this file
	 * `content`: content for this file (string or rows), this will be copied directly
	 */
	addEndingSection (path, content) {
		this.endingSections.push({
			path: path,
			content: content
		});
	}

	/*
	 * Return an array of rows corresponding to a text element
	 * `section`: object, text element object
	 * - `style`: string, style to apply to this text element, eg `h1`, `b`, `p` etc
	 * - `text`: string, the actual text for this text element
	 * `settings`: object, settings object
	 * Returns the array of output rows (array of strings)
	 */
	textRows (section, settings) {
		let ret = [];
		if (!section.text)
			return ret;

		let min = settings.output.minColumns;
		let max = settings.output.maxColumns;

		// before
		switch (section.style) {
			case "h1":
				if (this.settings.output.sectionUnderlines[0].length > 1)
					ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[0][0]));
				break;
			case "h2":
				if (this.settings.output.sectionUnderlines[1].length > 1)
					ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[1][0]));
				break;
			case "h3":
				if (this.settings.output.sectionUnderlines[2].length > 1)
					ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[2][0]));
				break;
			case "h4":
				if (this.settings.output.sectionUnderlines[3].length > 1)
					ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[3][0]));
				break;
			case "h5":
				if (this.settings.output.sectionUnderlines[4].length > 1)
					ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[4][0]));
				break;
		}

		// text
		switch (section.style) {
			case "c":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 3, min), { firstRow: ".. ", otherRows: "", width: 3 }
				));
				break;
			case "dh":
				ret.push(".. " + section.text + "::");
				break;
			case "db":
				ret.push("   " + section.text);
				break;
			case "dl":
				ret.push("   :" + section.text);
				break;
			case "b":
				ret = ret.concat(util.wrapText("**" + section.text + "**", max, min));
				break;
			case "l":
			case "l1":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 2, min), { firstRow: "* ", otherRows: "", width: 2 }
				)); 
				break;
			case "l2":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 5, min), { firstRow: "* ", otherRows: "", width: 5 }
				)); 
				break;
			case "l3":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 8, min), { firstRow: "* ", otherRows: "", width: 8 }
				)); 
				break;
			case "l4":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 11, min), { firstRow: "* ", otherRows: "", width: 11 }
				)); 
				break;
			case "l5":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 14, min), { firstRow: "* ", otherRows: "", width: 14 }
				)); 
				break;
			case "l6":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 17, min), { firstRow: "* ", otherRows: "", width: 17 }
				)); 
				break;
			case "l7":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 20, min), { firstRow: "* ", otherRows: "", width: 20 }
				)); 
				break;
			case "l8":
				ret = ret.concat(util.padBlock(
					util.wrapText(section.text, max - 23, min), { firstRow: "* ", otherRows: "", width: 23 }
				)); 
				break;
			default:
				ret = ret.concat(util.wrapText(section.text, max, min));
		}

		// after
		switch (section.style) {
			case "h1":
				ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[0].slice(-1)));
				break;
			case "h2":
				ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[1].slice(-1)));
				break;
			case "h3":
				ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[2].slice(-1)));
				break;
			case "h4":
				ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[3].slice(-1)));
				break;
			case "h5":
				ret.push(util.strFill(section.text.length, this.settings.output.sectionUnderlines[4].slice(-1)));
				break;
		}

		return ret;
	}

	/*
	 * Convert an array of text elements into an array of rows for output
	 * `text`: array of objects, the array of text element objects to be converted
	 * `settings`: object, settings object
	 * Returns the array of output rows (array of strings)
	 */
	textToOutputRows (text, settings) {
		let ret = [];

		for (let i=0; i<text.length; i++) {
			if (i > 0)
				ret = ret.concat(this.interRows(text[i-1], text[i], settings));
			ret = ret.concat(this.textRows(text[i], settings));
		}

		return ret;
	}

	/*
	 * Convert comment sections to text
	 * `sections`: array of sections, block sections to convert to text
	 * `settings`: settings object, settings to apply for this conversion
	 * `filter`: Function, optional, call this function on all comment rows
	 */
	commentSectionsToText (sections, settings, filter) {
		let text = [];
		// for now we just copy the text as it is
		// TODO: parse argument lists, types, bullets, return values etc
		let queue = [];
		let current = null;
		for (let i=0; i<sections.length; i++) {
			text.push({ style: "p", text: sections[i].text });
			if (sections[i].bulletText && sections[i].bulletText.length > 0) {
				queue = [];
				current = sections[i].bulletText;
				while (current && current.length) {
					let row = current.shift();
					if (typeof(row) === "string") // simple string bullet, no nesting
						text.push({ style: "l" + (queue.length + 1), text: row });
					else {
						// nested bullet, we print the text and set current to nested list
						text.push({ style: "l" + (queue.length + 1), text: row.text });
						queue.push(current);
						current = row.bulletText;
					}
					// if we are done with current list, pull the next non-empty from the queue
					while (current.length === 0 && queue.length > 0)
						current = queue.pop();
				}
			}
		}
		return text;
	}

	/*
	 * Convert a comment block to text
	 * `commentBlock`: CommentBlock object, block to convert to text
	 * `settings`: settings object, settings to apply for this conversion
	 * `filter`: Function, optional, call this function on all comment rows
	 */
	commentBlockToText (commentBlock, settings, filter) {
		let text = [];
		// for now we just copy the text as it is
		// TODO: parse argument lists, types, bullets, return values etc
		let sections = commentBlock.getSections();
		return this.commentSectionsToText(sections, settings, filter);
	}

	generateFileHeader (codeUnit, settings, headerDepth) {
		let text = [];
		let firstBlock = codeUnit.getFirstBlock();

		if (headerDepth === undefined)
			headerDepth = 1;

		// set title to just the path to the file and the description to null for now
		let title = codeUnit.getPath();
		let description = null;
		let intro = null;

		// if we have a header, read the title and description from the header
		if (this.settings.code.fileHeaders && (firstBlock instanceof CommentBlock)) {
			let sections = firstBlock.getSections();

			if (this.settings.code.fileTitle && sections.length &&
				sections[0].rowCount <= this.settings.code.fileTitleMaxRows &&
				sections[0].bullet === null)
			{
				let section = sections.shift();
				title = section.text + " (" + title + ")";
			}

			if (this.settings.code.fileDescription && sections.length &&
				sections[0].rowCount <= this.settings.code.fileDescriptionMaxRows &&
				sections[0].bullet === null)
			{
				let section = sections.shift();
				description = section.text;
			}

			intro = sections;
		}

		// finally, overwrite with codeunit title and description if any provided
		if (codeUnit.getName())
			title = codeUnit.getName() + " (" + codeUnit.getPath() + ")";
		if (codeUnit.getDescription())
			description = codeUnit.getDescription();

		text.push({ style: "h" + headerDepth, text: title });
		text.push({ style: "b", text: description });
		if (intro !== null)
			text = text.concat(this.commentSectionsToText(intro));

		let block = firstBlock.getNext(0);
		while ((block instanceof CommentBlock) && (block.getNext(1) === null)) {
			text = text.concat(this.commentBlockToText(block));
			block = block.getNext(0);
		}

		return text;
	}

	generateClassDocumentation (classBlock, commentBlock, settings, headerDepth, meta) {
		let text = [];

		if (headerDepth === undefined)
			headerDepth = 1;

		if (meta === undefined)
			meta = {};

		let name = "class " + classBlock.getIdentifierName();

		if (meta.exported === true)
			name += " (exported class)";
		if (meta.exported === false)
			name += " (internal only)";

		text.push({ style: "h" + headerDepth, text: name });

		let base = classBlock.getSuperName();
		if (base === null)
			text.push({ style: "p", text: "**Base class:** Object" });
		else
			text.push({ style: "p", text: "**Base class:** " + base });

		if (commentBlock !== null)
			text = text.concat(this.commentBlockToText(commentBlock, settings));

		let contentBlock = classBlock.getContentBlock();

		let constructorBlock = contentBlock.getBlockByFieldName("constructor");
		let comment = null;
		if (constructorBlock !== null) {
			comment = constructorBlock.getPrev(1, CommentBlock);
			text = text.concat(this.generateFunctionDocumentation(
				constructorBlock, comment, settings, headerDepth + 1, { type: "constructor" }));
		}

		text.push({ style: "h" + (headerDepth + 1), text: "Member methods" });

		let subText = [];
		let endText = [];

		let blocks = contentBlock.getBlocksByInstance(MethodBlock);
		for (let i=0; i<blocks.length; i++) {
			if (blocks[i] === constructorBlock)
				continue;
			comment = blocks[i].getPrev(1, CommentBlock);
			subText = subText.concat(this.generateFunctionDocumentation(
				blocks[i], comment, settings, headerDepth + 2, { type: "method" }));
			if (settings.structure.generateAliasEntries) {
				let aliases = blocks[i].getAliases();
				for (let j=0; j<aliases.length; j++) {
					let aliasDocumentation = this.generateFunctionDocumentation(
						blocks[i], comment, settings, headerDepth + 2,
						{ type: "method", alias: aliases[j] });
					if (settings.structure.groupAliasesTogether)
						endText = endText.concat(aliasDocumentation);
					else
						subText = subText.concat(aliasDocumentation);
				}
			}
		}

		if (subText.length || endText.length) {
			text.push({ style: "p", text: "This class defines the following member methods" });
			text = text.concat(subText);
			text = text.concat(endText);
		}
		else
			text.push({ style: "p", text: "This class does not define any member methods" });

		subText = [];
		let fields = classBlock.getAssignedFieldsList();
		for (let i in fields) {
			subText.push({ style: "h" + (headerDepth + 2), text: i });
			let titleComment = this.getTitleComment(fields[i], settings);
			let commentBlock = fields[i].getPrev(0);
			if (commentBlock === titleComment || !(commentBlock instanceof CommentBlock))
				commentBlock = null;
			if (commentBlock === null && titleComment)
				subText.push({ style: "p", text: titleComment.getCompactText() });
			if (commentBlock && titleComment === null)
				subText.push({ style: "p", text: commentBlock.getCompactText() });
			if (commentBlock && titleComment)
				subText.push({ style: "p",
					text: commentBlock.getCompactText() + " (" + titleComment.getCompactText() + ")"
				});
			subText.push({ style: "l1", text: "declared as `" + fields[i].getIdentifierType() + " " +
				fields[i].getIdentifierName() + "`" });
			subText.push({ style: "l1", text: "initial value: `" + fields[i].getValue() + "`" });
		}

		if (subText.length) {
			text.push({ style: "h" + (headerDepth + 1), text: "Fields and Properties" });
			text = text.concat(subText);
		}

		return text;
	}

	generateFunctionDocumentation (functionBlock, commentBlock, settings, headerDepth, meta) {
		let text = [];

		if (headerDepth === undefined)
			headerDepth = 1;

		if (meta === undefined)
			meta = {};
		if (meta.type === undefined)
			meta.type = "function";

		let args = functionBlock.getArguments();

		// get all name elements in an array that will be joined with . after
		let name;
		let aliasedName;
		if (meta.type === "constructor")
			name = [ "Constructor" ];
		else {
			if (meta.exported || meta.type === "method") {
				// if it's an exported function, output the full path
				let path = functionBlock.getNamespacePath();
				if (meta.type === "method") {
					// if this is a method, insert the "prototype" object in the path
					name = path.pop();
					path.push("prototype");
					path.push(name);
				}
				name = path;
			}
			else
				name = [ functionBlock.getIdentifierName() ];
		}

		// if this is an alias, replace the last element in the name with the alias name
		if (meta.alias) {
			aliasedName = name.join(".");
			name[name.length-1] = meta.alias;
		}

		name = name.join(".") + " (" + args.join(", ") + ")";

		if (headerDepth)
			text.push({ style: "h" + headerDepth, text: name });

		// if this is an alias, present this information
		if (meta.alias) {
			text.push({ style: "p", text: "Alias of `" + aliasedName + "`"});
			// continue only if expandAliases is set to true
			if (!settings.structure.expandAliases)
				return text;
		}

		// if no comment is provided, just list the arguments
		if (commentBlock === null) {
			text.push({ style: "b", text: "Arguments"});
			if (args.length === 0)
				text.push({ style: "p", text: "This " + meta.type + " does not take any arguments"});
			else
				args.map((arg) => text.push({ style: "l", text: "`" + arg + "`" }));
		}
		else
			text = text.concat(this.commentBlockToText(commentBlock, settings));

		// list aliases
		let aliases = functionBlock.getAliases();
		if (meta.alias)
			aliases.splice(aliases.indexOf(meta.alias), 1);
		if (aliases.length)
			text.push({ style: "p", text: (meta.alias !== undefined ? "**Other aliases:** " : "**Aliases:** ") +
				"`" + aliases.join("`, `") + "`" });

		return text;
	}

	generateVarDocumentation (varBlock, commentBlock, settings, headerDepth, meta) {
		let text = [];

		if (headerDepth === undefined)
			headerDepth = 1;
		if (meta === undefined)
			meta = {};

		return text;
	}

	generateVarGroupDocumentation (group, settings, headerDepth, meta) {
		let text = [];

		if (headerDepth === undefined)
			headerDepth = 1;
		if (meta === undefined)
			meta = {};

		if (group.titleComment !== null) {
			text.push({ style: "h" + headerDepth, text: group.titleComment.getCompactText() });
			headerDepth++;
		}
		else if (meta.groupCount > 1) {
			text.push({ style: "h" + headerDepth, text: "Other Declared Variables" });
			headerDepth++;
		}

		for (let i=0; i<group.variables.length; i++) {
			let varBlock = group.variables[i].variableBlock;
			let comBlock = group.variables[i].commentBlock;
			let exported = true;
			if (!meta.exported || meta.exported.indexOf(varBlock.getIdentifierName()) === -1)
				exported = false;

			text.push({
				style: "h" + headerDepth,
				text: varBlock.getIdentifierType() + " " + varBlock.getIdentifierName()
			});
			if (comBlock !== null)
				text.push({ style: "p", text: comBlock.getCompactText() });
			if (exported)
				text.push({ style: "l1", text: "exported as " + varBlock.getNamespacePath().join(".") });
			else
				text.push({ style: "l1", text: "not exported" });
			text.push({ style: "l1", text: "initial value: `" + varBlock.getValue() + "`" });
		}

		return text;
	}

	generateSection (title, content, settings, headerDepth) {
		let text = [];	

		if (headerDepth === undefined)
			headerDepth = 1;

		text.push({ style: "h" + headerDepth, text: title });
		for (let i=0; i<content.length; i++) {
			text = text.concat(content[i]);
		}

		return text;
	}

	isTitleComment (block, settings) {
		if (!(block instanceof CommentBlock))
			return false;
		if (block.getTrimmedRowCount() > settings.code.sectionTitleMaxRows)
			return false;
		if (block.getTrimmedRowCount() === block.getRowCount())
			return false;
		return true;
	}

	getTitleComment (block, settings) {
		// go up to the first block of this type and ignore comments
		let current = block;
		let firstBlock = block;

		while (current.getType() === block.getType() || (current instanceof CommentBlock)) {
			// break on double comment blocks
			if ((current instanceof CommentBlock) && (current.getPrev(0) instanceof CommentBlock))
				break;
			if (!(current instanceof CommentBlock))
				firstBlock = current;
			current = current.getPrev(0);
		}

		// try to get a title comment
		let titleComment = firstBlock.getPrev(0);
		if (titleComment instanceof CommentBlock && this.isTitleComment(titleComment.getPrev(0), settings))
			titleComment = titleComment.getPrev(0);
		else if (!this.isTitleComment(titleComment, settings))
			titleComment = null;

		return titleComment;
	}

	groupVarDeclarations (contentBlock, settings) {
		let ret = [];

		let current = contentBlock.getFirstBlock().getNext(0, VariableBlock);
		let noTitleGroup = null;

		while (current !== null) {
			let section = { variables: [] };

			// try to get a title comment
			let titleComment = this.getTitleComment(current, settings);

			if (titleComment === null) {
				if (noTitleGroup === null)
					noTitleGroup = section;
				else
					section = noTitleGroup;
			}

			section.titleComment = titleComment;

			while (current instanceof VariableBlock) {
				let comment = current.getPrev(1);
				if (!(comment instanceof CommentBlock))
					comment = null;

				section.variables.push({ variableBlock: current, commentBlock: comment });

				current = current.getNext(0);
				while (current instanceof CommentBlock) {
					if (this.isTitleComment(current, settings))
						break;
					current = current.getNext(0);
				}
			}

			if (titleComment !== null)
				ret.push(section);
			current = current.getNext(0, VariableBlock);
		}

		if (noTitleGroup !== null)
			ret.push(noTitleGroup);

		return ret;
	}

	generateCodeDocumentation (codeUnit, settings, headerDepth, options) {
		let ret = [];

		if (headerDepth === undefined)
			headerDepth = 1;
		if (options === undefined)
			options = { includeInternal: true };

		ret = ret.concat(this.generateFileHeader(codeUnit, settings, headerDepth));

		// store all exported and internal objects in these arrays
		let exported = { classes: [], variables: [], functions: [] };
		let internal = { classes: [], variables: [], functions: [] };
		let classes = { exported: [], internal: [] };
		let variables = { exported: [], internal: [] };
		let functions = { exported: [], internal: [] };

		let exportedObjects = codeUnit.getExportedObjects();

		let blocks = codeUnit.getBlocks();
		let meta;
		for (let i=0; i<blocks.length; i++) {
			let comment = blocks[i].getPrev(1, CommentBlock);
			meta = {};
			if (blocks[i].getIdentifierName instanceof Function)
				meta.exported = exportedObjects.indexOf(blocks[i].getIdentifierName()) !== -1;
			switch (blocks[i].getType()) {
				case "classDeclaration":
					if (options.objectsOnly)
						break;
					let classDocumentation =
						this.generateClassDocumentation(blocks[i], comment, settings, headerDepth + 1, meta);
					if (meta.exported) {
						classes.exported.push(classDocumentation);
					}
					else {
						if (options.includeInternal)
							classes.internal.push(classDocumentation);
					}
					break;
				case "funDeclaration":
					let functionDocumentation =
						this.generateFunctionDocumentation(blocks[i], comment, settings, headerDepth + 2, meta);
					if (meta.exported) {
						functions.exported.push(functionDocumentation);
					}
					else {
						if (options.includeInternal)
							functions.internal.push(functionDocumentation);
					}
					break;
				case "varDeclaration":
					let varDocumentation =
						this.generateVarDocumentation(blocks[i], comment, settings, headerDepth + 2, meta);
					if (meta.exported) {
						variables.exported.push(varDocumentation);
					}
					else {
						if (options.includeInternal)
							variables.internal.push(varDocumentation);
					}
					break;
			}
		}

		let varGroups = this.groupVarDeclarations(codeUnit.getContentBlock(), settings);

		// classes get their own sections
		classes.exported.map((section) => ret = ret.concat(section));
		classes.internal.map((section) => ret = ret.concat(section));

		// functions are exported in "function" sections
		if (functions.exported.length)
			ret = ret.concat(this.generateSection("Exported Functions", functions.exported, settings, headerDepth + 1));
		if (functions.internal.length)
			ret = ret.concat(this.generateSection("Internal Functions", functions.internal, settings, headerDepth + 1));

		// variables are exported in "variables" sections
		if (varGroups.length) {
			meta = { groupCount: varGroups.length, exported: variables.exported };
			ret.push({ style: "h" + (headerDepth + 1), text: "Variable Declarations" });
			for (let i=0; i<varGroups.length; i++) {
				let documentation = this.generateVarGroupDocumentation(varGroups[i], settings, headerDepth + 2, meta);
				ret = ret.concat(documentation);
			}
		}

		ret.push({ style: "p", text: "Generated at " + (new Date()) });

		return this.textToOutputRows(ret, settings);
	}

	/*
	 * Generate Index with Table of Contents from file content
	 */
	generateIndex (files, settings) {
		let ret = [];

		ret.push({ style: "c", text: this.project.name + " Documentation master file, created by " +
			"dgen-one documentation generator on " + (new Date()).toGMTString() + ". " +
			"You can adapt this file completely to your liking, but it should at least contain the " +
			"root `toctree` directive." });

		ret.push({ style: "h1", text: this.project.name + " Documentation" });

		ret.push({ style: "dh", text: "toctree" });
		ret.push({ style: "dl", text: "maxdepth: 2" });
		ret.push({ style: "dl", text: "caption: Contents:" });

		for (let i=0; i<files.length; i++)
			ret.push({ style: "db", text: files[i].path });

		ret.push({ style: "h1", text: "Indices and tables" });

		ret.push({ style: "l1", text: ":ref:`genindex`" });
		ret.push({ style: "l1", text: ":ref:`modindex`" });
		ret.push({ style: "l1", text: ":ref:`search`" });

		return this.textToOutputRows(ret, settings);
	}

	formatArray (arr) {
		if (!arr)
			return "[]";
		let ret = arr.map((el) => {
			if (typeof(el) === "string")
				return "'" + el + "'";
			return el;
		});
		return "[" + ret.join(", ") + "]";
	}

	replaceTemplateToken (row, token, settings) {
		let ret = [];
		let rep = "%" + token + "%";
		switch (token) {
			case "name":
			case "copyright":
			case "author":
				ret.push(row.replace(rep, this.project[token]));
				break;
			case "release":
				ret.push(row.replace(rep, this.project.version));
				break;
			case "extensions":
				ret.push(row.replace(rep, this.formatArray(settings.output.sphinxExtensions)));
				break;
			case "templates_path":
				ret.push(row.replace(rep, this.formatArray(settings.output.sphinxTemplates)));
				break;
			case "exclude_patterns":
				ret.push(row.replace(rep, this.formatArray(settings.output.sphinxExculdePatterns)));
				break;
			case "html_theme":
				ret.push(row.replace(rep, "'" + settings.output.sphinxHtmlTheme + "'"));
				break;
			case "html_static_path":
				ret.push(row.replace(rep, this.formatArray(settings.output.sphinxHtmlStaticPath)));
				break;
		}
		return ret;
	}

	generateConfPy (settings) {
		let ret = [];
		let template = this.confPyTemplate.split("\n");

		let tokens = [ "name", "copyright", "author", "release",
			"extensions", "templates_path", "exclude_patterns", "html_theme", "html_static_path" ];
		let tokenRegexp = new RegExp("(?<=%)(" + tokens.join("|") + ")(?=%)", "g");

		for (let i=0; i<template.length; i++) {
			let row = template[i];
			let match = row.match(tokenRegexp);
			if (match === null)
				ret.push(row);
			else
				ret = ret.concat(this.replaceTemplateToken(row, match[0], settings));
		}

		return ret;
	}

	generateFileFromTemplate (template, settings) {
		let rows = template.split("\n");
		return rows;
	}

	generateTextDocumentation (textUnit, settings) {
	}

	generateAuxiliaryFiles (files, settings) {
		let ret = files;

		if (settings.structure.generateIndex) {
			let index = this.generateIndex(ret, settings);
			ret.push({ path: "index.rst", content: index });
		}

		if (settings.structure.generateConfPy) {
			let confpy = this.generateConfPy(settings);
			ret.push({ path: "conf.py", content: confpy });
		}

		if (settings.structure.generateMakefile) {
			let content = this.generateFileFromTemplate(this.makefileTemplate, settings);
			ret.push({ path: "Makefile", content: content });
		}

		if (settings.structure.generateMakeBat) {
			let content = this.generateFileFromTemplate(this.makeBatTemplate, settings);
			ret.push({ path: "make.bat", content: content });
		}

		return ret;
	}


	/*
	 * Based on settings object, generate object documentation content and return it as an array of objects
	 * - `settings`: settings object
	 * - `headerDepth`: number, starting header depth (defaults to 1)
	 * Returned array elements:
	 * - `path`: relative path to the file
	 * - `content`: file content as rows
	 */
	generateObjectsContent (settings, headerDepth) {
		if (settings === undefined)
			settings = {};
		util.applyDefaults(settings, this.settings);

		if (headerDepth === undefined)
			headerDepth = 1;

		let ret = [];
		let roots = this.codeTree.findRoots();
		let units = roots.slice(0);
		for (let i=0; i<roots.length; i++) {
			let upstream = roots[i].getAllPrev();
			units = util.concatUnique(units, upstream);
		}

		// first group everything in classes and other modules
		let exportedClasses = [];
		let internalClasses = [];
		let modules = [];

		for (let i=0; i<units.length; i++) {
			let exported = units[i].getExportedObjects();
			let unitClasses = units[i].getBlocksByInstance(ClassBlock);
			let unitFunctions = units[i].getBlocksByInstance(FunctionBlock);
			let unitVariables = units[i].getBlocksByInstance(VariableBlock);

			for (let j=0; j<unitClasses.length; j++) {
				if (exported.indexOf(unitClasses[j].getIdentifierName()) === -1)
					internalClasses.push(unitClasses[j]);
				else
					exportedClasses.push(unitClasses[j]);
			}

			if ((unitFunctions.length === 0) && (unitVariables.length === 0))
				continue;

			let unitEntry = {
				unit: units[i],
				exportedFunctions: [],
				exportedVariables: [],
				internalFunctions: [],
				internalVariables: []
			};

			for (let j=0; j<unitFunctions.length; j++) {
				if (exported.indexOf(unitFunctions[j].getIdentifierName()) === -1) {
					if (settings.structure.includeInternal === true)
						unitEntry.internalFunctions.push(unitFunctions[j]);
				}
				else
					unitEntry.exportedFunctions.push(unitFunctions[j]);
			}

			for (let j=0; j<unitVariables.length; j++) {
				if (exported.indexOf(unitVariables[j].getIdentifierName()) === -1) {
					if (settings.structure.includeInternal === true)
						unitEntry.internalVariables.push(unitVariables[j]);
				}
				else
					unitEntry.exportedVariables.push(unitVariables[j]);
			}

			if (unitEntry.exportedFunctions.length || unitEntry.exportedVariables.length ||
				unitEntry.internalFunctions.length || unitEntry.internalVariables.length)
				modules.push(unitEntry);
		}

		// class documentation
		let meta = {};
		for (let i=0; i<exportedClasses.length; i++) {
			let comment = exportedClasses[i].getPrev(1, CommentBlock);
			let content = this.generateClassDocumentation(exportedClasses[i], comment, settings, headerDepth+1, meta);
			ret.push({
				path: util.joinPaths(settings.paths.baseClassPath, exportedClasses[i].getIdentifierName() + ".rst"),
				content: this.textToOutputRows(content, settings)
			});
		}

		if (settings.structure.includeInternal !== true) {
			meta = { exported: false };
			for (let i=0; i<internalClasses.length; i++) {
				let comment = internalClasses[i].getPrev(1, CommentBlock);
				let content = this.generateClassDocumentation(internalClasses[i], comment, settings, headerDepth + 1, meta);
				ret.push({
					path: util.joinPaths(settings.paths.baseClassPath, internalClasses[i].getIdentifierName() + ".rst"),
				content: this.textToOutputRows(content, settings)
				});
			}
		}

		let options = {
			objectsOnly: true,
			includeInternal: settings.structure.includeInternal
		};
		for (let i=0; i<modules.length; i++) {
			ret.push({
				path: util.joinPaths(settings.paths.baseUnitsPath, modules[i].unit.getExportedName() + ".rst"),
				content: this.generateCodeDocumentation(modules[i].unit, settings, headerDepth + 1, options)
			});
		}

		this.generateAuxiliaryFiles(ret, settings);

		return ret;
	}

	/*
	 * Based on settings object, generate text content and return it as an array of objects
	 * - `settings`: settings object
	 * - `headerDepth`: number, starting header depth (defaults to 1)
	 * Returned array elements:
	 * - `path`: relative path to the file
	 * - `content`: file content as rows
	 */
	generateFileContent (settings, headerDepth) {
		if (settings === undefined)
			settings = {};
		util.applyDefaults(settings, this.settings);

		if (headerDepth === undefined)
			headerDepth = 1;

		let ret = [];
		let roots = this.codeTree.findRoots();
		let objects = roots.slice(0);
		for (let i=0; i<roots.length; i++) {
			let upstream = roots[i].getAllPrev();
			objects = util.concatUnique(objects, upstream);
		}

		for (let i=0; i<objects.length; i++) {
			ret.push({
				path: util.joinPaths(settings.paths.baseCodePath, objects[i].getPath() + ".rst"),
				content: this.generateCodeDocumentation(objects[i], settings, headerDepth + 1)
			});
		}

		this.generateAuxiliaryFiles(ret, settings);

		return ret;
	}

}

module.exports = Generator;
