=======================================
Directive handlers (./src/directive.js)
=======================================

**Directive handlers take arguments, CodeUnit and CodeBlock references and change them to implement the directive**

General signature:

handler = function (codeUnit, commentBlock, codeBlock, args)


Exported Functions
==================


directive._logError (message, codeUnit, commentBlock)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `message`

* `codeUnit`

* `commentBlock`


directive._alias (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

alias <altName> alias <what> <altName>


directive._assign (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

assign <target> <value>


directive._export (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export <exportName> export <what> <exportName>


directive._parse ()
~~~~~~~~~~~~~~~~~~~

does nothing, parse is handled directly by the engine


directive._stop ()
~~~~~~~~~~~~~~~~~~

does nothing, stop is handled directly by the engine


directive._pattern (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

pattern <pattern> <args>


Internal Functions
==================


_splitArgList (argString)
~~~~~~~~~~~~~~~~~~~~~~~~~

Split argument list by commas, but don't split inside paranthesis

* `argString`: string, argument string, eg `1, null, fn(1, 2, 3))`


_buildArgTree (callString)
~~~~~~~~~~~~~~~~~~~~~~~~~~

Build argument tree for a nested call string

* `callString`: string, the nested call string, eg `myFun(1, myOtherFun(2, 3))`

Returns: nested array of strings, the arguments of the nested call, eg `[ 1, [ 2, 3 ] ]`


_readArgAt (callString, argPath)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Read an argument from a nested call string

* `callString`: string, the code for the function call, `eg myFun(1, myOtherFun(2, 3));`
* `argPath`: array of numbers, argument path to read, eg `[ 0, 1 ]`

Returns: string, the argument at path, eg. in the example above `3`, or null if not found


_parseExpression (expression, ctx)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `expression`

* `ctx`


_extractExpression (argument, parsedExpression, block, ctx)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `argument`

* `parsedExpression`

* `block`

* `ctx`


_replaceExpressions (argument, parsedExpressions, block, ctx)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `argument`

* `parsedExpressions`

* `block`

* `ctx`


_expandArgs (args, block, includeFirst, ctx)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Arguments**

* `args`

* `block`

* `includeFirst`

* `ctx`


_aliasNext (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

alias <altName>


_aliasSpecific (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

alias <what> <altName>


_exportNext (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export <exportName>


_exportSpecific (codeUnit, commentBlock, codeBlock, args)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export <what> <exportName>


Variable Declarations
=====================


const AssignmentBlock
~~~~~~~~~~~~~~~~~~~~~

* not exported
* initial value: `CodeBlock.AssignmentBlock`


const CommentBlock
~~~~~~~~~~~~~~~~~~

* not exported
* initial value: `CodeBlock.CommentBlock`


const PATTERN_GENERIC
~~~~~~~~~~~~~~~~~~~~~

* not exported
* initial value: `/\{.+\}/g`

Generated at Mon Dec 07 2020 11:16:32 GMT+0800 (Central Indonesia Time)