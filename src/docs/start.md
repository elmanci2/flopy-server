bun run dev:server```

El servidor estará corriendo en `http://localhost:3100` (o el puerto que definas).

---

## 🔑 Autenticación

La API utiliza **JSON Web Tokens (JWT)** para proteger los endpoints.

1.  Primero, crea una cuenta con `POST /api/v1/auth/register`.
2.  Luego, obtén un token con `POST /api/v1/auth/login`.
3.  Para todas las peticiones a rutas protegidas, incluye el token en la cabecera de `Authorization`:
    ```
    Authorization: Bearer <tu-jwt-token>
    ```

---

## 📖 Documentación de la API

La URL base para todos los endpoints es `/api/v1`.

### Autenticación (`/auth`)

#### `POST /auth/register`
Crea una nueva cuenta de usuario.

*   **Request Body:** `application/json`
    | Campo      | Tipo   | Requerido | Descripción                     |
    | :--------- | :----- | :-------- | :------------------------------ |
    | `email`    | String | Sí        | Email único para el usuario.    |
    | `password` | String | Sí        | Contraseña (mínimo 8 caracteres).|

*   **✅ Respuesta Exitosa (201 Created):**
    ```json
    {
      "id": "user_id_string",
      "email": "usuario@ejemplo.com"
    }
    ```

*   **❌ Respuestas de Error:**
    *   `409 Conflict`: Si el email ya está en uso.
    *   `400 Bad Request`: Si los datos de entrada son inválidos.

#### `POST /auth/login`
Inicia sesión y obtiene un token de autenticación.

*   **Request Body:** `application/json`
    | Campo      | Tipo   | Requerido |
    | :--------- | :----- | :-------- |
    | `email`    | String | Sí        |
    | `password` | String | Sí        |

*   **✅ Respuesta Exitosa (200 OK):**
    ```json
    {
      "token": "ey..."
    }
    ```
*   **❌ Respuestas de Error:**
    *   `401 Unauthorized`: Si las credenciales son incorrectas.

### Gestión de Aplicaciones (`/apps`)
🛡️ **Todas las rutas de esta sección requieren autenticación.**

#### `POST /apps`
Crea una nueva aplicación. El usuario autenticado se convierte automáticamente en el primer miembro.

*   **Request Body:** `application/json`
    | Campo  | Tipo   | Requerido | Descripción                     |
    | :----- | :----- | :-------- | :------------------------------ |
    | `name` | String | Sí        | Nombre único para la aplicación. |

*   **✅ Respuesta Exitosa (201 Created):** Devuelve el objeto de la aplicación creada.
    ```json
    {
      "id": "app_id_string",
      "name": "flopy-android",
      "apiKey": "apikey_string"
    }
    ```

*   **❌ Respuestas de Error:**
    *   `409 Conflict`: Si el nombre de la aplicación ya existe.

#### `GET /apps`
Lista todas las aplicaciones a las que el usuario tiene acceso.

*   **✅ Respuesta Exitosa (200 OK):** Devuelve un array de objetos de aplicación.

#### `GET /apps/:id`
Obtiene los detalles de una aplicación específica.

*   **URL Params:**
    *   `id`: El ID de la aplicación.

*   **✅ Respuesta Exitosa (200 OK):** Devuelve el objeto de la aplicación.
*   **❌ Respuestas de Error:** `404 Not Found`.

#### `DELETE /apps/:id`
Elimina una aplicación y todas sus releases asociadas.

*   **URL Params:**
    *   `id`: El ID de la aplicación.

*   **✅ Respuesta Exitosa (204 No Content):** No devuelve contenido.
*   **❌ Respuestas de Error:** `404 Not Found`.

### Gestión de Releases y Despliegues (`/releases`)
🛡️ **Todas las rutas de esta sección requieren autenticación.**

#### `POST /check-for-update`
Usado por el cliente móvil para comprobar si hay una actualización disponible.

*   **Request Body:** `application/json`
    | Campo                 | Tipo   | Requerido | Descripción                               |
    | :-------------------- | :----- | :-------- | :---------------------------------------- |
    | `appId`               | String | Sí        | El ID de la aplicación.                   |
    | `clientBinaryVersion` | String | Sí        | La versión nativa del cliente (ej. `1.0.0`). |
    | `channel`             | String | Sí        | El canal de despliegue (ej. `Production`). |

*   **✅ Respuesta Exitosa (200 OK):**
    ```json
    {
      "updateAvailable": true, // o false
      "package": {
        "releaseId": "release_id_string",
        "bundleUrl": "https://...",
        "hash": "sha256_hash",
        "isMandatory": false
      }
    }
    ```

#### `POST /publish`
Publica una nueva actualización.

*   **Request Body:** `multipart/form-data`
    | Campo                 | Tipo    | Requerido | Descripción                                  |
    | :-------------------- | :------ | :-------- | :------------------------------------------- |
    | `bundle`              | File    | Sí        | El archivo `.zip` con el bundle y los assets. |
    | `appId`               | String  | Sí        | ID de la aplicación.                         |
    | `channel`             | String  | Sí        | Canal de despliegue.                         |
    | `targetBinaryVersion` | String  | Sí        | Rango SemVer compatible (ej. `~1.2.0`).      |
    | `isMandatory`         | String  | Opcional  | `"true"` o `"false"`.                        |
    | `rolloutPercentage`   | String  | Opcional  | Un número como string (ej. `"50"`).          |

*   **✅ Respuesta Exitosa (201 Created):** Devuelve el objeto de la `Release` creada.

#### `POST /releases/:id/rollback`
Desactiva una release, impidiendo que nuevos clientes la descarguen.

*   **URL Params:**
    *   `id`: El ID de la release a desactivar.

*   **✅ Respuesta Exitosa (200 OK):**
    ```json
    { "message": "Rollback realizado con éxito." }
    ```

#### `POST /releases/:id/promote`
Promueve una release a un nuevo canal.

*   **URL Params:**
    *   `id`: El ID de la release a promover.
*   **Request Body:** `application/json`
    | Campo       | Tipo   | Requerido | Descripción                   |
    | :---------- | :----- | :-------- | :---------------------------- |
    | `toChannel` | String | Sí        | El canal al que se promoverá. |

*   **✅ Respuesta Exitosa (201 Created):** Devuelve el nuevo objeto de `Release` creado en el nuevo canal.

#### `POST /report-status`
Usado por el cliente móvil para reportar el estado de una instalación.

*   **Request Body:** `application/json`
    | Campo            | Tipo   | Requerido | Descripción                               |
    | :--------------- | :----- | :-------- | :---------------------------------------- |
    | `releaseId`      | String | Sí        | El ID de la release instalada.            |
    | `clientUniqueId` | String | Sí        | Un ID único para el dispositivo del cliente. |
    | `status`         | String | Sí        | `"SUCCESS"` o `"FAILURE"`.                |

*   **✅ Respuesta Exitosa (204 No Content):** No devuelve contenido.

#### `GET /apps/:appId/releases`
Obtiene el historial de todas las releases para una aplicación.

*   **URL Params:**
    *   `appId`: El ID de la aplicación.

*   **✅ Respuesta Exitosa (200 OK):** Devuelve un array de objetos `Release`.

#### `GET /releases/:id/metrics`
Obtiene las métricas de despliegue para una release específica.

*   **URL Params:**
    *   `id`: El ID de la release.

*   **✅ Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": 98,
      "failure": 2,
      "total": 100
    }
    ```

---

## 🛣️ Futuro (Roadmap)

*   [ ] Implementar autorización basada en roles (Dueño, Desarrollador, Espectador).
*   [ ] Soporte para actualizaciones diferenciales ("diffs").
*   [ ] Dashboard web para una gestión visual.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
