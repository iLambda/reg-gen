# reg-gen (in development)
A javascript library for generating words that match a regular expression.
This module is available on npm as [reg-gen](https://www.npmjs.com/package/reg-gen).

The core principle of the library is the following :
* create the associated state machine
* create a path inside the fsm of length **min**(*min_length*, *length*) ends on a final state. if a seed has been specified, get the associated path
* build the word from the path
* return it

## install
If you're using node.js and npm, type into a terminal :
```sh
$ npm install reg-gen --save
```
If you're using the browser, add to the beginning of your file:
```html
<script src="reg-gen.js"></script>
```

## example
```js
var reggen = require('reg-gen')

// generate a word of length 10 according to the regex /^ab+a$/
var word = reggen.generate(/^ab+a$/, 10).word

```

## api

The following methods are available:

### reg-gen

#### generate
```js
var options = {
  // the function will return nothing if a word  
  // of exact specified length cannot be generated
  exactLength: false,
  // a seed that describes a path which will be used instead of
  // generating a random one
  seed: -1,
}
var answer = reggen.generate(expression|fsm, minlength, options)
```
Generates a word from a given regular expression.
The function returns a composite object which contains multiple informations about
the generated word.
* ***answer.word*** is the actual word
* ***answer.fsm*** contains the finite state machine that has been generated according to the regular expression
* ***answer.seed*** contains a seed which depends on the fsm that describes the path taken to generate the word

### reg-gen.fsm

#### accessible
Returns a list of accessible states and the associated transitions, given a fsm and a current state.

#### isFsm
Returns true if the given object is a reg-gen FSM.

#### fromRegex, fromRegexp
Creates a FSM from a regex.

## release History

* 0.1.0 Initial release

## license
[MIT](http://opensource.org/licenses/MIT)
