===============
class Generator
===============

**Base class:** Object

Generator class

A generator is built around a code tree and performs the document generation steps:

* building document structure
* extracting comments and generating documentation text
* building text hierarchy within a file

Content generation (file-based): File-based content generation converts files into documentation files, with sections
for classes, functions, etc

Content generation (object-based): Object-based content generation creates an API-style documentation for each object in
the code


Constructor (codeTree, settings)
================================

The Generator is built around a CodeTree object

* `codeTree`: CodeTree object, the code tree used by this generator
* `settings`: settings object, any settings in this object will replace the default settings for this Generator object


Member methods
==============

This class defines the following member methods


Generator.prototype.setProjectMeta (meta)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set project meta from object (key-value pairs); Only specified keys will be set/replaced

* `meta`: object, metadata in package.json format; Relevant fields
   * `name`: string, project name
   * `copyright`: string, copyright information
   * `author`: string, author name
   * `version`: string, version number, including tags


Generator.prototype.setConfPyTemplate (template)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set conf.py template to replace the defaults loaded at object creation

* `template`: string, template contents


Generator.prototype.setMakefileTemplate (template)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set Makefile template to replace the defaults loaded at object creation

* `template`: string, template contents


Generator.prototype.setConfPyTemplate (template)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Set make.bat template to replace the defaults loaded at object creation

* `template`: string, template contents


Generator.prototype.addIntroSection (path, content)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Intro sections are files to be included before the actual documentation

* `path`: string, path for this file
* `content`: content for this file (string or rows), this will be copied directly


Generator.prototype.addEndingSection (path, content)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Ending sections are files to be included after the actual documentation

* `path`: string, path for this file
* `content`: content for this file (string or rows), this will be copied directly


Generator.prototype.interRows (before, after, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Return an array of rows (most likely empty) to separate two text elements, eg two paragraphs or a paragraph and a title

* `before`: object, first text element object `{ style, text }`
* `after`: object, second text element object `{ style, text }`
* `settings`: object, settings object

Returns the array of output rows (array of strings)


Generator.prototype.textRows (section, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Return an array of rows corresponding to a text element

* `section`: object, text element object
   * `style`: string, style to apply to this text element, eg `h1`, `b`, `p` etc
   * `text`: string, the actual text for this text element
* `settings`: object, settings object

Returns the array of output rows (array of strings)


Generator.prototype.textToOutputRows (text, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert an array of text elements into an array of rows for output

* `text`: array of objects, the array of text element objects to be converted
* `settings`: object, settings object

Returns the array of output rows (array of strings)


Generator.prototype.formatToStyle (format)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Get style for each block formatting

* `format`: string, section formatting as specified by CommentBlock (eg `block`)

Returns the `style` for Generator Output (eg `p`, `bk`)


Generator.prototype.commentSectionsToText (sections, settings, filter)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert comment sections to text

* `sections`: array of sections, block sections to convert to text
* `settings`: settings object, settings to apply for this conversion
* `filter`: function, optional, call this function on all comment rows
   * Arguments:
      * `row`: object, formatted row { style, text }
   * Return value: formatted row { style, text } or `null` if row is to be excluded

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.commentBlockToText (commentBlock, settings, filter)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Convert a comment block to text

* `commentBlock`: CommentBlock object, block to convert to text
* `settings`: settings object, settings to apply for this conversion
* `filter`: function, optional, call this function on all comment rows
   * Arguments:
      * `row`: object, formatted row { style, text }
   * Return value: formatted row { style, text } or `null` if row is to be excluded

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.generateFileHeader (codeUnit, settings, headerDepth)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate the header section of a file based on a CodeUnit object

* `codeUnit`: CodeUnit object, parsed code unit object for this file
* `settings`: settings object, settings to apply for this operation
* `headerDepth`: number, section headers (titles) start from this level

This method generates the contents for the header section, namely the title of the file, description (extracted from the
first comment blocks). If the title is missing, it will be autogenerated. If a title or description was specified via
the CodeUnit constructor or methods, those will be used instead.

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.generateClassDocumentation (classBlock, commentBlock, settings, headerDepth, meta)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate documentation for a declared class based on code and comments

* `classBlock`: ClassBlock object, parsed class declaration
* `commentBlock`: CommentBlock object, parsed comment block associated with the class block usually this is the block
  right before the class, but it's up to the caller to choose
* `settings`: settings object, settings to apply for this operation
* `headerDepth`: number, section headers (titles) start from this level
* `meta`: object, additional options for this operation:
   * `exported`: boolean, if this is set, specify explicitly wether this is an exported object or not

This method generates documentation text for a class. All methods will be listed with their argument lists, as well as
introductory documentation from the main comment block provided.

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.generateFunctionDocumentation (functionBlock, commentBlock, settings, headerDepth, meta)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate documentation for a declared function based on code and comments

* `functionBlock`: FunctionBlock object, parsed function declaration
* `commentBlock`: CommentBlock object, parsed comment block associated with the function block usually this is the block
  right before the function, but it's up to the caller to choose
* `settings`: settings object, settings to apply for this operation
* `headerDepth`: number, section headers (titles) start from this level
* `meta`: object, additional options for this operation:
   * `exported`: boolean, if this is set, specify explicitly wether this is an exported object or not
   * `type`: string, can be `function`, `constructor` or `method` (defaults to `function`)
   * `alias`: string, if this is set, replace the name with the aliased name

This method generates documentation text for a function or method. If a comment block is provided, documentation will be
generated from the comment block, otherwise it will be autogenerated.

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.generateVarDocumentation (varBlock, commentBlock, settings, headerDepth, meta)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate documentation for a declared variable based on code and comments

* `classBlock`: VariableBlock object, parsed variable declaration
* `commentBlock`: CommentBlock object, parsed comment block associated with the variable block usually this is the block
  right before the variable, but it's up to the caller to choose
* `settings`: settings object, settings to apply for this operation
* `headerDepth`: number, section headers (titles) start from this level
* `meta`: object, additional options for this operation

This method is not currently implemented.

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.generateVarGroupDocumentation (group, settings, headerDepth, meta)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate documentation for a group of declared variables based on code and comments

* `group`: object, parsed variable declarations:
   * `titleComment`: CommentBlock object, parsed comment block associated with the class block usually this is the block
     right before the group, but it's up to the caller to choose
* `settings`: settings object, settings to apply for this operation
* `headerDepth`: number, section headers (titles) start from this level
* `meta`: object, additional options for this operation:
   * `exported`: array of strings, if this is set, look up each variable in the group in this array to determine wether
     to treat it as an exported object or not
   * `groupCount`: number, the total number of groups in the unit - this is used to determine wether to autogenerate a
     missing title for this group (if there are more groups, there should be another level of nesting for the titles)

This method generates documentation text for a group of variables. All variables will be listed, together with
additional comments if found and their inital values.

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.generateSection (title, content, settings, headerDepth)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate a section

* `title`: string, title for this section
* `content`: array of objects, content of this section { style, text }
* `settings`: settings object, settings to apply for this operation
* `headerDepth`: number, section headers (titles) start from this level

This method prepends a title to the content.

Returns an array of objects, each describing formatted text { style, text }


Generator.prototype.isTitleComment (block, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Determine if a comment block represents a possible title block

* `block`: CodeBlock object, the block to check
* `settings`: settings object, settings to apply for this operation

Returns boolean, true if this could be a title comment. A block is considered to be a possible title comment if

* it is a CommentBlock
* it has less or equal rows to the value specified as `settings.code.sectionTitleMaxRows`
* it is `padded` with empty comment rows either before or after


Generator.prototype.getTitleComment (block, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Find the first title comment above a specific block

* `block`: CodeBlock object, the code block to find the title for
* `settings`: settings object, settings to apply for this operation

This method runs up the code and detects the first title comment. If the block is part of a group of blocks of the same
type (eg methods, var declarations etc), it goes up to the first block in the group first, then tries to find the title
for the entire group.

Returns the title comment candidate or `null` if none was found.


Generator.prototype.groupVarDeclarations (contentBlock, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Group all variable declarations in a ContentBlock object based on their title blocks

* `contentBlock`: ContentBlock object, the content block object to extract the groups from
* `settings`: settings object, settings to apply for this operation

This method detects the titles for each variable declaration and groups the declarations based on title, plus a section
for declarations that don't have a title associated.

Returns: array of objects

* `titleComment`: CommentBlock object, the title comment associated with this group
* `variables`: array of CodeBlock objects, the variable declarations in a group


Generator.prototype.generateCodeDocumentation (codeUnit, settings, headerDepth, options)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate documentation content for a code unit.

* `codeUnit`: CodeUnit object, the code unit parsed from file
* `settings`: settings object, settings to use for this operation
* `headerDepth`: number, first title (header) starts from this level
* `options`: object, additional options:
   * `includeInternal`: boolean, wether to include or not internal (not exported) items in the generated content
     (defaults to true)
   * `objectsOnly`: boolean, if this is set to true, class declarations will not be included in the generated content
     (defaults to false)

This method generates documentation content for everything in a code unit file, namely functions, classes and declared
variables (selection is possible using the `options` argument)

Returns: array of objects, the generated documentation content as { style, text }


Generator.prototype.generateIndex (files, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate Index with Table of Contents from file content

* `files`: array of objects, list of files included in this index; while normally this list is generated by one of the
  other methods of this class, only the `path` field is used by this method to determine how the files are included in
  the table of contents
* `settings`: settings object, settings to be used for this operation

Returns array of strings, the generated RST file content rows


Generator.prototype.formatArray (arr)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Format an array for configuration files (JSON-like format)

* `arr`: array, the values to include in the formatted array

This method returns a string representing the array in JSON format but with spaces to make it more readable and similar
to what a human user would type in a config file

Returns string representing the formatted array


Generator.prototype.replaceTemplateToken (row, token, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Replace a known token in a text row with the value specified in settings or project metadata

* `row`: string, the row to replace the token in
* `token`: string, the token name (eg. author)
* `settings`: settings object, settings to be used for this operation

The token values will be read either from settings or from the project meta stored in this object. Available tokens are
`name`, `copyright`, `author`, `release`, `extensions`, `templates_path`, `exclude_patterns`, `html_theme`,
`html_static_path`

Returns string, row with the token replaced with corresponding value


Generator.prototype.generateConfPy (settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate a conf.py file content for the current project

* `settings`: setting objects, settings to use for this operation

Returns array of strings, python file content with all values from project meta or settings


Generator.prototype.generateFileFromTemplate (template, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate a file from template

* `template`: string, contents of the template file
* `settings`: settings object, settings to use for this operation

Returns array of strings, the generated file content rows


Generator.prototype.generateTextDocumentation (textUnit, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Not implemented


Generator.prototype.generateAuxiliaryFiles (files, settings)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Generate all auxiliary file content associated with a documentation project

* `files`: array of objects, files already in the project (for instance the output of `generateObjectsContent` or
  `generateFileContent`
* `settings`: settings object, settings to use for this operation

This method generates the auxiliary project file content, namely conf.py, index and makefiles if specified in the
settings and attaches them to the input `files` object.

Returns object, the input files object with the newly generated file content.


Generator.prototype.generateObjectsContent (settings, headerDepth)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Based on settings object, generate object documentation content and return it as an array of objects

* `settings`: settings object
* `headerDepth`: number, starting header depth (defaults to 1)

Returned array elements:

* `path`: suggested relative path to the generated file
* `content`: file content as rows


Generator.prototype.generateFileContent (settings, headerDepth)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Based on settings object, generate file documentation and return it as an array of objects

* `settings`: settings object
* `headerDepth`: number, starting header depth (defaults to 1)

Returned array elements:

* `path`: suggested relative path to the generated file
* `content`: file content as rows