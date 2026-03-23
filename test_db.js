const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://admin:nb123@cluster0.heyciqo.mongodb.net/hedwigpost?retryWrites=true&w=majority&appName=Cluster0';
const JsonFileSchema = new mongoose.Schema({ filename: String, data: mongoose.Schema.Types.Mixed });
const JsonFile = mongoose.models.JsonFile || mongoose.model('JsonFile', JsonFileSchema);

mongoose.connect(MONGODB_URI).then(async () => {
    const doc = await JsonFile.findOne({ filename: 'posts.json' });
    console.log("DB connection successful.");
    if (doc) {
        console.log(`posts.json found. Length: ${doc.data.length}`);
        console.log("First post title:", doc.data[0].title);
    } else {
        console.log("posts.json not found in MongoDB!");
    }
    process.exit(0);
}).catch(console.error);
