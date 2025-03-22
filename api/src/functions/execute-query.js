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

            // Parse connection string manually
            const connectionParts = {};
            connectionString.split(';').forEach(part => {
                if (!part) return;
                const equalsPos = part.indexOf('=');
                if (equalsPos > 0) {
                    const key = part.substring(0, equalsPos).trim();
                    const value = part.substring(equalsPos + 1).trim();
                    connectionParts[key] = value;
                }
            });
            
            // Configure SQL connection based on your specific connection string format
            const config = {
                user: connectionParts['User ID'],
                password: connectionParts['Password'],
                server: connectionParts['Server'] ? connectionParts['Server'].replace('tcp:', '').split(',')[0] : null,
                database: connectionParts['Initial Catalog'],
                options: {
                    encrypt: connectionParts['Encrypt'] === 'True',
                    trustServerCertificate: connectionParts['TrustServerCertificate'] === 'True',
                    connectionTimeout: parseInt(connectionParts['Connection Timeout'] || '30'),
                    port: connectionParts['Server'] && connectionParts['Server'].includes(',') ? 
                          parseInt(connectionParts['Server'].split(',')[1]) : 1433
                }
            };
            
            // Log connection details for debugging (remove in production)
            context.log('Connection config:', JSON.stringify({
                user: config.user,
                server: config.server,
                database: config.database,
                // Don't log password
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