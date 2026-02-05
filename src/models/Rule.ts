import mongoose, { Schema, Document } from "mongoose";

// 1. Interfaz para la Regla (Lo que usas en el código)
export interface IRule extends Document {
  id: string;
  active: boolean;
  pattern: string;
  flags: string;
  risk: "low" | "medium" | "high";
  category: string;
  meta: {
    title: string;
    description: string;
    recommendedAction?: string;
  };
  createdAt: Date;
}

// 2. Interfaz para la Configuración (Versión)
export interface IAppConfig extends Document {
  key: string;
  value: number;
}

// 3. Esquema de Mongoose (Para la BD)
const RuleSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  pattern: { type: String, required: true },
  flags: { type: String, default: "i" },
  risk: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  category: { type: String, default: "general" },
  meta: {
    title: { type: String, required: true },
    description: { type: String },
    recommendedAction: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

const ConfigSchema: Schema = new Schema({
  key: { type: String, unique: true },
  value: { type: Number, default: 1 },
});

// 4. Exportamos los modelos tipados
export const RuleModel = mongoose.model<IRule>("DetectionRule", RuleSchema);
export const ConfigModel = mongoose.model<IAppConfig>(
  "AppConfig",
  ConfigSchema,
);
