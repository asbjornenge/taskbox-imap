var Imap = require('imap'),
    inspect = require('util').inspect;

var imap = new Imap({
  user: 'username',
  password: 'password',
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});

imap.once('ready', function() {
    console.log('ready')

    imap.openBox('INBOX',true, function(err, box) {
        if (err) throw err
        var f = imap.seq.fetch('1:30',{
            bodies : 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
            struct : true
        })

        f.on('message', function(msg,seqno) {
            console.log('Message nr#%d',seqno)
        })

        imap.on('mail', function() {
            console.log('new mail')
            console.log(arguments)
        })

        imap.on('expunge', function() {
            console.log('expunge')
            console.log(arguments)
        })

        imap.on('update', function() {
            console.log('update')
            console.log(arguments)
        })

    })

})

imap.once('error', function(err) {
  console.log(err);
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();
