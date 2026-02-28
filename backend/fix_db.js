const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/hackathonDB').then(async () => {
    try {
        const db = mongoose.connection.db;

        // Find documents where orphanage is a string
        const result = await db.collection('children').updateMany(
            { orphanage: { $type: "string" } },
            { $set: { orphanage: null } }
        );

        console.log('Fixed children documents where orphanage was a string:', result.modifiedCount);
    } catch (err) {
        console.error('Error fixing db:', err);
    } finally {
        process.exit(0);
    }
});
