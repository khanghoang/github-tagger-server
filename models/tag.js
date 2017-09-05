import Mongoose from 'mongoose';

const { Schema } = Mongoose;

const tagSchema = new Schema({
  name: {
    type: String,
    unique: true,
  },
  repos: [
    {
      type: Mongoose.Schema.ObjectId,
      ref: 'Repo',
    },
  ],
});

export default Mongoose.model('Tag', tagSchema);
