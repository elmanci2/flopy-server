// src/services/metadata/IReleaseMetadataStore.ts

import { Release } from "../../generated/prisma"; // Es mejor usar el tipo generado por Prisma aquí

export interface IReleaseMetadataStore {
  /**
   * Guarda una nueva entrada de release en la base de datos.
   */
  create(data: Omit<Release, "id" | "createdAt">): Promise<Release>;

  /**
   * Busca la última release activa que coincide con los criterios del cliente.
   */
  findLatestActive(
    appId: string,
    channel: string,
    clientBinaryVersion: string,
  ): Promise<Release | null>;

  /**
   * Actualiza una release existente, típicamente para desactivarla (rollback).
   */
  update(
    id: string,
    data: Partial<Pick<Release, "isActive">>,
  ): Promise<Release | null>;

  /**
   * Busca una release específica por su ID único.
   */
  findById(id: string): Promise<Release | null>;

  /**
   * Devuelve una lista de todas las releases para una aplicación específica, ordenadas por fecha.
   */
  findByAppId(appId: string): Promise<Release[]>;
}
