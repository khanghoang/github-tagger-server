import Mongoose from 'mongoose';

const { Schema } = Mongoose;

const repoSchema = new Schema({
  name: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  tags: [
    {
      type: Mongoose.Schema.ObjectId,
      ref: 'Tag',
    },
  ],
  user: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

export default Mongoose.model('Repo', repoSchema);
