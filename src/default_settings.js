/*
 * Default Settings
 */

/*
 * Default settings object
 *
 * Use this as a template to create your own settings
 */
const DEFAULT_SETTINGS = {
	// These settings apply to reading code and comments
	code: {
		// wether or not to attempt to read file header comments
		fileHeaders: true,
		// wether or not file header comments begin with a title row
		fileTitle: true,
		// max rows for the first paragraph to be considered a comment
		fileTitleMaxRows: 1,
		// wether or not file headers contain a short description
		fileDescription: true,
		// max rows for the second paragraph to be considered a description
		fileDescriptionMaxRows: 2,
		// max rows for section titles
		sectionTitleMaxRows: 1
	},
	// these settings apply to the structure of the output
	structure: {
		// generate conf.py file
		generateConfPy: true,
		// generate Makefile
		generateMakefile: true,
		// generate make.bat
		generateMakeBat: true,
		// generate index.rst file
		generateIndex: true,
		// wether or not to generate entries for aliases in output
		generateAliasEntries: true,
		// wether or not to expand aliases or just refer to the aliased item
		expandAliases: true,
		// wether or not to group aliases together at the end or display them with the other items
		groupAliasesTogether: false,
		// wether or not to include objects that are not directly exported (but they are used)
		includeInternal: true
	},
	// these settings determine what is included in the project structure
	project: {
		// read directories recursively
		recursive: true,
		// regex patterns, exclude these paths (relative to project base path)
		excludePaths: [ "^./documentation" ],
		// regex patterns, include these paths
		// (even if excluded and even if not recursively reading dirs, relative to project base path)
		includePaths: [],
		// regex patterns, filenames to exclude
		excludeFiles: [],
		// regex patterns, filenames to include (only these will be considered if any is present)
		includeOnly: [ ".+js$" ],
		// path to project meta (can be package.json or another file, relative to project base path)
		projectMeta: "./package.json",
	},
	// these settings apply to output and style
	output: {
		// min width of output text (don't wrap beyond this point) (0 = none)
		minColumns: 60,
		// max width of output text (wrap text by breaking on spaces after this limit)
		maxColumns: 120,
		// characters to use for underlining section titles, in order of rank (h1-...)
		sectionUnderlines: [ "**", "==", "=", "~", "-" ],
		// sphinx extensions
		sphinxExtensions: [],
		// sphinx templates paths
		sphinxTemplates: [ "_templates" ],
		// sphinx exculde patterns
		sphinxExculdePatterns: [ "_build", "Thumbs.db", ".DS_Store" ],
		// sphinx html theme
		sphinxHtmlTheme: "alabaster",
		// sphinx html static path
		sphinxHtmlStaticPath: [ "_static" ]
	},
	// output paths
	paths: {
		// path to documentation output (absolute or relative to base path)
		outputPath: "./documentation",
		// base path for code file documentation output
		baseCodePath: "code",
		// base path for intro sections
		baseIntroPath: "intro",
		// base path for ending sections
		baseEndingPath: "endnotes",
		// base path for classes
		baseClassPath: "classes",
		// base path for functions and variables
		baseUnitsPath: "units",
		// base path for other exported values
		baseExportedPath: "exported"
	}
};

module.exports = DEFAULT_SETTINGS;
