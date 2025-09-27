// src/services/storage/IBundleStorage.ts

export interface IBundleStorage {
  /**
   * Sube el archivo del bundle a un almacenamiento remoto.
   * @param localFilePath Ruta local del archivo .zip.
   * @param destinationPath Ruta de destino en el almacenamiento (ej: 'app-id/bundle.zip').
   * @returns La URL pública y accesible del bundle.
   */
  upload(localFilePath: string, destinationPath: string): Promise<string>;

  /**
   *
   * @param sourcePath
   * @param destinationPath
   */
  download(sourcePath: string, destinationPath: string): Promise<void>;
}
