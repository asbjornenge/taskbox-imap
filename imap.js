var Imap = require('imap')
var _    = require('lodash')
var EventEmitter = require('events').EventEmitter

var imap = function(cred) {
    this.cred = cred
    this.connection = null
}
imap.prototype = _.assign(EventEmitter.prototype, {

    connect : function() {
        this.connection = new Imap({
            user: this.cred.user,
            password: this.cred.password,
            host: this.cred.host,
            port: this.cred.port,
            tls: this.cred.tls
        })

        this.connection.once('ready', function() {
            this.emit('ready')
        }.bind(this))

        this.connection.once('error', function(err) {
            console.log(err);
        })

        this.connection.once('end', function() {
            console.log('Connection ended');
        })

        this.connection.connect()
    },

    startMailBoxStream : function(box) {
        this.connection.openBox(box, true, function(err, box) {
            if (err) throw err
            

            this.connection.on('mail', function(msg, seq) {
                console.log('new mail',msg)
            })

            this.connection.on('expunge', function() {
                console.log('expunge')
                console.log(arguments)
            })

        }.bind(this))
    }

})



//imap.once('ready', function() {
//    console.log('ready')
//
//    imap.openBox('INBOX',true, function(err, box) {
//        if (err) throw err
//        var f = imap.seq.fetch('1:30',{
//            bodies : 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
//            struct : true
//        })
//
//        f.on('message', function(msg,seqno) {
//            console.log('Message nr#%d',seqno)
//        })
//
//        imap.on('mail', function() {
//            console.log('new mail')
//            console.log(arguments)
//        })
//
//        imap.on('expunge', function() {
//            console.log('expunge')
//            console.log(arguments)
//        })
//
//        imap.on('update', function() {
//            console.log('update')
//            console.log(arguments)
//        })
//
//    })
//
//})

module.exports = imap
