var Imap    = require('imap')
var _       = require('lodash')    
var inspect = require('util').inspect
var EventEmitter = require('events').EventEmitter
var MailParser   = require('mailparser').MailParser

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

    openMailBox : function(box, callback) {
        this.connection.openBox(box, true, function(err, box) {
            if (err) throw err    
            this.box = box
            this.emit('mailbox-open', box)
            if (typeof callback == 'function') callback()
        }.bind(this))
    },

    startMailBoxStream : function(box) {
        this.connection.on('mail', function(msg, seq) {
            console.log('new mail',msg)
        })

        this.connection.on('expunge', function() {
            console.log('expunge')
            console.log(arguments)
        })
    },

    fetchSequence : function(first, last, callback) {
        var _this = this
        var messages = {}

        var check_finished = function() {
            if (Object.keys(messages).length == last) callback(messages)
        }

        var f = this.connection.seq.fetch(first+':'+last, {
            bodies : '',
            struct : true
        })

        f.on('message', function(msg, seqno) {
            var message = { seqno : seqno }
            var parser  = new MailParser()

            msg.on('body', function(stream, info) {
                stream.on('data', function(chunk) { parser.write(chunk) })
            })

            msg.once('attributes', function(attrs) {
                message.uid = attrs.uid
            });

            msg.once('end', function() {
                parser.end()
            })

            parser.on('end', function(mail) {
                mail.seqno = message.seqno
                mail.uid   = message.uid
                messages[message.uid] = mail
                check_finished()
            })

        })

    },

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
