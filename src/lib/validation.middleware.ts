// src/lib/validation.middleware.ts

import { Request, Response, NextFunction } from "express";
import Joi from "joi";

type RequestProperty = "body" | "params" | "query";

/**
 * Middleware de Express que valida una propiedad de la petición contra un esquema de Joi.
 * @param schema El esquema de Joi a utilizar.
 * @param property La propiedad del objeto `req` a validar ('body', 'params', o 'query').
 */
export const validate =
  (schema: Joi.ObjectSchema, property: RequestProperty) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      convert: true,
      abortEarly: false,
    });

    if (!error) {
      req[property] = value;
      return next();
    }
    const formattedErrors = error.details.map((detail) => ({
      message: detail.message,
      path: detail.path.join("."),
    }));

    return res.status(400).json({
      message: "Error de validación de datos",
      errors: formattedErrors,
    });
  };
