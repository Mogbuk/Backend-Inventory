import { Request, Response, NextFunction } from "express";

// 🎯 Middleware global para manejo uniforme de errores
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("🔥 Error capturado:", err);

  // Detectar tipo de error (por ejemplo, validación, unicidad, etc.)
  let status = err.status || 500;
  let message = err.message || "Error interno del servidor";
  let fields = err.fields || undefined;

  // 💡 Ajuste automático para errores comunes de base de datos (TypeORM / PostgreSQL)
  if (err.code === "23505") {
    // Violación de unicidad
    status = 409;
    message = "Registro duplicado (violación de unicidad)";
  } else if (err.name === "EntityNotFoundError") {
    status = 404;
    message = "Recurso no encontrado";
  } else if (err.code === "22P02") {
    // error de tipo en el query (por ejemplo, ID no numérico)
    status = 400;
    message = "Parámetro inválido en la solicitud";
  }

  res.status(status).json({
    error: {
      message,
      ...(fields && { fields }),
    },
  });
}
