const { Schema } = Mongoose;

const repoSchema = new Schema({
  name: String,
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
