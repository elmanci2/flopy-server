// src/routes/schemas.ts

import Joi from "joi";

// --- Esquemas para AppController ---

export const createAppSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.base": "El nombre debe ser un texto",
    "string.min": "El nombre debe tener al menos 3 caracteres",
    "any.required": "El nombre es requerido",
  }),
});

export const getOrDeleteAppSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "El ID de la aplicación es requerido en la URL",
  }),
});

// --- Esquemas para ReleaseController ---

export const checkForUpdateSchema = Joi.object({
  appId: Joi.string().required(), // Joi no tiene `cuid` nativo, pero podemos usar un regex si es necesario
  clientBinaryVersion: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .required()
    .messages({
      "string.pattern.base": "La versión binaria debe tener el formato X.Y.Z",
    }),
  channel: Joi.string().min(1).required(),
});

export const publishReleaseSchema = Joi.object({
  appId: Joi.string().required(),
  channel: Joi.string().min(1).required(),
  targetBinaryVersion: Joi.string().min(1).required(),
  // Joi convertirá automáticamente 'true'/'false' a booleano si usamos las opciones correctas en el middleware
  isMandatory: Joi.boolean().default(false),
  // Joi convertirá automáticamente el string a número
  rolloutPercentage: Joi.number().integer().min(0).max(100).default(100),
});

export const promoteReleaseSchema = Joi.object({
  toChannel: Joi.string().min(1).required(),
});

export const reportStatusSchema = Joi.object({
  releaseId: Joi.string().required(),
  clientUniqueId: Joi.string().min(1).required(),
  status: Joi.string().valid("SUCCESS", "FAILURE").required(),
});

// Esquemas para validar solo los parámetros de la URL
export const releaseIdParamsSchema = Joi.object({
  id: Joi.string().required(),
});

export const appIdParamsSchema = Joi.object({
  appId: Joi.string().required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "El email no es válido.",
    "any.required": "El email es requerido.",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "La contraseña debe tener al menos 8 caracteres.",
    "any.required": "La contraseña es requerida.",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
