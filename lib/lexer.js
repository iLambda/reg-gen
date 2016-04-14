// require all modules
var _ = require('lodash')

/*
* TOKEN class
*/
function Token(type, data) {
  this.type = type
  this.data = data
}

Token.prototype.functionality = function() {
  switch (this.type) {
    case Token.kind.dot:
    case Token.kind.blank:
    case Token.kind.class:
    case Token.kind.char:
    case Token.kind.charset:
    case Token.kind.empty:
    case Token.kind.end:
      return 'char'

    case Token.kind.or:
      return 'operator'

    case Token.kind.star:
    case Token.kind.plus:
    case Token.kind.alter:
    case Token.kind.times:
      return 'postoperator'

    case Token.kind.lbracket:
      return 'lbracket':
    case Token.kind.rbracket:
      return 'rbracket'

    default:
      return undefined

  }
}

Token.kind = {
  or: { symbol: '|', precedence: 1 },

  //start: { symbol: '^', precedence: 2 },
  //end: { symbol: '$', precedence: 2 },
  dot: { symbol: '.', precedence: 2 },
  blank: { symbol: ' ', precedence: 2 },
  class: { symbol: '\d\D\w\W', precedence: 2 },
  char: { symbol: 'a-z0-9_ \n\t\r', precedence: 2 },
  charset: { symbol: '[xyz]', precedence: 2 },

  star: { symbol: '*', precedence: 3 },
  plus: { symbol: '+', precedence: 3 },
  alter: { symbol: '?', precedence: 3 },
  times: { symbol: '{n,m}', precedence: 3 },

  lbracket: { symbol: '(', precedence: 4 },
  rbracket: { symbol: ')', precedence: 4 },

  end: { symbol: 'END', precedence: Infinity  },
  empty: { symbol: 'ε', precedence: Infinity }
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
      case '$':
        continue

      // postfix operators
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
            return new Token(Token.kind.class, '\d')
          case 'w':
            return new Token(Token.kind.class, '\w')
          case 'D':
            return new Token(Token.kind.class, '\D')
          case 'W':
            return new Token(Token.kind.class, '\W')
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
  // reset
  this.reset()
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
