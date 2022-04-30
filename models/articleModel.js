const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const articleSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    author: {
        type: [{type: Schema.Types.ObjectId, ref: 'user'}],
        // required: true
    },
    type: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    poster: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('article', articleSchema);