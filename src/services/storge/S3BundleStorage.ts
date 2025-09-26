// src/services/storage/S3BundleStorage.ts

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { singleton } from "tsyringe";
import * as fs from "fs";
import { IBundleStorage } from "./IBundleStorage";

@singleton()
export class S3BundleStorage implements IBundleStorage {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrlPrefix: string;

  constructor() {
    // Leemos las nuevas variables de entorno requeridas
    this.bucketName = process.env.S3_BUCKET_NAME!;
    const region = process.env.S3_REGION!;
    const endpoint = process.env.S3_ENDPOINT!;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;

    // Esta será la URL base para acceder públicamente a los archivos.
    this.publicUrlPrefix = process.env.S3_PUBLIC_URL_PREFIX!;

    // Validación más robusta
    if (
      !this.bucketName ||
      !region ||
      !endpoint ||
      !accessKeyId ||
      !secretAccessKey ||
      !this.publicUrlPrefix
    ) {
      throw new Error(
        "Faltan una o más variables de entorno para la configuración de S3: S3_BUCKET_NAME, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL_PREFIX.",
      );
    }

    // --- El cambio clave está aquí ---
    // Configuramos el cliente S3 con el endpoint y las credenciales personalizadas.
    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Esto es a veces necesario para proveedores que no son AWS
      forcePathStyle: true,
    });
  }

  async upload(
    localFilePath: string,
    destinationPath: string,
  ): Promise<string> {
    const fileStream = fs.createReadStream(localFilePath);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: destinationPath,
      Body: fileStream,
    });

    await this.s3Client.send(command);

    return new URL(destinationPath, this.publicUrlPrefix).toString();
  }
}
