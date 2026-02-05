import { Router } from "express";
import { RulesController } from "../controllers/RulesController";
// Si tienes middleware de autenticación (ej: para admin), impórtalo aquí
// import { isAdmin } from '../middlewares/auth';

const router = Router();

// Ruta pública (la App la consulta)
router.get("/sync", RulesController.syncRules);

// Ruta privada (Solo tú deberías poder crear reglas)
// router.post('/', isAdmin, RulesController.createRule);
router.post("/", RulesController.createRule); // Sin auth por ahora para probar

export default router;
