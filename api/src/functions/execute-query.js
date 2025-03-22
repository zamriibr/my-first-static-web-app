const { app } = require('@azure/functions');
const sql = require('mssql');

app.http('execute-query', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Processing execute-query request');

        // Parse request body
        const body = await request.json();
        
        // Check if query parameter exists
        if (!body || !body.query) {
            return {
                status: 400,
                jsonBody: { error: "Please provide a SQL query in the request body" }
            };
        }

        let pool = null;
        
        try {
            // Get the query from request body
            const query = body.query;
            
            // Use the specific connection string for your database
            const connectionString = "@env('DATABASE_CONNECTION_STRING')";
            
            if (!connectionString) {
                throw new Error("Database connection string not configured");
            }

            // Log the entire connection string (remove this in production!)
            context.log('Connection string (masked):', 
                connectionString.replace(/Password=[^;]+/, 'Password=***MASKED***'));

            // Create direct config without parsing
            const config = {
                user: 'zamri',
                password: 'Afiqdaniel11$',
                server: 'dbtestone.database.windows.net', // Remove tcp: and port
                database: 'mydataweb', // Use Initial Catalog value
                options: {
                    encrypt: true,
                    trustServerCertificate: false,
                    port: 1433
                }
            };
            
            // Log connection config for debugging
            context.log('Connection config:', JSON.stringify({
                user: config.user,
                server: config.server,
                database: config.database,
                options: config.options,
                hasPassword: !!config.password
            }));

            // Create a connection pool
            pool = await sql.connect(config);
            
            // Execute query
            const result = await pool.request().query(query);
            
            // Return results
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    recordset: result.recordset,
                    rowsAffected: result.rowsAffected
                }
            };
        } 
        catch (err) {
            context.error('Database error:', err);
            
            return {
                status: 500,
                jsonBody: {
                    error: "Error executing query",
                    message: err.message
                }
            };
        }
        finally {
            // Close SQL connection pool if it was created
            if (pool) {
                try {
                    await pool.close();
                } catch (closeErr) {
                    context.error('Error closing SQL connection pool:', closeErr);
                }
            }
        }
    }
});