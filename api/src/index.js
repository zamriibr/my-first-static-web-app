const { app } = require('@azure/functions');

app.setup({
    enableHttpStream: true,
});


require('./functions/message');
require('./functions/functions/execute-query/index');