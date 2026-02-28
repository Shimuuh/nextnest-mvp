const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/hackathonDB').then(async () => {
    try {
        const hashDonor = await bcrypt.hash('donor123', 10);
        await mongoose.connection.db.collection('users').updateOne(
            { email: 'donor@test.com' },
            { $set: { password: hashDonor } }
        );

        const hashOrphanage = await bcrypt.hash('orphanage123', 10);
        await mongoose.connection.db.collection('users').updateOne(
            { email: 'orphanage@test.com' },
            { $set: { password: hashOrphanage } }
        );

        console.log('Donor and Orphanage passwords updated successfully to donor123 and orphanage123');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
