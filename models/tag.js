const { Schema } = Mongoose;

const tagSchema = new Schema({
  name: String,
  repos: Array,
});

export default Mongoose.model('Tag', tagSchema);
