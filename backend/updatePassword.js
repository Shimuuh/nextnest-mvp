const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/hackathonDB').then(async () => {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        await mongoose.connection.db.collection('users').updateOne(
            { email: 'admin@test.com' },
            { $set: { password: hash } }
        );
        console.log('Admin password updated to admin123');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
