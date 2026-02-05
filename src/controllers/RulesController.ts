import { Request, Response } from "express";
import { RuleModel, ConfigModel } from "../models/Rule";

export const RulesController = {
  // GET /api/rules/sync
  syncRules: async (req: Request, res: Response) => {
    try {
      // 1. Obtener la versión global actual de las reglas
      let config = await ConfigModel.findOne({ key: "rules_version" });

      if (!config) {
        // Si no existe, la creamos inicializada en 1
        config = await ConfigModel.create({ key: "rules_version", value: 1 });
      }

      // 2. Leer la versión que tiene el celular (viene como query param string)
      const clientVersion = parseInt(req.query.currentVersion as string) || 0;
      const serverVersion = config.value;

      // 3. Comparar: ¿El cliente está actualizado?
      if (clientVersion >= serverVersion) {
        // 304 Not Modified: Ahorramos ancho de banda y procesamiento
        return res.status(304).send();
      }

      // 4. Si el cliente está desactualizado, buscamos las reglas activas
      const rules = await RuleModel.find({ active: true })
        .select("-_id -__v") // Ocultamos campos internos de Mongo
        .lean(); // .lean() lo hace más rápido (devuelve objeto JS puro)

      // 5. Enviamos la nueva data
      return res.status(200).json({
        version: serverVersion,
        last_updated: new Date(),
        rules: rules,
      });
    } catch (error) {
      console.error("Error syncing rules:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // POST /api/rules (Endpoint administrativo para crear reglas)
  createRule: async (req: Request, res: Response) => {
    try {
      const { id, pattern, risk, meta } = req.body;

      // Crear la regla
      const newRule = await RuleModel.create({
        id,
        pattern,
        risk,
        meta,
        // los demás usan defaults
      });

      // IMPORTANTE: Incrementar la versión global
      await ConfigModel.findOneAndUpdate(
        { key: "rules_version" },
        { $inc: { value: 1 } }, // Incrementa en 1
        { upsert: true },
      );

      return res.status(201).json(newRule);
    } catch (error) {
      return res.status(400).json({ error: "Error creating rule" });
    }
  },
};
