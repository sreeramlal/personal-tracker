import mongoose, { Schema, Document } from 'mongoose';

export interface IWaterSetting extends Document {
  target: number;
  userId: string;
}

const WaterSettingSchema: Schema = new Schema(
  {
    target: {
      type: Number,
      required: [true, 'Please provide the daily target in ml'],
      min: [500, 'Target must be at least 500 ml'],
      max: [10000, 'Target cannot exceed 10000 ml'],
      default: 2000,
    },
    userId: {
      type: String,
      required: true,
      default: 'default', // Defaults to 'default' for single-user setup
      unique: true, // Ensures only one setting document exists per user
    },
  },
  {
    collection: 'w_settings', // Explicitly naming the collection 'w_settings'
    timestamps: true,
  }
);

export default mongoose.models.WaterSetting || mongoose.model<IWaterSetting>('WaterSetting', WaterSettingSchema);
