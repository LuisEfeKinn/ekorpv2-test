"use client";

import type { ILearningObject, ILearningObjectProduct } from "src/types/learning";

import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Container from "@mui/material/Container"
import Accordion from "@mui/material/Accordion";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import { alpha, useTheme } from "@mui/material/styles";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import { useTranslate } from "src/locales";

import { Iconify } from "src/components/iconify";

// ----------------------------------------------------------------------

type Props = {
  learningObject: ILearningObject;
}

export function LearningObjectDetailsCard({ learningObject }: Props) {
  const theme = useTheme();
  const { t } = useTranslate("learning");
  const [currentTab, setCurrentTab] = useState("overview");

  // Validación segura de datos
  const safeData = useMemo(
    () => {
      const normalizeUrl = (url?: string | null): string | null => {
        if (!url) return null;
        const trimmed = url.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          return trimmed;
        }
        return `https://${trimmed}`;
      };

      const getEmbedUrl = (url?: string | null): string | null => {
        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) return null;

        const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
        const youtubeMatch = normalizedUrl.match(youtubeRegex);
        if (youtubeMatch) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }

        const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
        const vimeoMatch = normalizedUrl.match(vimeoRegex);
        if (vimeoMatch) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        return normalizedUrl;
      };

      const normalizeText = (value?: string | null) => {
        if (!value) return null;
        const trimmed = String(value).trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      // Aceptar tanto `products` (forma antigua) como `courses` (respuesta del servicio)
      const rawProducts = Array.isArray(learningObject?.products)
        ? learningObject.products
        : Array.isArray(learningObject?.courses)
        ? learningObject.courses
        : [];

      // Normalizar cada elemento a la forma que espera el componente
      const products = (rawProducts as any[]).map((p: any) => ({
        productId: p.productId ?? p.id ?? p.lmsCourseId ?? String(Math.random()),
        id: p.id ?? p.productId ?? p.lmsCourseId ?? null,
        lmsCourseId: p.lmsCourseId ?? null,
        name: p.name ?? p.fullName ?? t("learning-objects.details.unnamedCourse", "Curso sin nombre"),
        order: p.order ?? 0,
        imageUrl: p.imageUrl ?? p.thumbnail ?? null,
        duration: p.duration ?? null,
        category: p.category ?? null,
        difficultyLevel: p.difficultyLevel ?? null,
        isFree: p.isFree ?? false,
        price: p.price ?? null,
        priceDiscount: p.priceDiscount ?? null,
        description: p.description ?? null,
        tags: p.tags ?? [],
      }));

      // Calcular duración total de forma segura (si los productos contienen duraciones en formato H:M)
      const totalDuration = products.reduce((sum: number, product: any) => {
        try {
          const durationStr = product?.duration || "0:0";
          const [hours = 0, minutes = 0] = String(durationStr).split(":").map((v: string) => Number(v) || 0);
          return sum + (hours * 60) + minutes;
        } catch {
          return sum;
        }
      }, 0);

      const rawTags = learningObject?.tags;
      const tags = Array.isArray(rawTags)
        ? rawTags.map((tag) => String(tag).trim()).filter(Boolean)
        : typeof rawTags === "string"
        ? rawTags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      return {
        id: learningObject?.id || "",
        name: learningObject?.name || t("learning-objects.details.noName"),
        description: learningObject?.description || t("learning-objects.details.noDescription"),
        order: learningObject?.order ?? 1,
        isActive: learningObject?.isActive ?? true,
        duration: normalizeText(learningObject?.duration || null),
        videoEmbedUrl: getEmbedUrl(learningObject?.videoUrl || null),
        objective: normalizeText(learningObject?.objective || null),
        skillsToAcquire: normalizeText(learningObject?.skillsToAcquire || null),
        whatYouWillLearn: normalizeText(learningObject?.whatYouWillLearn || null),
        tags,
        categoryName: learningObject?.category?.name || null,
        difficultyName: learningObject?.difficultyLevel?.name || null,
        createdAt: learningObject?.createdAt || null,
        // Priorizar imageUrl para el header y avatar
        bannerImage: normalizeText(learningObject?.bannerUrl) || normalizeText(learningObject?.imageUrl),
        avatarImage: learningObject?.imageUrl || null,
        // Productos/Cursos del paquete (normalizados)
        products,
        totalDuration,
        totalCourses: products.length,
      };
    },
    [learningObject, t],
  )

  // Formatear duración total de minutos a formato HH:MM
  const formatDuration = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDate = (value: string | Date | null): string | null => {
    if (!value) return null;
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(dateValue);
  };

  const renderHeader = (
    <Box
      sx={{
        position: "relative",
        height: { xs: 280, sm: 350, md: 420 },
        overflow: "hidden",
        mb: { xs: 3, md: 5 },
        borderRadius: { xs: 0, sm: 3 },
        mx: { xs: -2, sm: 0 },
      }}
    >
      {/* Banner de fondo con overlay mejorado */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: safeData.bannerImage
            ? `url(${safeData.bannerImage})`
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)",
          },
        }}
      />

      {/* Estado activo/inactivo - Mejor posicionamiento */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 2,
        }}
      >
        <Chip
          icon={<Iconify icon={safeData.isActive ? "solar:check-circle-bold" : "solar:close-circle-bold"} width={18} />}
          label={
            safeData.isActive
              ? t("learning-objects.details.active")
              : t("learning-objects.details.inactive")
          }
          size="medium"
          color={safeData.isActive ? "success" : "error"}
          sx={{
            fontWeight: 600,
            backdropFilter: "blur(10px)",
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          }}
        />
      </Box>

      {/* Contenido del header con mejor layout */}
      <Container
        maxWidth="xl"
        sx={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          pb: { xs: 3, md: 4 },
          zIndex: 1,
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-end">
          {/* Avatar del curso - Más grande y prominente */}
          <Grid size={{ xs: 12, sm: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: { xs: "center", sm: "flex-start" } }}>
              <Avatar
                sx={{
                  width: { xs: 100, sm: 120, md: 140 },
                  height: { xs: 100, sm: 120, md: 140 },
                  border: `5px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.9),
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.4)}`,
                }}
              >
                {safeData.avatarImage ? (
                  <Box
                    component="img"
                    src={safeData.avatarImage}
                    alt={safeData.name}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      // Si la imagen falla al cargar, ocultar el elemento
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : (
                  <Iconify icon="solar:notebook-bold-duotone" width={70} sx={{ color: "white" }} />
                )}
              </Avatar>
            </Box>
          </Grid>

          {/* Información principal con mejor jerarquía */}
          <Grid size={{ xs: 12, sm: "auto" }} sx={{ flex: 1 }}>
            <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
              <Typography
                variant="h3"
                sx={{
                  mb: 2,
                  fontWeight: 800,
                  color: "white",
                  textShadow: "2px 2px 8px rgba(0,0,0,0.6)",
                  fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                  lineHeight: 1.2,
                }}
              >
                {safeData.name}
              </Typography>

              <Stack
                direction="row"
                spacing={1.5}
                flexWrap="wrap"
                alignItems="center"
                justifyContent={{ xs: "center", sm: "flex-start" }}
                sx={{ mb: 2 }}
              >
                <Chip
                  icon={<Iconify icon="solar:book-bold" width={16} />}
                  label={`${safeData.totalCourses} ${safeData.totalCourses === 1 ? t("learning-objects.details.course") : t("learning-objects.details.courses")}`}
                  size="medium"
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.25),
                    color: "white",
                    fontWeight: 600,
                    backdropFilter: "blur(10px)",
                    "& .MuiChip-icon": { color: "white" },
                  }}
                />

                <Chip
                  icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                  label={`${formatDuration(safeData.totalDuration)} ${t("learning-objects.details.hours")}`}
                  size="medium"
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.25),
                    color: "white",
                    fontWeight: 600,
                    backdropFilter: "blur(10px)",
                    "& .MuiChip-icon": { color: "white" },
                  }}
                />

                <Chip
                  icon={<Iconify icon="solar:list-bold" width={16} />}
                  label={`${t("learning-objects.details.order")}: ${safeData.order}`}
                  size="medium"
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.25),
                    color: "white",
                    fontWeight: 600,
                    backdropFilter: "blur(10px)",
                    "& .MuiChip-icon": { color: "white" },
                  }}
                />
              </Stack>

              {/* Información del paquete */}
              <Chip
                icon={<Iconify icon="solar:inbox-bold" width={20} />}
                label={t("learning-objects.details.package")}
                size="medium"
                color="info"
                sx={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  height: 40,
                  "& .MuiChip-icon": { fontSize: 20 },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )

  const TABS = [
    {
      value: "overview",
      label: t("learning-objects.details.overview"),
      icon: "solar:documents-bold-duotone",
    },
    {
      value: "courses",
      label: t("learning-objects.details.courses"),
      icon: "solar:notebook-bold-duotone",
    },
  ]

  const renderContent = (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      {/* Columna principal con tabs */}
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{
              px: 3,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<Iconify icon={tab.icon as any} width={20} />}
                iconPosition="start"
                sx={{
                  minHeight: 64,
                  fontWeight: 600,
                }}
              />
            ))}
          </Tabs>

          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {/* Tab: Overview */}
            {currentTab === "overview" && (
              <Stack spacing={3}>
                {/* Descripción principal */}
                {safeData.description ? (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon="solar:notes-bold-duotone" width={24} sx={{ color: "primary.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("learning-objects.details.description")}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        color: "text.secondary",
                        lineHeight: 1.8,
                        "& p": { mb: 2 },
                        "& ul, & ol": { pl: 3, mb: 2 },
                        "& li": { mb: 0.5 },
                        "& h1, & h2, & h3, & h4, & h5, & h6": { mb: 1.5, mt: 2, fontWeight: 700 },
                        "& a": { color: "primary.main", textDecoration: "underline" },
                        "& strong": { fontWeight: 700 },
                        "& em": { fontStyle: "italic" },
                      }}
                      dangerouslySetInnerHTML={{ __html: safeData.description }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Iconify
                      icon="solar:file-text-bold"
                      width={80}
                      sx={{ color: "text.disabled", mb: 2, opacity: 0.3 }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      {t("learning-objects.details.noContentAvailable")}
                    </Typography>
                  </Box>
                )}

                {safeData.objective && (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.info.main, 0.12),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon="solar:flag-bold" width={24} sx={{ color: "info.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("learning-objects.details.objective")}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        color: "text.secondary",
                        lineHeight: 1.8,
                        "& p": { mb: 2 },
                        "& ul, & ol": { pl: 3, mb: 2 },
                        "& li": { mb: 0.5 },
                        "& strong": { fontWeight: 700 },
                        "& em": { fontStyle: "italic" },
                      }}
                      dangerouslySetInnerHTML={{ __html: safeData.objective }}
                    />
                  </Box>
                )}

                {safeData.whatYouWillLearn && (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.12),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon="solar:book-bold" width={24} sx={{ color: "success.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("learning-objects.details.whatYouWillLearn")}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        color: "text.secondary",
                        lineHeight: 1.8,
                        "& p": { mb: 2 },
                        "& ul, & ol": { pl: 3, mb: 2 },
                        "& li": { mb: 0.5 },
                        "& strong": { fontWeight: 700 },
                        "& em": { fontStyle: "italic" },
                      }}
                      dangerouslySetInnerHTML={{ __html: safeData.whatYouWillLearn }}
                    />
                  </Box>
                )}

                {safeData.skillsToAcquire && (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.warning.main, 0.12),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon="solar:medal-star-bold" width={24} sx={{ color: "warning.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("learning-objects.details.skillsToAcquire")}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        color: "text.secondary",
                        lineHeight: 1.8,
                        "& p": { mb: 2 },
                        "& ul, & ol": { pl: 3, mb: 2 },
                        "& li": { mb: 0.5 },
                        "& strong": { fontWeight: 700 },
                        "& em": { fontStyle: "italic" },
                      }}
                      dangerouslySetInnerHTML={{ __html: safeData.skillsToAcquire }}
                    />
                  </Box>
                )}

                {safeData.tags.length > 0 && (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.secondary.main, 0.12),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon="solar:tag-horizontal-bold-duotone" width={24} sx={{ color: "secondary.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("learning-objects.details.tags")}
                      </Typography>
                    </Stack>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {safeData.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                      ))}
                    </Box>
                  </Box>
                )}

              </Stack>
            )}

            {/* Tab: Courses */}
            {currentTab === "courses" && (
              <Stack spacing={2}>
                {safeData.products.length > 0 ? (
                  safeData.products.map((product: ILearningObjectProduct) => (
                    <Accordion
                      key={product.productId}
                      defaultExpanded={false}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: "12px !important",
                        overflow: "hidden",
                        boxShadow: "none",
                        "&:before": {
                          display: "none",
                        },
                        "&.Mui-expanded": {
                          margin: "0 !important",
                          mb: 2,
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={20} />}
                        sx={{
                          minHeight: 72,
                          px: 2.5,
                          py: 1.5,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                          },
                          "& .MuiAccordionSummary-content": {
                            my: 1.5,
                          },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: "100%", pr: 1 }}>
                          {/* Imagen miniatura */}
                          {product.imageUrl && (
                            <Box
                              component="img"
                              src={product.imageUrl}
                              alt={product.name}
                              sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 1.5,
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          
                          {/* Información resumida */}
                          <Stack spacing={0.5} flex={1} minWidth={0}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Chip
                                label={`#${product.order}`}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: "primary.main",
                                  fontWeight: 600,
                                  height: 24,
                                }}
                              />
                              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1, minWidth: 0 }}>
                                {product.name}
                              </Typography>
                            </Stack>
                            
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                              {product.duration && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Iconify icon="solar:clock-circle-bold" width={14} sx={{ color: "text.secondary" }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {product.duration}
                                  </Typography>
                                </Stack>
                              )}
                              {product.category && (
                                <Chip
                                  label={product.category.name}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderRadius: 1, height: 20, fontSize: "0.7rem" }}
                                />
                              )}
                              {product.difficultyLevel && (
                                <Chip
                                  label={product.difficultyLevel.name}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderRadius: 1, height: 20, fontSize: "0.7rem" }}
                                />
                              )}
                              {product.isFree && (
                                <Chip
                                  label={t("learning-objects.fields.free.label", "Gratis")}
                                  size="small"
                                  color="success"
                                  sx={{ borderRadius: 1, height: 20, fontSize: "0.7rem" }}
                                />
                              )}
                              {!product.isFree && product.price && (
                                <Typography variant="caption" fontWeight={700} color="success.main">
                                  ${product.price}
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </Stack>
                      </AccordionSummary>

                      <AccordionDetails sx={{ px: 2.5, py: 2, bgcolor: alpha(theme.palette.grey[500], 0.02) }}>
                        <Stack spacing={2.5}>
                          {/* Descripción completa */}
                          {product.description && (
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                {t("learning-objects.details.description")}
                              </Typography>
                              <Box
                                sx={{
                                  color: "text.secondary",
                                  lineHeight: 1.6,
                                  fontSize: "0.875rem",
                                  "& p": { mb: 1 },
                                  "& ul, & ol": { pl: 2, mb: 1 },
                                  "& li": { mb: 0.25 },
                                  "& strong": { fontWeight: 600 },
                                }}
                                dangerouslySetInnerHTML={{ __html: product.description }}
                              />
                            </Box>
                          )}

                          <Divider />

                          {/* Información detallada */}
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                            {/* Categoría y Nivel */}
                            <Stack spacing={1} flex={1}>
                              {product.category && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("learning-objects.details.category")}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {product.category.name}
                                  </Typography>
                                </Box>
                              )}
                              {product.difficultyLevel && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("learning-objects.details.difficulty", "Nivel")}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {product.difficultyLevel.name}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>

                            {/* Duración y Precio */}
                            <Stack spacing={1} flex={1}>
                              {product.duration && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("learning-objects.details.contentDuration")}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {product.duration}
                                  </Typography>
                                </Box>
                              )}
                              {!product.isFree && product.price && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("learning-objects.details.price")}
                                  </Typography>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" fontWeight={700} color="success.main">
                                      ${product.price}
                                    </Typography>
                                    {product.priceDiscount && (
                                      <Typography
                                        variant="caption"
                                        color="text.disabled"
                                        sx={{ textDecoration: "line-through" }}
                                      >
                                        ${product.priceDiscount}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>
                              )}
                            </Stack>
                          </Stack>

                          {/* Tags */}
                          {product.tags && (
                            <>
                              <Divider />
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block" }}>
                                  {t("learning-objects.details.tags")}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                  {(Array.isArray(product.tags) ? product.tags : [product.tags]).map((tag: string, tagIndex: number) => (
                                    <Chip
                                      key={tagIndex}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                      sx={{ borderRadius: 1.5 }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </>
                          )}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))
                ) : (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Iconify
                      icon="solar:notebook-bold-duotone"
                      width={80}
                      sx={{ color: "text.disabled", mb: 2, opacity: 0.3 }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      {t("learning-objects.messages.noProducts")}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Sidebar */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          {safeData.videoEmbedUrl && (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Iconify icon="solar:video-frame-play-horizontal-bold" width={24} sx={{ color: "primary.main" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    {t("learning-objects.details.video")}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    position: "relative",
                    paddingTop: "56.25%",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.12)}`,
                  }}
                >
                  <Box
                    component="iframe"
                    src={safeData.videoEmbedUrl}
                    title={t("learning-objects.details.videoTitle")}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          )}
          {/* Información del paquete */}
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: "white",
              position: "sticky",
              top: 24,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Título */}
                <Box sx={{ textAlign: "center" }}>
                  <Iconify icon="solar:inbox-in-bold-duotone" width={48} sx={{ mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                    {t("learning-objects.details.packageContent")}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t("learning-objects.details.packageDescription")}
                  </Typography>
                </Box>

                {/* Estadísticas del paquete */}
                <Stack spacing={1.5} sx={{ pt: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon="solar:notebook-bold-duotone" width={20} />
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      {safeData.totalCourses} {t("learning-objects.details.coursesIncluded")}
                    </Typography>
                  </Stack>
                  {safeData.totalDuration > 0 && (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Iconify icon="solar:clock-circle-bold" width={20} />
                      <Typography variant="body2" sx={{ opacity: 0.95 }}>
                        {formatDuration(safeData.totalDuration)} {t("learning-objects.details.totalDuration")}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon="solar:medal-star-bold" width={20} />
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      {t("learning-objects.details.certificateOnCompletion")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon="solar:restart-bold" width={20} />
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      {t("learning-objects.details.lifetimeAccess")}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                {t("learning-objects.details.packageInfo")}
              </Typography>

              <Stack spacing={2.5}>
                {/* Estado */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                  >
                    {t("learning-objects.details.state")}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette[safeData.isActive ? "success" : "error"].main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Iconify
                        icon={safeData.isActive ? "solar:check-circle-bold" : "solar:close-circle-bold"}
                        width={18}
                        sx={{ color: safeData.isActive ? "success.main" : "error.main" }}
                      />
                    </Box>
                    <Chip
                      label={safeData.isActive ? t("learning-objects.form.fields.isActive.active") : t("learning-objects.form.fields.isActive.inactive")}
                      size="small"
                      color={safeData.isActive ? "success" : "error"}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Orden */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                  >
                    {t("learning-objects.form.fields.order.label")}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Iconify icon="solar:list-bold" width={18} sx={{ color: "primary.main" }} />
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      #{safeData.order}
                    </Typography>
                  </Stack>
                </Box>

                {(safeData.categoryName || safeData.difficultyName || safeData.duration || safeData.createdAt) && (
                  <>
                    <Divider />
                    <Stack spacing={2.5}>
                      {safeData.categoryName && (
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                          >
                            {t("learning-objects.details.category")}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {safeData.categoryName}
                          </Typography>
                        </Box>
                      )}
                      {safeData.difficultyName && (
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                          >
                            {t("learning-objects.details.difficulty")}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {safeData.difficultyName}
                          </Typography>
                        </Box>
                      )}
                      {safeData.duration && (
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                          >
                            {t("learning-objects.details.duration")}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {safeData.duration}
                          </Typography>
                        </Box>
                      )}
                      {formatDate(safeData.createdAt) && (
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                          >
                            {t("learning-objects.details.createdAt")}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatDate(safeData.createdAt)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  )

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: { xs: 5, md: 8 } }}>
        {renderHeader}
        {renderContent}
      </Box>
    </Container>
  )
}
