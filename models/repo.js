const { Schema } = Mongoose;

const repoSchema = new Schema({
  name: String,
  tags: [
    {
      type: Mongoose.Schema.ObjectId,
      ref: 'Tag',
    },
  ],
});

export default Mongoose.model('Repo', repoSchema);
