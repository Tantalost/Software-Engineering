import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true, 
  },
  author: {
    type: String,
    default: "System User"
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Archived'],
    default: 'Submitted'
  },
  data: {
    type: mongoose.Schema.Types.Mixed, 
    required: true
  }
}, { timestamps: true });

reportSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

reportSchema.set('toJSON', {
    virtuals: true
});

export default mongoose.model('Report', reportSchema);