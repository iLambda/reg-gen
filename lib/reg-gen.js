var fsm = require('./fsm.js')

module.exports = {

  generate: function(exp, length, options) {
    /*
     * To generate a word from a regular expression, we do the following :
     *   - create the associated state machine
     *   - create a path inside the fsm of length min(min_length, length)
     *        which ends on a final state. if a seed has been specified,
              we get the associated path
     *   - build the word from the path
     *   - return it
     */

     // create/get the fsm associated
     var fsm = fsm.isFsm(exp) ? exp : fsm.fromRegex(exp)
     // generate/recuperate the seed
     var seed = _.isInteger(options.seed) && options.seed >= 0
                    ? option.seed
                    : -1
     // generate a word
     var word = ''

     return {
       fsm: fsm
       word: '',
       seed: options.seed < 0 ?  -1
     }
  }

}
