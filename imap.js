var Imap         = require('imap')
var _            = require('lodash')    
var inspect      = require('util').inspect
var EventEmitter = require('events').EventEmitter
var MailParser   = require('mailparser').MailParser

var imap = function(cred) {
    this.cred = cred
    this.connection = null
}
imap.prototype = _.assign({

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
            var parser  = new MailParser({
                streamAttachments   : true,
                showAttachmentLinks : true
            })

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
                console.log('got message',message)
                mail.seqno = message.seqno
                mail.uid   = message.uid
                if (mail.attachments) mail.attachments.forEach(function(attachment) { delete attachment.stream })
                messages[message.uid] = mail
                check_finished()
            })

        })

    },

}, EventEmitter.prototype)

module.exports = imap
