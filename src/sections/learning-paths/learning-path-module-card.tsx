"use client";

import type { CardProps } from "@mui/material/Card";
import type { ILearningPathModule } from "src/types/learning";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";

import { useTranslate } from "src/locales";

import { Iconify } from "src/components/iconify";

// ----------------------------------------------------------------------

type Props = CardProps & {
  module: ILearningPathModule;
  index: number;
  onViewDetails?: () => void;
}

export function LearningPathModuleCard({ module, index, onViewDetails, sx, ...other }: Props) {
  const { t } = useTranslate("learning");

  // Obtener color basado en el índice
  const getModuleColor = (idx: number): "primary" | "secondary" | "info" | "success" | "warning" | "error" => {
    const colors: Array<"primary" | "secondary" | "info" | "success" | "warning" | "error"> = [
      "primary",
      "info",
      "success",
      "warning",
      "error",
      "secondary",
    ];
    return colors[idx % colors.length];
  }

  // Calcular totales
  const coursesCount = module.learningObjects?.length || 0;
  const totalDuration =
    module.learningObjects?.reduce((acc, obj) => {
      if (obj.learningObject?.duration) {
        const match = obj.learningObject.duration.match(/(\d+)/);
        return acc + (match ? Number.parseInt(match[1], 10) : 0);
      }
      return acc;
    }, 0) || 0;

  const moduleColor = getModuleColor(index);

  // Obtener el nombre del módulo (del skill o generar uno)
  const getModuleName = () => {
    if (module.skill?.name) {
      return module.skill.name;
    }
    return `${t("learning-paths.details.moduleNumber")}`;
  }

  // Generar una descripción basada en los cursos
  const generateDescription = () => {
    if (!module.learningObjects || module.learningObjects.length === 0) {
      return t("learning-paths.details.noCoursesDescription");
    }

    const courseNames = module.learningObjects
      .slice(0, 2)
      .map((obj) => obj.learningObject?.name)
      .filter(Boolean)
      .join(", ");

    const remaining = module.learningObjects.length - 2;

    if (remaining > 0) {
      return `${courseNames} ${t("learning-paths.details.andMoreCourses")}`;
    }

    return (
      courseNames ||
      t("learning-paths.details.coursesAvailable")
    );
  }

  // Imagen de fondo del módulo (usaremos la primera imagen de curso disponible o un gradiente)
  const getModuleImage = () => {
    const firstCourse = module.learningObjects?.[0]?.learningObject;
    if (firstCourse) {
      // Priorizar bannerUrl, luego imageUrl, luego productImage (compatibilidad)
      const image = firstCourse.bannerUrl || firstCourse.imageUrl || firstCourse.productImage
      if (image && image !== "string" && image !== null) {
        return image;
      }
    }
    // Retornar null para usar gradiente por defecto
    return null;
  }

  const moduleImage = getModuleImage();

  const renderHeader = (
    <Box
      sx={{
        position: "relative",
        width: 1,
        height: 200,
        overflow: "hidden",
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
      }}
    >
      {/* Imagen de fondo o gradiente */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          ...(moduleImage && {
            backgroundImage: `url(${moduleImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }),
          ...(!moduleImage && {
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette[moduleColor].main, 0.9)} 0%, ${alpha(theme.palette[moduleColor].dark, 0.7)} 100%)`,
          }),
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            background: moduleImage
              ? `linear-gradient(180deg, ${alpha("#000", 0.3)} 0%, ${alpha("#000", 0.7)} 100%)`
              : "transparent",
          },
        }}
      />

      {/* Badge del módulo */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 2,
        }}
      >
        <Chip
          label={`${index + 1}`}
          size="small"
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            fontWeight: "bold",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        />
        <Chip
          icon={<Iconify icon="solar:play-circle-bold" width={16} />}
          label={`${coursesCount} ${t("learning-paths.details.coursesLabel")}`}
          size="small"
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            "& .MuiChip-icon": {
              color: "white",
            },
          }}
        />
      </Stack>
    </Box>
  )

  const renderContent = (
    <CardContent sx={{ p: 3 }}>
      <Stack spacing={2}>
        {/* Título del módulo */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: "text.primary",
            minHeight: 56,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {getModuleName()}
        </Typography>

        {/* Descripción generada */}
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            minHeight: 44,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {generateDescription()}
        </Typography>

        {/* Nivel de dificultad si existe */}
        {module.difficultyLevel && (
          <Chip
            label={module.difficultyLevel.name}
            size="small"
            color={moduleColor}
            variant="soft"
            sx={{ width: "fit-content", fontWeight: 600 }}
          />
        )}
      </Stack>
    </CardContent>
  )

  const renderFooter = (
    <Box
      sx={{
        p: 2,
        pt: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Información de elementos y duración */}
      <Stack direction="row" spacing={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:list-bold" width={20} sx={{ color: "text.disabled" }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {coursesCount} {t("learning-paths.details.elementsLabel")}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:clock-circle-bold" width={20} sx={{ color: "text.disabled" }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {totalDuration} {t("learning-paths.details.hoursLabel")}
          </Typography>
        </Stack>
      </Stack>

      {/* Botón de ver detalles */}
      {onViewDetails && (
        <Button
          fullWidth
          variant="outlined"
          color={moduleColor}
          endIcon={<Iconify icon="eva:arrow-forward-fill" />}
          onClick={onViewDetails}
          sx={{
            borderWidth: 2,
            fontWeight: "bold",
            "&:hover": {
              borderWidth: 2,
            },
          }}
        >
          {t("learning-paths.details.viewDetailsButton")}
        </Button>
      )}
    </Box>
  )

  return (
    <Card
      sx={{
        position: "relative",
        boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)",
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        borderRadius: 2,
        transition: (theme) =>
          theme.transitions.create(["box-shadow", "transform", "border-color"], {
            duration: theme.transitions.duration.standard,
          }),
        "&:hover": {
          boxShadow: "0 0 2px 0 rgba(145, 158, 171, 0.24), 0 20px 40px -4px rgba(145, 158, 171, 0.24)",
          transform: "translateY(-8px)",
          borderColor: (theme) => alpha(theme.palette[moduleColor].main, 0.24),
        },
        ...sx,
      }}
      {...other}
    >
      {renderHeader}
      {renderContent}
      {renderFooter}
    </Card>
  )
}