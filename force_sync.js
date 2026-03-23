const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://admin:nb123@cluster0.heyciqo.mongodb.net/hedwigpost?retryWrites=true&w=majority&appName=Cluster0';

const JsonFileSchema = new mongoose.Schema({
    filename: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }
});
const JsonFile = mongoose.models.JsonFile || mongoose.model('JsonFile', JsonFileSchema);

mongoose.connect(MONGODB_URI).then(async () => {
    console.log("Connected to MongoDB");
    const localData = JSON.parse(fs.readFileSync('./data/posts.json', 'utf8'));
    await JsonFile.updateOne({ filename: 'posts.json' }, { data: localData }, { upsert: true });
    console.log("Force pushed local posts.json to MongoDB Cloud Sync ✅");
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
