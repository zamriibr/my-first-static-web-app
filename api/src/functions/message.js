const { app } = require('@azure/functions');

app.http('message', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return { 
            jsonBody: {
                text: "Hello, from the API API!"
            }
        };
    }
});