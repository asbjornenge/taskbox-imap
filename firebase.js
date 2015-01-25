var Firebase     = require('firebase')
var _            = require('lodash')    
var EventEmitter = require('events').EventEmitter

var firebase = function(args) {
    this.url    = args.firebase
    this.secret = args['firebase-secret'] 
    this.root   = new Firebase(args.firebase)
}
firebase.prototype = _.assign({

    connect : function() {
        this.root.authWithCustomToken(this.secret, function(err, auth) {
            if (err) throw err
            this.emit('ready')
        }.bind(this))
    }

}, EventEmitter.prototype)

module.exports = firebase
