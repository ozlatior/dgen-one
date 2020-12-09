---
RST Documentation Generator for nodejs
---

This documentation generator uses the code contents and comments to
autogenerate documentation for a project.

# Documented objects

Three types of objects are documented:

-   class declarations (together with their methods)
-   function declarations in module files
-   variable declarations in module files

# How it works

The Generator will look for documenting comments in the code and use
those to generate the documentation text. If no documenting comments are
found, a basic documentation text is generated, describing the item
based on the code itself (eg. function arguments, etc)

Comments can be either in asterisk or in double slash format.

Generally, RST format is parsed, with some remarks.

## Comment selection

If you want to document a function, class or method, place the comment
right before the declaration, as such:

    /*
     * My very special method
     */
    myVerySpecialMethod (arg1, arg2)

This will generate a documentation text that includes the commented
text.

If you want to document a whole section of your code, place the comment
one empty row away from the next element at least. This currently works
only for variable declarations:

    /*
     * Configuration values
     */

    // first value
    const firstValue = 42;
    // second value
    const secondValue = "foo";

This will group the two variables in the same section in the generated
file.

## Paragraphs

Just like in RST, rows will be merged into a single paragraph, unless
separated by an empty row:

    /*
     * This is the first
     * paragraph.
     *
     * And this is the
     * second
     */

## Bullet text

To create bullet text, simply use bullets in the comment block:

    /*
     * This function takes the following arguments:
     * `argument1`: string, the first value
     * `argument2`: number, the other value
     */

Bullet nesting is available, and text starting with backward quotes and
colon will be automatically considered as bullets.

## Block text

To create block text, such as code blocks, use double colon before the
block (only first row is required to start with double colon, but you
can do it on subsequent blocks as a styling choice if you will):

    /*
     * :: This block will be displayed as a block (monospace) text
     *    You can use this to represent code, for instance
     */

# Directives

Directives can be used to specify things that are not easy to pick up by
the engine, for example name aliasing, exported names of objects and so
on.

To specify a directive in comments, use the @ annotation:
[@\<directive\> \<args\>]{.title-ref}

Some directives apply to the next code block, others apply to the entire
unit. They are used to specify things that are not directly obvious to
the CodeUnit engine or to provide metadata for better documentation
output.

Available directives:

-   `alias <altName>`: the following code block implements an alias
    of `altName`
-   `alias <what> <altName>`: sets an alias for what under
    `altName`
-   `assign <target> <value>`: assigns a variable or value to
    target field of object
-   `export <exportName>`: sets the exported name of the next block
-   `export <what> <exportName>`: sets the exported name of
    `what` to `exportName`
-   `parse`: this has two effects - forces the CodeUnit engine to
    parse the contents of the following block, even if normally that
    would not be the case (eg. for function blocks) and it applies any
    directives found in the parse block
-   `pattern <type> <args>`: specify a particular pattern
    implemented by this CodeUnit; for now only singleton patterns can be
    specified: `pattern singleton <className>`

Directives placed at the end of the file (after all code) refer to the
CodeUnit file instead of the following block

Objects can be specified in the assign, alias, export directives by
path. An object directly on CodeUnit level can be specified directly by
identifier name, while a nested (assigned) object or a prototype object
can be specified by path (with dots).

The object path can contain expressions between `{}`
brakets, which will be parsed by reading the lines of code directly
under the directive. Parsing can use regular expressions and keywords:
`{<keyword><regex>}`

Available keywords:

-   `target`: in an assignment, apply the regex to extract the name
    from the target of the assignment; return extracted name
-   `value`: in an assignment, use the regex to extract the name from
    the value of the assignment; return extracted name
-   `arg[i]`: in a function call, use the regex to extract the name
    from the index i argument of the call, starting from zero; return
    extracted name

# DGenOne Command Line Interface (./cli.js)

**Nodejs executable script for documentation generation**

Execution:

    node path/to/cli.js command [ arguments ]

Available commands:

-   `help [command]`: print a general help text or command help text
    if command is given
-   `config init`: initialize a project configuration sequence in
    current directory
-   `config default`: configure a project with default settings in
    current directory
-   `config get <key>`: print the currently configured value(s) for
    key
-   `config set <key> <value>`: set config value at key
-   `document files`: generate file content documentation (code units)
-   `document objects`: generate object content documentation
    (classes)

# Using as module

The functionality can be accessed from a nodejs application if the
generator is included as a nodejs module:

    const DGenOne = require("dgen-one");

This provides access to the environment class. Example:

    const Environment = require("./src/environment.js");

    let env = new Environment();

    env.autoloadProjectFiles("./sample");

    env.outputFilesDocumentation("./sample/documentation/files");
    env.outputObjectsDocumentation("./sample/documentation/objects");

This will load all files in the `./sample` directory and
generate file content documentation and object content documentation.
Have a look at the documentation for more details.
