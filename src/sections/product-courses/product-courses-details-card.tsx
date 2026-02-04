"use client";

import type { IProductCourse } from "src/types/learning";

import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import { alpha, useTheme } from "@mui/material/styles";

import { fCurrency } from "src/utils/format-number";

import { useTranslate } from "src/locales";

import { Iconify } from "src/components/iconify";

// ----------------------------------------------------------------------

type Props = {
  productCourse: IProductCourse;
}

export function ProductCoursesDetailsCard({ productCourse }: Props) {
  const theme = useTheme();
  const { t } = useTranslate("learning");
  const [currentTab, setCurrentTab] = useState("overview");

  // Función para convertir URLs de YouTube/Vimeo a formato embed
  const getEmbedUrl = (url: string): string => {
    if (!url) return "";

    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be")
        ? url.split("youtu.be/")[1]?.split("?")[0]
        : url.split("v=")[1]?.split("&")[0]

      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }

    // Si ya es una URL embed o de otro servicio, devolverla tal cual
    return url;
  }

  // Validación segura de datos
  const safeData = useMemo(
    () => ({
      id: productCourse?.id || "",
      name: productCourse?.name || t("product-courses.details.noName"),
      description: productCourse?.description || t("product-courses.details.noDescription"),
      duration: productCourse?.duration || "00:00",
      price: productCourse?.price ?? 0,
      priceDiscount: productCourse?.priceDiscount ?? 0,
      isFree: productCourse?.isFree ?? true,
      isActive: productCourse?.isActive ?? true,
      categoryName: productCourse?.category?.name || productCourse?.categoryName || t("product-courses.details.noCategory"),
      categoryAbreviation: productCourse?.category?.abreviation || "",
      difficultyLevelName: productCourse?.difficultyLevel?.name || productCourse?.difficultyLevelName || t("product-courses.details.noDifficulty"),
      courseLmsName: productCourse?.courseLms?.fullName || t("product-courses.details.noCourse"),
      courseLmsCode: productCourse?.courseLms?.codeCourse || "",
      tags: productCourse?.tags ? productCourse.tags.split(",").map((tag: string) => tag.trim()) : [],
      // Priorizar bannerUrl para el header, imageUrl para avatar
      bannerImage: productCourse?.bannerUrl || productCourse?.imageUrl || null,
      avatarImage: productCourse?.imageUrl || productCourse?.bannerUrl || null,
      videoUrl: getEmbedUrl(productCourse?.videoUrl || ""),
      objective: productCourse?.objective || "",
      skillsToAcquire: productCourse?.skillsToAcquire || "",
      whatYouWillLearn: productCourse?.whatYouWillLearn || "",
      isStudentLimited: productCourse?.isStudentLimited ?? false,
      studentLimit: productCourse?.studentLimit || "",
    }),
    [productCourse, t],
  )

  const getDifficultyColor = (level: string): "success" | "warning" | "error" | "info" => {
    const lowerLevel = level?.toLowerCase() || ""
    if (lowerLevel.includes("básico") || lowerLevel.includes("basico") || lowerLevel.includes("beginner")) {
      return "success"
    }
    if (lowerLevel.includes("intermedio") || lowerLevel.includes("intermediate")) {
      return "warning"
    }
    if (lowerLevel.includes("avanzado") || lowerLevel.includes("advanced")) {
      return "error"
    }
    return "info"
  }

  const getDifficultyIcon = (level: string) => {
    const lowerLevel = level?.toLowerCase() || "";
    if (lowerLevel.includes("básico") || lowerLevel.includes("basico") || lowerLevel.includes("beginner")) {
      return "solar:star-bold";
    }
    if (lowerLevel.includes("intermedio") || lowerLevel.includes("intermediate")) {
      return "solar:star-bold";
    }
    if (lowerLevel.includes("avanzado") || lowerLevel.includes("advanced")) {
      return "solar:cup-star-bold";
    }
    return "solar:star-bold";
  }

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
              ? t("product-courses.details.active")
              : t("product-courses.details.inactive")
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
                  icon={<Iconify icon="solar:add-folder-bold" width={16} />}
                  label={safeData.categoryName}
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
                  icon={<Iconify icon={getDifficultyIcon(safeData.difficultyLevelName)} width={16} />}
                  label={safeData.difficultyLevelName}
                  size="medium"
                  color={getDifficultyColor(safeData.difficultyLevelName)}
                  sx={{ fontWeight: 600 }}
                />

                <Chip
                  icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                  label={safeData.duration}
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

              {/* Precio con mejor diseño */}
              {safeData.isFree ? (
                <Chip
                  icon={<Iconify icon="solar:wad-of-money-bold" width={20} />}
                  label={t("learning-objects.details.free", "Gratis")}
                  size="medium"
                  color="success"
                  sx={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    height: 40,
                    "& .MuiChip-icon": { fontSize: 20 },
                  }}
                />
              ) : (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent={{ xs: "center", sm: "flex-start" }}
                >
                  {safeData.priceDiscount > 0 && (
                    <Typography
                      variant="h5"
                      sx={{
                        textDecoration: "line-through",
                        opacity: 0.7,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 500,
                      }}
                    >
                      {fCurrency(safeData.price)}
                    </Typography>
                  )}
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: theme.palette.success.light,
                      textShadow: "2px 2px 8px rgba(0,0,0,0.6)",
                    }}
                  >
                    {fCurrency(safeData.priceDiscount > 0 ? safeData.priceDiscount : safeData.price)}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )

  const TABS = [
    {
      value: "overview",
      label: t("product-courses.details.overview"),
      icon: "solar:documents-bold-duotone",
    },
    {
      value: "content",
      label: t("product-courses.details.content"),
      icon: "solar:notebook-bold-duotone",
    },
    ...(safeData.videoUrl
      ? [
        {
          value: "video",
          label: t("product-courses.details.video"),
          icon: "solar:videocamera-bold-duotone",
        },
      ]
      : []),
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
              <Stack spacing={4}>
                {/* Descripción principal */}
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Iconify icon={"solar:document-text-bold" as any} width={24} sx={{ color: "primary.main" }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                      {t("product-courses.details.description")}
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
                      "& blockquote": {
                        pl: 2,
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                        fontStyle: "italic",
                        opacity: 0.8,
                      },
                      "& code": {
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.grey[500], 0.1),
                        fontFamily: "monospace",
                        fontSize: "0.9em",
                      },
                      "& pre": {
                        p: 2,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.grey[500], 0.1),
                        overflow: "auto",
                      },
                      "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
                    }}
                    dangerouslySetInnerHTML={{ __html: safeData.description }}
                  />
                </Box>

                <Divider />

                {/* Objetivo */}
                {safeData.objective && (
                  <>
                    <Box>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Iconify icon="solar:flag-bold" width={24} sx={{ color: "success.main" }} />
                        </Box>
                        <Typography variant="h5" fontWeight={700}>
                          {t("product-courses.details.objective")}
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
                          "& blockquote": {
                            pl: 2,
                            borderLeft: `3px solid ${theme.palette.success.main}`,
                            fontStyle: "italic",
                            opacity: 0.8,
                          },
                          "& code": {
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                            fontFamily: "monospace",
                            fontSize: "0.9em",
                          },
                          "& pre": {
                            p: 2,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                            overflow: "auto",
                          },
                          "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
                        }}
                        dangerouslySetInnerHTML={{ __html: safeData.objective }}
                      />
                    </Box>
                    <Divider />
                  </>
                )}

                {/* Tags */}
                {safeData.tags.length > 0 && (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon={"solar:hashtag-bold" as any} width={24} sx={{ color: "info.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("product-courses.details.tags")}
                      </Typography>
                    </Stack>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {safeData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="medium"
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            fontWeight: 500,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              borderColor: "primary.main",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Stack>
            )}

            {/* Tab: Content */}
            {currentTab === "content" && (
              <Stack spacing={4}>
                {/* Qué aprenderás */}
                {safeData.whatYouWillLearn && (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon={"solar:lightbulb-bold" as any} width={24} sx={{ color: "warning.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("product-courses.details.whatYouWillLearn")}
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
                        "& blockquote": {
                          pl: 2,
                          borderLeft: `3px solid ${theme.palette.warning.main}`,
                          fontStyle: "italic",
                          opacity: 0.8,
                        },
                        "& code": {
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          fontFamily: "monospace",
                          fontSize: "0.9em",
                        },
                        "& pre": {
                          p: 2,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          overflow: "auto",
                        },
                        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
                      }}
                      dangerouslySetInnerHTML={{ __html: safeData.whatYouWillLearn }}
                    />
                  </Box>
                )}

                {safeData.whatYouWillLearn && safeData.skillsToAcquire && <Divider />}

                {/* Habilidades a adquirir */}
                {safeData.skillsToAcquire && (
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Iconify icon="solar:cup-star-bold" width={24} sx={{ color: "error.main" }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {t("product-courses.details.skillsToAcquire")}
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
                        "& blockquote": {
                          pl: 2,
                          borderLeft: `3px solid ${theme.palette.error.main}`,
                          fontStyle: "italic",
                          opacity: 0.8,
                        },
                        "& code": {
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          fontFamily: "monospace",
                          fontSize: "0.9em",
                        },
                        "& pre": {
                          p: 2,
                          borderRadius: 1,
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          overflow: "auto",
                        },
                        "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 },
                      }}
                      dangerouslySetInnerHTML={{ __html: safeData.skillsToAcquire }}
                    />
                  </Box>
                )}

                {!safeData.whatYouWillLearn && !safeData.skillsToAcquire && (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Iconify
                      icon={"solar:document-text-bold" as any}
                      width={80}
                      sx={{ color: "text.disabled", mb: 2, opacity: 0.3 }}
                    />
                    <Typography variant="h6" color="text.secondary">
                      {t("product-courses.details.noContentAvailable")}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            {/* Tab: Video */}
            {currentTab === "video" && safeData.videoUrl && (
              <Box>
                <Box
                  sx={{
                    position: "relative",
                    paddingTop: "56.25%", // Aspect ratio 16:9
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                  }}
                >
                  <Box
                    component="iframe"
                    src={safeData.videoUrl}
                    title={t("product-courses.details.videoTitle")}
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
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Sidebar mejorado */}
      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          {/* CTA Card - Más prominente */}
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
                {/* Precio destacado */}
                <Box sx={{ textAlign: "center" }}>
                  {safeData.isFree ? (
                    <>
                      <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>
                        {t("product-courses.details.free")}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {t("product-courses.details.fullAccessFree")}
                      </Typography>
                    </>
                  ) : (
                    <>
                      {safeData.priceDiscount > 0 && (
                        <Typography
                          variant="h6"
                          sx={{
                            textDecoration: "line-through",
                            opacity: 0.7,
                            mb: 0.5,
                          }}
                        >
                          {fCurrency(safeData.price)}
                        </Typography>
                      )}
                      <Typography variant="h2" fontWeight={800} sx={{ mb: 1 }}>
                        {fCurrency(safeData.priceDiscount > 0 ? safeData.priceDiscount : safeData.price)}
                      </Typography>
                      {safeData.priceDiscount > 0 && (
                        <Chip
                          label={`${Math.round(((safeData.price - safeData.priceDiscount) / safeData.price) * 100)}% OFF`}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.common.white, 0.25),
                            color: "white",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </>
                  )}
                </Box>

                {/* Botón CTA */}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    bgcolor: "white",
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    py: 1.5,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.common.white, 0.9),
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.2)}`,
                    },
                    transition: "all 0.3s",
                  }}
                >
                  {safeData.isFree ? t("product-courses.details.enrollNow") : t("product-courses.details.buyCourse")}
                </Button>

                {/* Características rápidas */}
                <Stack spacing={1.5} sx={{ pt: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon="solar:clock-circle-bold" width={20} />
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      {safeData.duration} {t("product-courses.details.contentDuration")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon={"solar:diploma-bold" as any} width={20} />
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      {t("product-courses.details.certificateOnCompletion")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon={"solar:infinity-bold" as any} width={20} />
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      {t("product-courses.details.lifetimeAccess")}
                    </Typography>
                  </Stack>
                  {safeData.isStudentLimited && (
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Iconify icon="solar:users-group-rounded-bold" width={20} />
                      <Typography variant="body2" sx={{ opacity: 0.95 }}>
                        {t("product-courses.details.limitedSpots")}: {safeData.studentLimit}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Información del curso - Rediseñada */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                {t("product-courses.details.courseInfo")}
              </Typography>

              <Stack spacing={2.5}>
                {/* Categoría */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                  >
                    {t("product-courses.details.category")}
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
                      <Iconify icon="solar:add-folder-bold" width={18} sx={{ color: "primary.main" }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {safeData.categoryName}
                      </Typography>
                      {safeData.categoryAbreviation && (
                        <Typography variant="caption" color="text.secondary">
                          {safeData.categoryAbreviation}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                {/* Nivel de dificultad */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                  >
                    {t("product-courses.details.difficulty")}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette[getDifficultyColor(safeData.difficultyLevelName)].main, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Iconify
                        icon={getDifficultyIcon(safeData.difficultyLevelName)}
                        width={18}
                        sx={{ color: `${getDifficultyColor(safeData.difficultyLevelName)}.main` }}
                      />
                    </Box>
                    <Chip
                      label={safeData.difficultyLevelName}
                      size="small"
                      color={getDifficultyColor(safeData.difficultyLevelName)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                {safeData.courseLmsName && (
                  <>
                    <Divider />
                    {/* Curso LMS */}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 0.5, display: "block", fontWeight: 600 }}
                      >
                        {t("product-courses.details.lmsCourse", "Curso LMS")}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Iconify icon="solar:monitor-bold" width={18} sx={{ color: "info.main" }} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {safeData.courseLmsName}
                          </Typography>
                          {safeData.courseLmsCode && (
                            <Typography variant="caption" color="text.secondary">
                              {safeData.courseLmsCode}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
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
