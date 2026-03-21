const mongoose = require('mongoose');

// Define Schemas
const postSchema = new mongoose.Schema({
    id: String,
    title: String,
    slug: { type: String, unique: true },
    content: String,
    excerpt: String,
    author: String,
    category: String,
    publishDate: String,
    updatedDate: String,
    status: { type: String, default: 'draft' }, // 'draft' or 'published'
    featuredImage: String,
    featuredImageAlt: String,
    metaTitle: String,
    metaDescription: String,
    tags: [String],
    readingTime: Number,
    views: { type: Number, default: 0 }
});

const categorySchema = new mongoose.Schema({
    id: String,
    name: String,
    slug: { type: String, unique: true },
    description: String,
    postCount: { type: Number, default: 0 }
});

const commentSchema = new mongoose.Schema({
    id: String,
    postId: String, // relates to post slug or id
    authorName: String,
    content: String,
    date: String,
    status: { type: String, default: 'pending' } // 'pending', 'approved', 'spam'
});

const settingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed
});

// Compile Models
const Post = mongoose.model('Post', postSchema);
const Category = mongoose.model('Category', categorySchema);
const Comment = mongoose.model('Comment', commentSchema);
const Setting = mongoose.model('Setting', settingSchema);

module.exports = {
    Post,
    Category,
    Comment,
    Setting,
    connectDB: async (uri) => {
        try {
            await mongoose.connect(uri);
            console.log('MongoDB Connected Successfully');
        } catch (err) {
            console.error('MongoDB Connection Error:', err);
            process.exit(1);
        }
    }
};
