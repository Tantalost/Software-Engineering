import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true, 
  },
  reportType: {
    type: String,
    enum: ['Bus', 'TerminalFee', 'Parking', 'Tenant', 'LostAndFound'],
    default: 'Bus',
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
    required: false,
    default: null,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: null,
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

reportSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

reportSchema.set('toJSON', {
    virtuals: true
});

export default mongoose.model('Report', reportSchema);