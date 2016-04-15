// require all modules
var _ = require('lodash')
var lex = require('./lexer.js')

/*
* PARSER class
*/
function Parser(data) {
  this.idx = 0
  if (_.isArray(data)) {
    this.postfix = data
  } else if (data instanceof lex.Lexer) {
    this.postfix = data.postfix(data.tokenize())
  } else {
    throw new Error("The given argument is not an array of tokens, nor a Lexer")
  }
}

Parser.prototype.reset = function() {
  // reset index
  this.idx = 0
}

Parser.prototype.hasNext = function() {
  // return true if a token is available
  if (this.postfix) {
    return this.idx < this.postfix.length
  } else {
    return false
  }
}

Parser.prototype.consume = function() {
  // return a token
  if (this.hasNext()) {
    var c = this.postfix[this.idx++]
    return c
  } else {
    return null
  }
}

Parser.prototype.remember = function() {
  // return a char
  if (this.idx > 0) {
    return this.postfix[this.idx - 1]
  } else {
    return null
  }
}

Parser.prototype.peek = function() {
  // return a char
  if (this.hasNext()) {
    return this.postfix[this.idx + 1]
  } else {
    return null
  }
}

Parser.prototype.next = function() {
  // the token
  var token
  // while a token is available
  while (this.hasNext()) {
    // check it and return the NFA fragment associated to the token
    switch (token = this.consume()) {
      case Token.kind.char:
        return

      default:
        // unrecognized token
        return
    }
  }
}

Parser.prototype.build = function() {
  // reset
  this.reset()
  // while there is characters in the postfix expr
  while (this.hasNext()) {

  }
}

module.exports.Parser = Parser
