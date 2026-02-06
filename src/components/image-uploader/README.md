# ImageUploader Component

Componente reutilizable para cargar, visualizar y eliminar imágenes con soporte de drag & drop.

## Características

- ✨ **Drag & Drop**: Arrastra y suelta imágenes para cargarlas fácilmente
- 🖼️ **Vista Previa**: Muestra la imagen cargada en lugar de un input
- 🗑️ **Eliminación Segura**: Confirmación mediante diálogo antes de eliminar
- 📊 **Progreso de Carga**: Indicador visual del progreso de carga
- 🔄 **Refresh Callback**: Ejecuta acciones después de cargar/eliminar
- 🌐 **i18n**: Completamente traducido (español e inglés)
- 🎨 **Personalizable**: Props para controlar apariencia y comportamiento

## Uso Básico

```tsx
import { ImageUploader } from 'src/components/image-uploader';

function MyComponent() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleRefresh = async () => {
    // Refrescar datos del servicio principal
    await fetchMyData();
  };

  return (
    <ImageUploader
      imageUrl={imageUrl}
      onUploadSuccess={(url) => setImageUrl(url)}
      onDeleteSuccess={() => setImageUrl(null)}
      onRefresh={handleRefresh}
    />
  );
}
```

## Props

### `imageUrl?: string | null`
URL de la imagen actual (si existe). Si hay una URL, el componente muestra la imagen en lugar del área de carga.

### `placeholderText?: string`
Texto personalizado para mostrar cuando no hay imagen.
- **Default**: Traducción de `imageUploader.placeholder`

### `height?: number | string`
Altura del componente.
- **Default**: `320`

### `width?: number | string`
Ancho del componente.
- **Default**: `"100%"`

### `onUploadSuccess?: (imageUrl: string) => void`
Callback que se ejecuta después de subir exitosamente una imagen. Recibe la URL de la imagen cargada.

### `onDeleteSuccess?: () => void`
Callback que se ejecuta después de eliminar exitosamente una imagen.

### `onRefresh?: () => void | Promise<void>`
Callback para refrescar/recargar datos del servicio principal. Se ejecuta automáticamente después de cargar o eliminar.

### `disabled?: boolean`
Deshabilita el componente.
- **Default**: `false`

### `maxSize?: number`
Tamaño máximo del archivo en bytes.
- **Default**: `5242880` (5MB)

### `acceptedFileTypes?: string[]`
Tipos MIME permitidos.
- **Default**: `["image/jpeg", "image/png", "image/jpg", "image/webp"]`

### `loading?: boolean`
Mostrar loader externo durante operaciones asíncronas.
- **Default**: `false`

## Ejemplo Completo

```tsx
import { useState, useCallback } from 'react';
import { ImageUploader } from 'src/components/image-uploader';
import { GetMyDataService } from 'src/services/my-data.service';

function MyComponent() {
  const [data, setData] = useState<MyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await GetMyDataService();
      setData(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <ImageUploader
      imageUrl={data?.imageUrl}
      placeholderText="Sube la imagen de tu perfil"
      height={400}
      width="100%"
      maxSize={10 * 1024 * 1024} // 10MB
      acceptedFileTypes={['image/jpeg', 'image/png']}
      onUploadSuccess={(url) => {
        console.log('Imagen cargada:', url);
      }}
      onDeleteSuccess={() => {
        console.log('Imagen eliminada');
      }}
      onRefresh={loadData}
      loading={isLoading}
    />
  );
}
```

## Integración con Servicios

El componente utiliza los siguientes servicios del archivo `CreateFile.service.ts`:

### `CreateFileService(file, options)`
Sube un archivo mediante multipart/form-data y retorna:
```ts
{
  id: string;
  url: string;
  name: string;
  type: MediaType;
  size: number;
  mimeType: string;
}
```

### `DeleteFileService({ file: url })`
Elimina un archivo usando su URL.

## Traducciones

El componente está completamente traducido. Las traducciones se encuentran en:
- `src/locales/langs/es/common.json`
- `src/locales/langs/en/common.json`

Claves de traducción disponibles:
- `imageUploader.placeholder`
- `imageUploader.dropHere`
- `imageUploader.supportedFormats`
- `imageUploader.maxSize`
- `imageUploader.selectFile`
- `imageUploader.uploading`
- `imageUploader.deleting`
- `imageUploader.imageAlt`
- `imageUploader.dialog.title`
- `imageUploader.dialog.message`
- `imageUploader.dialog.cancel`
- `imageUploader.dialog.confirm`
- `imageUploader.messages.uploadSuccess`
- `imageUploader.messages.deleteSuccess`
- `imageUploader.errors.invalidType`
- `imageUploader.errors.fileTooLarge`
- `imageUploader.errors.uploadFailed`
- `imageUploader.errors.deleteFailed`

## Personalización

### Estilos Personalizados

El componente usa Material-UI y respeta el tema de la aplicación. Puedes personalizar:
- Altura y ancho mediante props
- Colores a través del tema de MUI
- Efectos hover y transiciones (heredados del tema)

### Validaciones

El componente valida automáticamente:
- ✅ Tipo de archivo (MIME type)
- ✅ Tamaño del archivo
- ✅ Solo permite una imagen a la vez

## Ejemplo de Uso en Learning Objects

```tsx
import { ImageUploader } from 'src/components/image-uploader';

function LearningObjectDetailsCard({ learningObject, onRefresh }: Props) {
  return (
    <Box>
      <Typography variant="h5">Imagen del Paquete</Typography>
      <ImageUploader
        imageUrl={learningObject.imageUrl}
        placeholderText="Sube la imagen del paquete de aprendizaje"
        height={400}
        onRefresh={onRefresh}
      />
    </Box>
  );
}
```

## Consideraciones

1. **Seguridad**: El componente muestra un diálogo de confirmación antes de eliminar
2. **UX**: Indicadores visuales de carga y progreso
3. **Accesibilidad**: Soporte completo de teclado y lectores de pantalla
4. **Responsive**: Se adapta a diferentes tamaños de pantalla
5. **Performance**: Solo carga una imagen a la vez

## Dependencias

- `react-dropzone`: Manejo de drag & drop
- `@mui/material`: Componentes UI
- `src/services/file/CreateFile.service`: Servicios de backend
- `src/locales`: Sistema de traducciones
