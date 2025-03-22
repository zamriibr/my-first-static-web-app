// api/execute-query/index.js
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('Processing execute-query request');

    // Check if query parameter exists
    if (!req.body || !req.body.query) {
        context.res = {
            status: 400,
            body: { error: "Please provide a SQL query in the request body" }
        };
        return;
    }

    try {
        // Get the query from request body
        const query = req.body.query;
        
        // Get connection string from environment variables
        // This should be set in your Function App settings
        const connectionString = "@env('DATABASE_CONNECTION_STRING')";
        
        if (!connectionString) {
            throw new Error("Database connection string not configured");
        }

        // Connect to database
        await sql.connect(connectionString);
        
        // Execute query
        const result = await sql.query(query);
        
        // Return results
        context.res = {
            status: 200,
            body: {
                success: true,
                recordset: result.recordset,
                rowsAffected: result.rowsAffected
            }
        };
    } 
    catch (err) {
        context.log.error('Database error:', err);
        
        context.res = {
            status: 500,
            body: {
                error: "Error executing query",
                message: err.message
            }
        };
    }
    finally {
        // Close SQL connection
        sql.close();
    }
};
