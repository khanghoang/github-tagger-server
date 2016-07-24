const { Schema } = Mongoose;

const repoSchema = new Schema({
  url: String,
  tags: Array,
});

export default Mongoose.model('Repo', repoSchema);
