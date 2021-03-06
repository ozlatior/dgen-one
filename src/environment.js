/*
 * Environment class
 *
 * The environment class puts everything together so the package is easy to
 * integrate in applications
 */

const fs = require("fs");

const CodeTree = require("./codetree.js");
const CodeUnit = require("./codeunit.js");
const DirectiveEngine = require("./directive_engine.js");
const Generator = require("./generator.js");

const util = require("./util.js");

const DEFAULT_SETTINGS = require("./default_settings.js");

/*
 * Environment class
 *
 * The environment class puts everything together so the package is easy to
 * integrate in applications
 */
class Environment {

	/*
	 * Constructor
	 * `settings`: settings object, contains specific settings to use instead of defaults
	 */
	constructor (settings) {
		this.settings = settings !== undefined ? settings : {};
		
		this.codeTree = new CodeTree();
		this.directiveEngine = new DirectiveEngine(this.codeTree);
		this.generator = new Generator(this.codeTree);
		this.basePath = ".";

		util.applyDefaults(this.settings, DEFAULT_SETTINGS);
	}

	/*
	 * Set base (project) path. All relative paths will use this
	 * `path`: string, new base path
	 */
	setBasePath (path) {
		this.basePath = path;
	}

	/*
	 * Add code unit by file path relative to project path
	 * `path`: string, file path relative to project path
	 * `name`: string, optional (name for this unit)
	 * `description`: string, optional (description for this unit)
	 */
	addCodeUnitByPath (path, name, description) {
		let content = fs.readFileSync(util.joinPaths(this.basePath, path));
		return this.addCodeUnit(content, path, name, description);
	}

	/*
	 * Add code unit by file path and content
	 * `content`: string, content of the code unit
	 * `path`: string, file path relative to project path
	 * `name`: string, optional, name for this unit
	 * `description`: string, optional, description for this unit
	 */
	addCodeUnit (content, path, name, description) {
		let unit = new CodeUnit(content, 1, path, name, description);
		this.codeTree.linkUnit(unit);
	}

	/*
	 * Set project meta
	 * `meta`: object or string, object containing project meta key-value pairs:
	 * - `name`: string, project name
	 * - `author`: string, project author
	 * - `copyright`: string, copyright information (will be autogenerated if missing)
	 * - `version`: string, project release version
	 */
	setProjectMeta (meta) {
		this.generator.setProjectMeta(meta);
	}

	/*
	 * Join project base path with a given path
	 * `path`: string, path relative to base path
	 * Returns: string, full path corresponding to the given path
	 */
	fullPath (path) {
		return util.joinPaths(this.basePath, path);
	}

	/*
	 * Check if a file should be filtered out according to the filter rules
	 * `path`: string, path to check
	 * Returns: boolean, true if path should be excluded
	 */
	isFileFiltered (path) {
		let filename = path.split("/").pop();
		if (this.settings.project.includeOnly.length > 0) {
			// only allow files which follow any of the patterns
			for (let i=0; i<this.settings.project.includeOnly.length; i++)
				if (filename.match(this.settings.project.includeOnly[i]) !== null)
					return false;
			return true;
		}
		for (let i=0; i<this.settings.project.excludeFiles.length; i++)
			if (filename.match(this.settings.project.excludeFiles[i]) !== null)
				return true;
		return false;
	}

	/*
	 * Check if a path should be filtered out according to the filter rules
	 * `path`: string, path to check
	 * Returns: boolean, true if path should be excluded
	 */
	isPathFiltered (path) {
		// first check if on include list, in that case it should be included
		for (let i=0; i<this.settings.project.includePaths.length; i++)
			if (path.match(this.settings.project.includePaths[i]) !== null)
				return false;
		for (let i=0; i<this.settings.project.excludePaths.length; i++)
			if (path.match(this.settings.project.excludePaths[i]) !== null)
				return true;
		return false;
	}

	/*
	 * Internal autoload code units function, called by `autoloadCodeUnits`
	 * `path`: string, project base path - this will be set as base path in the Environment
	 *         if not provided, the currently set path is used as base path
	 * `recursive`: boolean, if true directories will be read recursively
	 */
	_autoloadCodeUnits (path, recursive) {
		let dir = fs.readdirSync(this.fullPath(path));
		for (let i=0; i<dir.length; i++) {
			let p = util.joinPaths(path, dir[i]);
			let fullPath = this.fullPath(p);
			let stats = fs.statSync(fullPath);
			if (stats.isDirectory()) {
				if (recursive && !this.isPathFiltered(p))
					this._autoloadCodeUnits(p, recursive);
				else
					continue;
			}
			if (this.isFileFiltered(p))
				continue;
			let content = fs.readFileSync(fullPath).toString();
			this.addCodeUnit(content, p);
		}
	}

	/*
	 * Automatically add all code units from project base path
	 * `path`: string, project base path - this will be set as base path in the Environment
	 *         if not provided, the currently set path is used as base path
	 * `recursive`: boolean, if true directories will be read recursively
	 */
	autoloadCodeUnits (path, recursive) {
		if (recursive === undefined)
			recursive = this.settings.project.recursive;
		if (!path)
			path = this.basePath;
		else
			this.basePath = path;
		return this._autoloadCodeUnits(".", recursive);
	}

	/*
	 * Automatically load all project files from project base path
	 *
	 * Loads all code unit files, metadata and intro / ending sections from project dir
	 * `path`: string, project base path - this will be set as base path in the Environment
	 *         if not provided, the currently set path is used as base path
	 */
	autoloadProjectFiles (path, recursive, settings) {
		this.autoloadCodeUnits(path, recursive);
		if (this.settings.project.projectMeta) {
			let meta = fs.readFileSync(util.joinPaths(this.basePath, this.settings.project.projectMeta));
			this.setProjectMeta(meta.toString());
		}
	}

	/*
	 * Generate objects documentation
	 * `settings`: settings object, this will be passed to the generator to replace any defaults
	 * Returns: array of objects containing paths and content for file export
	 */
	generateObjectsDocumentation (settings) {
		this.directiveEngine.runDirectives();
		return this.generator.generateObjectsContent(settings);
	}

	/*
	 * Generate files documentation
	 * `settings`: settings object, this will be passed to the generator to replace any defaults
	 * Returns: array of objects containing paths and content for file export
	 */
	generateFilesDocumentation (settings) {
		this.directiveEngine.runDirectives();
		return this.generator.generateFileContent(settings);
	}


	/*
	 * Output content to given path
	 * `path`: string, path to write to (directories will be created if missing)
	 * `content`: array of objects, content to output:
	 *    `path`: string, relative path to the file
	 *    `content`: array of strings, file content as rows
	 * `settings`: settings object, this wll be passed to the generator to replace any defaults
	 */
	outputContent (path, content, settings) {
		if (!path)
			path = util.joinPaths(this.basePath, this.settings.paths.outputPath);

		for (let i=0; i<content.length; i++) {
			let p = util.joinPaths(path, content[i].path);
			let dir = p.split("/").slice(0, -1).join("/");
			if (!fs.existsSync(dir)) {
			  fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(p, content[i].content.join("\n"));
		}
	}

	/*
	 * Output objects documentation to given path
	 * `path`: string, path to write to (directories will be created if missing)
	 * `settings`: settings object, this wll be passed to the generator to replace any defaults
	 */
	outputObjectsDocumentation (path, settings) {
		let content = this.generateObjectsDocumentation(settings);
		return this.outputContent(path, content, settings);
	}

	/*
	 * Output files documentation to given path
	 * `path`: string, path to write to (directories will be created if missing)
	 * `settings`: settings object, this wll be passed to the generator to replace any defaults
	 */
	outputFilesDocumentation (path, settings) {
		let content = this.generateFilesDocumentation(settings);
		return this.outputContent(path, content, settings);
	}

}

module.exports = Environment;
