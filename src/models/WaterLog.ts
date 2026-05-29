import mongoose, { Schema, Document } from 'mongoose';

export interface IWaterLog extends Document {
  amount: number;
  timestamp: Date;
}

const WaterLogSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Please provide the water intake amount in ml'],
      min: [1, 'Intake must be at least 1 ml'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'w_table', // Explicitly naming the collection 'w_table' as requested
    timestamps: false,
  }
);

// Prevent compiling model query if it is already compiled in cached mongoose context
export default mongoose.models.WaterLog || mongoose.model<IWaterLog>('WaterLog', WaterLogSchema);
