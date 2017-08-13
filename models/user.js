import Mongoose from 'mongoose';
const { Schema } = Mongoose;

const userSchema = new Schema({
  name: {
    type: String,
  },

  githubID: {
    type: String,
    required: true,
  },

  githubToken: {
    type: String,
    required: true,
  },

  profile: {
    name: {
      type: String,
    },
    picture: {
      type: String,
    },
    email: {
      type: String,
    },
  },
});

export default Mongoose.model('User', userSchema);
