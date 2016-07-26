const { Schema } = Mongoose;

const userSchema = new Schema({
  name: {
    type: String,
  },

  emai: {
    type: String,
    unique: true,
    required: true,
  },
});

export default Mongoose.model('User', userSchema);
