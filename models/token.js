import Mongoose from 'mongoose';
const { Schema } = Mongoose;

const TokenSchema = new Schema({
  token: {
    type: String,
  },
  user: {
    type: Mongoose.Schema.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

TokenSchema.pre('save', function (next) {
  const self = this;
  // eslint-disable-next-line
  require('crypto').randomBytes(24, function (err, buffer) {
    const token = buffer.toString('hex');
    self.token = token;
    next();
  });
});

export default Mongoose.model('Token', TokenSchema);
