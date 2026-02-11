"use client";

import type { DropzoneOptions } from "react-dropzone";

import { useDropzone } from "react-dropzone";
import { useState, useCallback } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CardContent from "@mui/material/CardContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";

import { useTranslate } from "src/locales";
import { CreateFileService, DeleteFileService } from "src/services/file/CreateFile.service";

import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";

// ----------------------------------------------------------------------

export interface ImageUploaderProps {
  /**
   * URL de la imagen actual (si existe)
   */
  imageUrl?: string | null;

  /**
   * Texto personalizado para mostrar cuando no hay imagen
   */
  placeholderText?: string;

  /**
   * Altura del componente
   */
  height?: number | string;

  /**
   * Ancho del componente
   */
  width?: number | string;

  /**
   * Callback que se ejecuta después de subir exitosamente una imagen
   */
  onUploadSuccess?: (imageUrl: string) => void;

  /**
   * Callback que se ejecuta después de eliminar exitosamente una imagen
   */
  onDeleteSuccess?: () => void;

  /**
   * Callback para refrescar/recargar datos del servicio principal
   */
  onRefresh?: () => void | Promise<void>;

  /**
   * Deshabilitar el componente
   */
  disabled?: boolean;

  /**
   * Tamaño máximo del archivo en bytes
   */
  maxSize?: number;

  /**
   * Tipos MIME permitidos
   */
  acceptedFileTypes?: string[];

  /**
   * Mostrar loader durante la carga
   */
  loading?: boolean;
}

// ----------------------------------------------------------------------

export function ImageUploader({
  imageUrl,
  placeholderText,
  height = 320,
  width = "100%",
  onUploadSuccess,
  onDeleteSuccess,
  onRefresh,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  acceptedFileTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  loading: externalLoading = false,
}: ImageUploaderProps) {
  const { t } = useTranslate("common");

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];

      // Validar tipo de archivo
      if (!acceptedFileTypes.includes(file.type)) {
        toast.error(
          t("imageUploader.errors.invalidType", "Tipo de archivo no permitido. Por favor, sube una imagen válida.")
        );
        return;
      }

      // Validar tamaño
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        toast.error(
          t(
            "imageUploader.errors.fileTooLarge",
            `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
          )
        );
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Llamar al servicio de carga
        const response = await CreateFileService(file, {
          onProgress: (progress) => {
            setUploadProgress(progress.percentage);
          },
        });

        if (response?.url) {
          toast.success(t("imageUploader.messages.uploadSuccess", "Imagen cargada exitosamente"));
          onUploadSuccess?.(response.url);
          onRefresh?.();
        } else {
          throw new Error("No se recibió URL de la imagen");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(
          t("imageUploader.errors.uploadFailed", "Error al cargar la imagen. Por favor, intenta nuevamente.")
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [acceptedFileTypes, maxSize, onUploadSuccess, onRefresh, t]
  );

  const handleDelete = useCallback(async () => {
    if (!imageUrl) return;

    try {
      setIsDeleting(true);
      setOpenDeleteDialog(false);

      await DeleteFileService({ file: imageUrl });

      toast.success(t("imageUploader.messages.deleteSuccess", "Imagen eliminada exitosamente"));
      onDeleteSuccess?.();
      onRefresh?.();
    } catch (error: any) {
      console.error("Error deleting image:", error);
      
      // Si el error es 404 o la imagen no existe en el servidor (imagen externa)
      // Aún así removemos la referencia local
      const isNotFoundError = 
        error?.response?.status === 404 || 
        error?.statusCode === 404 ||
        error?.message?.includes('404') ||
        error?.message?.includes('Not Found');
      
      if (isNotFoundError) {
        toast.warning(
          t(
            "imageUploader.messages.deleteWarning", 
            "La imagen fue removida localmente. No se pudo eliminar del servidor (puede ser una imagen externa)."
          )
        );
        // Ejecutar los callbacks de todas formas para limpiar la referencia
        onDeleteSuccess?.();
        onRefresh?.();
      } else {
        toast.error(
          t("imageUploader.errors.deleteFailed", "Error al eliminar la imagen. Por favor, intenta nuevamente.")
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }, [imageUrl, onDeleteSuccess, onRefresh, t]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleUpload(acceptedFiles);
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
    disabled: disabled || isUploading || externalLoading,
    noClick: !!imageUrl, // No hacer clic si ya hay imagen
    noKeyboard: true,
  } as DropzoneOptions);

  const isLoading = isUploading || isDeleting || externalLoading;

  // Renderizar cuando hay imagen
  if (imageUrl && !isUploading) {
    return (
      <>
        <Card
          sx={{
            position: "relative",
            width,
            height,
            overflow: "hidden",
            borderRadius: 2,
            boxShadow: (theme) => theme.shadows[4],
          }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt={t("imageUploader.imageAlt", "Imagen cargada")}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Overlay con botón de eliminar */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "transparent",
              transition: "background 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              "&:hover": {
                opacity: 1,
                background: (theme) => alpha(theme.palette.grey[900], 0.7),
              },
            }}
          >
            <IconButton
              color="error"
              onClick={() => setOpenDeleteDialog(true)}
              disabled={disabled || isDeleting}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
                "&:hover": {
                  bgcolor: "background.paper",
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s",
              }}
            >
              {isDeleting ? (
                <CircularProgress size={24} color="error" />
              ) : (
                <Iconify icon="solar:trash-bin-trash-bold" width={24} />
              )}
            </IconButton>
          </Box>
        </Card>

        {/* Dialog de confirmación de eliminación */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:trash-bin-trash-bold" width={24} color="error.main" />
              <Typography variant="h6">
                {t("imageUploader.dialog.title", "¿Eliminar imagen?")}
              </Typography>
            </Stack>
          </DialogTitle>

          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {t(
                "imageUploader.dialog.message",
                "Esta acción no se puede deshacer. La imagen será eliminada definitivamente."
              )}
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
              {t("imageUploader.dialog.cancel", "Cancelar")}
            </Button>
            <Button onClick={handleDelete} variant="contained" color="error" autoFocus>
              {t("imageUploader.dialog.confirm", "Eliminar")}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Renderizar zona de carga (dropzone)
  return (
    <Card
      {...getRootProps()}
      sx={{
        width,
        height,
        borderRadius: 2,
        border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.32)}`,
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        transition: "all 0.3s",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          bgcolor: (theme) =>
            disabled || isLoading ? alpha(theme.palette.grey[500], 0.04) : alpha(theme.palette.primary.main, 0.08),
          borderColor: (theme) => (disabled || isLoading ? alpha(theme.palette.grey[500], 0.32) : "primary.main"),
        },
        ...(isDragActive && {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
          borderColor: "primary.main",
          transform: "scale(1.02)",
        }),
        ...(disabled && {
          opacity: 0.5,
        }),
      }}
    >
      <input {...getInputProps()} />

      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          p: 3,
        }}
      >
        {isLoading ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={48} />
            {isUploading && uploadProgress > 0 && (
              <Typography variant="body2" color="text.secondary">
                {t("imageUploader.uploading", "Cargando")}: {uploadProgress}%
              </Typography>
            )}
            {isDeleting && (
              <Typography variant="body2" color="text.secondary">
                {t("imageUploader.deleting", "Eliminando...")}
              </Typography>
            )}
          </Stack>
        ) : (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Iconify
                icon={(isDragActive ? "solar:cloud-upload-bold-duotone" : "solar:gallery-add-bold-duotone") as any}
                width={40}
                sx={{
                  color: "primary.main",
                }}
              />
            </Box>

            <Typography variant="h6" sx={{ mb: 1, textAlign: "center" }}>
              {isDragActive
                ? t("imageUploader.dropHere", "Suelta la imagen aquí")
                : placeholderText || t("imageUploader.placeholder", "Arrastra una imagen o haz clic para seleccionar")}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 2 }}>
              {t("imageUploader.supportedFormats", "Formatos soportados")}: JPEG, PNG, WEBP
            </Typography>

            <Button
              variant="outlined"
              size="large"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              startIcon={<Iconify icon={"solar:upload-bold-duotone" as any} />}
              disabled={disabled || isLoading}
            >
              {t("imageUploader.selectFile", "Seleccionar archivo")}
            </Button>

            <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
              {t("imageUploader.maxSize", "Tamaño máximo")}: {(maxSize / (1024 * 1024)).toFixed(1)}MB
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
