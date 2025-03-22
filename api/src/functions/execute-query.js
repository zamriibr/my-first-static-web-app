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
            
            // Get connection string from environment variables
            const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
            
            if (!connectionString) {
                throw new Error("Database connection string not configured");
            }

            // Configure SQL connection
            const config = {
                user: undefined,       // Will be parsed from connection string
                password: undefined,   // Will be parsed from connection string
                server: undefined,     // Will be parsed from connection string
                database: undefined,   // Will be parsed from connection string
                options: {
                    encrypt: true,     // For Azure SQL
                    trustServerCertificate: false  // Change to true for local dev / self-signed certs
                },
                connectionString: connectionString
            };

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
