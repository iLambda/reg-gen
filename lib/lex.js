// require all modules
var _ = require('lodash')

/*
* TOKEN class
*/
function Token(type, data) {
  this.type = type
  this.data = data
}

Token.kind = {
  empty: 'ε',
  lbracket: '(',
  rbracket: ')',
  charset: '[xyz]',
  start: '^',
  end: '$',
  star: '*',
  plus: '+',
  alter: '?',
  or: '|',
  //nonmatching: '?:'
  //followed: '?=',
  //notfollowed: '?!',
  times: '{n,m}',
  dot: '.',
  blank: ' ',
  //escape: '\\',
  extend: '\d\D\w\W',
  char: 'a-z0-9_ \n\t\r',
  end: 'END',
}

/*
 * LEXER class
 */
function Lexer(pattern) {
  // save pattern data
  this.pattern = pattern
  this.idx = 0
}

Lexer.prototype.reset = function() {
  // reset index
  this.idx = 0
}

Lexer.prototype.isChar = function(data) {
  // true if data is a regex char or a space
  return _.isString(data) && data.search(/\w| /) >= 0
}

Lexer.prototype.hasNext = function() {
  // return true if a char is available
  if (this.pattern) {
    return this.idx < this.pattern.length
  } else {
    return false
  }
}

Lexer.prototype.consume = function() {
  // return a char
  if (this.hasNext()) {
    var c = this.pattern[this.idx++]
    return c
  } else {
    return null
  }
}

Lexer.prototype.remember = function() {
  // return a char
  if (this.idx > 0) {
    return this.pattern[this.idx - 1]
  } else {
    return null
  }
}

Lexer.prototype.peek = function() {
  // return a char
  if (this.hasNext()) {
    return this.pattern[this.idx + 1]
  } else {
    return null
  }
}

Lexer.prototype.next = function() {
  // the token data
  var data = "", char
  // while a char is available
  while (this.hasNext()) {
    switch (char = this.consume()) {

      // adding brackets
      case '(':
        return new Token(Token.kind.lbracket, '(')
      case ')':
        return new Token(Token.kind.rbracket, ')')

      // character class
      case '[':
        var charset = []
        // while we encounter an ending square bracket
        while ((char = this.consume()) !== ']') {
          // get the last valid character
          var lastChar = _.last(charset)
          // if we're on a regexp char..
          if (this.isChar(char)) {
            if (this.isChar(lastChar)) {
              // .. and the last valid character is also a regexp char
              // then this character is valid
              charset.push(char)
            } else if (lastChar === '-' && char >= charset[charset.length - 2]) {
              // .. and the last valid character is a caret, plus the
              //    current character is bigger than the one we started with
              // then this character is valid
              charset.push(char)
            } else {
              // error
              throw new Error('Error while parsing character class ' + charset.join(''))
            }
          } else if (char === '-' && this.isChar(lastChar)) {
            // add a caret
            charset.push('-')
          } else {
            // error
            throw new Error('Error while parsing character class ' + charset.join(''))
          }
        }
        // return the token
        return new Token(Token.kind.charset, charset)

      // start and end tokens
      case '^':
        return new Token(Token.kind.start, '^')
      case '$':
        return new Token(Token.kind.end, '$')


      case '*':
        return new Token(Token.kind.star, '*')
      case '+':
        return new Token(Token.kind.plus, '+')
      case '?':
        var peek = this.peek()
        var remembered = this.remember()

        // check for a special character
        if (peek === ':') {
          // non capturing group token.
          if (remembered === '(') {
            // just after a parenthesis : ignore it
            continue
          } else {
            throw new Error('Non-matching parenthesis token not in brackets. "\\".')
          }
        } else if (peek === '=') {
          throw new Error('"if followed by" is not a supported token yet. "\\".')
        } else if (peek === '!') {
          throw new Error('"if not followed by" is not a supported token yet. "\\".')
        } else {
          return new Token(Token.kind.alter, '?')
        }

      case '|':
        return new Token(Token.kind.or, '|')
      case '{':
        var data = [0]
        // while we encounter an ending square bracket
        while ((char = this.consume()) !== '}') {
          // current number idx
          var currentIdx = data.length - 1
          // check current character
          if (char.search(/[0-9]/)) {
            // add the digit
            data[currentIdx] = data[currentIdx] * 10 + (~~char)
          } else if (char === ',') {
            // add a new value
            data.push(0)
          } else {
            // the token will be invalid, in hope to exactly matching RegExp behavior.
            //    For instance, /a{1, 2}/; /a{1,e}/; /a{1,4,5}/ are all valid RegExp
            //    but match no string.
            data = []
            break
          }
        }
        // return the token
        return new Token(Token.kind.times, data.length <= 2 ? data : [])

      case '.':
        return new Token(Token.kind.dot, '.')
      case ' ':
        return new Token(Token.kind.blank, ' ')
      case '\\':
        switch (this.consume()) {
          case 'n':
            return new Token(Token.kind.char, '\n')
          case 't':
            return new Token(Token.kind.char, '\t')
          case 'r':
            return new Token(Token.kind.char, '\r')
          case '\\':
            return new Token(Token.kind.char, '\\')
          case 'd':
            return new Token(Token.kind.extend, '\d')
          case 'w':
            return new Token(Token.kind.extend, '\w')
          case 'D':
            return new Token(Token.kind.extend, '\D')
          case 'W':
            return new Token(Token.kind.extend, '\W')
        }
        throw new Error('Expected valid character after "\\".')

      default:
        if (this.isChar(char)) {
          return new Token(Token.kind.char, char)
        } else {
          throw new Error('Unrecognized token : "' + char + '"')
        }
    }
  }
}

Lexer.prototype.tokenize = function() {
  // tokens list
  var tokens = [], token
  var char = ''
  // while we can parse
  while (this.hasNext()) {
    tokens.push(this.next())
  }
  // return tokens
  return tokens
}

module.exports.Lexer = Lexer
module.exports.Token = Token
