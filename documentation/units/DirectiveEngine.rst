==================================================
Directive Engine Class (./src/directive_engine.js)
==================================================

**The Directive Engine Class applies directives to CodeUnits and/or CodeBlocks. Directives can be either specified in
comments or applied programatically.**

To specify a directive in comments, use the @ annotation: `@<directive> <args>`

Some directives apply to the next code block, others apply to the entire unit. They are used to specify things that are
not directly obvious to the CodeUnit engine or to provide metadata for better documentation output.

Available directives:

* `alias <altName>`: the following code block implements an alias of `altName`
* `alias <what> <altName>`: sets an alias for what under `altName`
* `assign <target> <value>`: assigns a variable or value to target field of object
* `export <exportName>`: sets the exported name of the next block
* `export <what> <exportName>`: sets the exported name of `what` to `exportName`
* `parse`: this has two effects - forces the CodeUnit engine to parse the contents of the following block, even if
  normally that would not be the case (eg. for function blocks) and it applies any directives found in the parse block
* `pattern <type> <args>`: specify a particular pattern implemented by this CodeUnit; for now only singleton patterns
  can be specified: `pattern singleton <className>`

Directives placed at the end of the file (after all code) refer to the CodeUnit file instead of the following block

Objects can be specified in the assign, alias, export directives by path. An object directly on CodeUnit level can be
specified directly by identifier name, while a nested (assigned) object or a prototype object can be specified by path
(with dots).

The object path can contain expressions between `{}` brakets, which will be parsed by reading the lines of code directly
under the directive. Parsing can use regular expressions and keywords: `{<keyword><regex>}`

Available keywords:

* `target`: in an assignment, apply the regex to extract the name from the target of the assignment; return extracted
  name
* `value`: in an assignment, use the regex to extract the name from the value of the assignment; return extracted name
* `arg[i]`: in a function call, use the regex to extract the name from the index i argument of the call, starting from
  zero; return extracted name


Variable Declarations
=====================


Default settings object
~~~~~~~~~~~~~~~~~~~~~~~


const DEFAULT_SETTINGS
----------------------

Default settings object

* not exported
* initial value: `{`


Other Declared Variables
~~~~~~~~~~~~~~~~~~~~~~~~


const CommentBlock
------------------

* not exported
* initial value: `CodeBlock.CommentBlock`


const ContentBlock
------------------

* not exported
* initial value: `CodeBlock.ContentBlock`

Generated at Mon Dec 07 2020 11:16:32 GMT+0800 (Central Indonesia Time)