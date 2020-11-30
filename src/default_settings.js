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
		groupAliasesTogether: false
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
		// base path for code file documentation output
		baseCodePath: "code",
		// base path for intro sections
		baseIntroPath: "intro",
		// base path for ending sections
		baseEndingPath: "endnotes",
		// base path for classes
		baseClassPath: "classes",
		// base path for functions
		baseFunctionPath: "functions",
		// base path for other exported values
		baseExportedPath: "exported"
	}
};

module.exports = DEFAULT_SETTINGS;
