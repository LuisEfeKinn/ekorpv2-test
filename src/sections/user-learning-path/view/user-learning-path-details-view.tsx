"use client";

import type React from "react";
import type { ILearningPath } from "src/types/learning";

import { useState, useEffect, useCallback } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { alpha } from "@mui/material/styles";
import Accordion from "@mui/material/Accordion";
import Typography from "@mui/material/Typography";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";

import { paths } from "src/routes/paths";
import { useParams, useRouter } from "src/routes/hooks";

import { useTranslate } from "src/locales";
import { DashboardContent } from "src/layouts/dashboard";
import { GetLearningPathsByIdService } from "src/services/learning/learningPaths.service";

import { Label } from "src/components/label";
import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";
import { EmptyContent } from "src/components/empty-content";
import { LoadingScreen } from "src/components/loading-screen";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";

// ----------------------------------------------------------------------

export function UserLearningPathDetailsView() {
  const { t } = useTranslate("learning");
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [learningPath, setLearningPath] = useState<ILearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true);
      const response = await GetLearningPathsByIdService(id);

      if (response.data.statusCode === 200) {
        const data = response.data.data;
        setLearningPath(data);
      } else {
        toast.error(
          t("learning-paths.messages.error.loading"),
        )
        router.push(paths.dashboard.learning.learningPaths);
      }
    } catch (error) {
      console.error("Error loading learning path:", error);
      toast.error(
        t("learning-paths.messages.error.loading"),
      );
      router.push(paths.dashboard.learning.learningPaths);
    } finally {
      setLoading(false);
    }
  }, [id, t, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getInitials = (name: string) => {
    const words = name
      .trim()
      .split(" ")
      .filter((word) => word.length > 0);
    if (words.length === 0) return "??";
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  const getAvatarColor = (name: string): "primary" | "secondary" | "info" | "success" | "warning" | "error" => {
    const colors: Array<"primary" | "secondary" | "info" | "success" | "warning" | "error"> = [
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
    ];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  }

  const getModuleColor = (idx: number): "primary" | "secondary" | "info" | "success" | "warning" | "error" => {
    const colors: Array<"primary" | "secondary" | "info" | "success" | "warning" | "error"> = [
      "info",      // Azul suave
      "success",   // Verde suave
      "secondary", // Morado suave
      "warning",   // Naranja suave
      "primary",   // Azul primary
      "error",     // Rojo suave
    ];
    return colors[idx % colors.length];
  }

  // Normalizar URL (agregar https:// si falta)
  const normalizeUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  }

  // Convertir URL de video a formato embed
  const getEmbedUrl = (url: string | null | undefined): { embedUrl: string; platform: string } | null => {
    if (!url) return null;
    
    const normalizedUrl = normalizeUrl(url);
    
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const youtubeMatch = normalizedUrl.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        platform: 'youtube'
      };
    }

    // Vimeo
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const vimeoMatch = normalizedUrl.match(vimeoRegex);
    if (vimeoMatch) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        platform: 'vimeo'
      };
    }

    // Dailymotion
    const dailymotionRegex = /dailymotion\.com\/(?:video|hub)\/([a-zA-Z0-9]+)/;
    const dailymotionMatch = normalizedUrl.match(dailymotionRegex);
    if (dailymotionMatch) {
      return {
        embedUrl: `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`,
        platform: 'dailymotion'
      };
    }

    return null;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!learningPath) {
    return (
      <DashboardContent>
        <EmptyContent
          filled
          title={t("learning-paths.details.notFound")}
          description={t("learning-paths.details.notFoundDescription")}
          sx={{ py: 10 }}
        />
      </DashboardContent>
    )
  }

  const avatarColor = getAvatarColor(learningPath.name);
  const initials = getInitials(learningPath.name);
  const totalModules = learningPath.modules?.length || 0;
  const totalCourses =
    learningPath.modules?.reduce((acc, module) => acc + (module.learningObjects?.length || 0), 0) || 0;
  const totalDuration =
    learningPath.modules?.reduce((acc, module) => {
      const moduleDuration =
        module.learningObjects?.reduce((sum, obj) => {
          if (obj.learningObject?.duration) {
            const match = obj.learningObject.duration.match(/(\d+)/);
            return sum + (match ? Number.parseInt(match[1], 10) : 0);
          }
          return sum;
        }, 0) || 0;
      return acc + moduleDuration;
    }, 0) || 0;

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t("learning-paths.user-title")}
        links={[
          {
            name: t("learning-paths.breadcrumbs.dashboard"),
            href: paths.dashboard.root,
          },
          {
            name: t("learning-paths.breadcrumbs.user-learningPaths"),
            href: paths.dashboard.userLearning.myLearningPaths,
          },
          { name: learningPath.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                lineHeight: 1.2,
                color: "text.primary",
              }}
            >
              {learningPath.name}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                lineHeight: 1.8,
                fontSize: { xs: "0.95rem", sm: "1rem" },
              }}
            >
              {learningPath.description ||
                t("learning-paths.details.noDescription")}
            </Typography>

            {learningPath.position && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Iconify icon="solar:case-minimalistic-bold" width={24} sx={{ color: "info.main" }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ color: "info.dark", fontWeight: 700 }}>
                      {learningPath.position.name}
                      {learningPath.position.abbreviation && (
                        <Box component="span" sx={{ ml: 1, color: "text.secondary", fontWeight: 500 }}>
                          ({learningPath.position.abbreviation})
                        </Box>
                      )}
                    </Typography>
                    {learningPath.position.description && (
                      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        {learningPath.position.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              height: "100%",
              minHeight: { xs: 300, sm: 350, md: 400 },
              position: "relative",
              overflow: "hidden",
              borderRadius: { xs: 2, sm: 3 },
              boxShadow: {
                xs: "0 8px 24px rgba(145, 158, 171, 0.16)",
                sm: "0 20px 40px rgba(145, 158, 171, 0.24)",
              },
            }}
          >
            {/* Video o Banner */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: { xs: 300, sm: 350, md: 400 },
              }}
            >
              {(() => {
                const videoData = getEmbedUrl(learningPath.videoUrl);
                const bannerUrl = normalizeUrl(learningPath.bannerUrl);
                
                // Si hay video Y banner, mostrar cover con play button
                if (videoData && bannerUrl && !isVideoPlaying) {
                  return (
                    <>
                      {/* Banner como cover */}
                      <Box
                        component="img"
                        src={bannerUrl}
                        alt={learningPath.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      
                      {/* Overlay oscuro */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)",
                          pointerEvents: "none",
                        }}
                      />
                      
                      {/* Botón de Play */}
                      <Box
                        onClick={() => setIsVideoPlaying(true)}
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          zIndex: 3,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translate(-50%, -50%) scale(1.08)",
                            "& .play-icon": {
                              bgcolor: (theme) => theme.palette.primary.main,
                              boxShadow: (theme) => `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
                              "& .MuiSvgIcon-root": {
                                color: "white",
                              },
                            },
                            "& .play-text": {
                              transform: "translateY(2px)",
                            },
                          },
                        }}
                      >
                        <Box
                          className="play-icon"
                          sx={{
                            width: { xs: 70, sm: 80, md: 90 },
                            height: { xs: 70, sm: 80, md: 90 },
                            borderRadius: "50%",
                            bgcolor: "rgba(255, 255, 255, 0.95)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                            backdropFilter: "blur(10px)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            "& svg": {
                              width: { xs: "40px", sm: "48px", md: "54px" },
                              height: { xs: "40px", sm: "48px", md: "54px" },
                            },
                          }}
                        >
                          <Iconify 
                            icon="solar:play-circle-bold" 
                            sx={{ 
                              color: "grey.800",
                              transition: "color 0.3s ease",
                            }} 
                          />
                        </Box>
                        
                        {/* Texto debajo del botón */}
                        <Typography
                          className="play-text"
                          variant="subtitle1"
                          sx={{
                            color: "white",
                            textAlign: "center",
                            mt: { xs: 1.5, sm: 2 },
                            fontWeight: 700,
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                            transition: "transform 0.3s ease",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t("learning-paths.details.playVideo")}
                        </Typography>
                      </Box>
                    </>
                  );
                }
                
                // Si está reproduciendo o solo hay video, mostrar iframe
                if (videoData && (isVideoPlaying || !bannerUrl)) {
                  return (
                    <Box
                      component="iframe"
                      src={videoData.embedUrl}
                      title={learningPath.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      sx={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        display: "block",
                      }}
                    />
                  );
                }
                
                // Solo banner (sin video)
                if (bannerUrl) {
                  return (
                    <>
                      <Box
                        component="img"
                        src={bannerUrl}
                        alt={learningPath.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      {/* Overlay oscuro para mejor legibilidad */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)",
                        }}
                      />
                    </>
                  );
                }
                
                // Fallback: Gradiente con avatar
                return (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(theme.palette[avatarColor].main, 0.9)} 0%, ${alpha(theme.palette[avatarColor].dark, 0.7)} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      '&::before': {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        backgroundImage:
                          "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        color: "white",
                        fontSize: "3rem",
                        fontWeight: "bold",
                        border: "4px solid rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(10px)",
                        zIndex: 1,
                      }}
                    >
                      {initials}
                    </Avatar>
                  </Box>
                );
              })()}

              {/* Badge de estado superpuesto */}
              <Box
                sx={{
                  position: "absolute",
                  top: { xs: 12, sm: 16 },
                  right: { xs: 12, sm: 16 },
                  zIndex: 2,
                }}
              >
                <Label
                  color={learningPath.isActive ? "success" : "default"}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.5, sm: 0.75 },
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    fontWeight: 700,
                    backdropFilter: "blur(8px)",
                    bgcolor: learningPath.isActive 
                      ? (theme) => alpha(theme.palette.success.main, 0.9)
                      : "rgba(145, 158, 171, 0.9)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  {learningPath.isActive
                    ? t("learning-paths.status.active")
                    : t("learning-paths.status.inactive")}
                </Label>
              </Box>

              {/* Avatar con iniciales e info en la parte inferior (solo si hay video o banner y NO está reproduciéndose) */}
              {(getEmbedUrl(learningPath.videoUrl) || normalizeUrl(learningPath.bannerUrl)) && !isVideoPlaying && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 2,
                    background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)",
                    backdropFilter: "blur(10px)",
                    p: { xs: 2, sm: 2.5 },
                  }}
                >
                  <Stack 
                    direction={{ xs: "column", sm: "row" }} 
                    alignItems={{ xs: "flex-start", sm: "center" }} 
                    spacing={{ xs: 1.5, sm: 2 }}
                  >
                    <Avatar
                      sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        bgcolor: (theme) => alpha(theme.palette[avatarColor].main, 0.95),
                        color: `${avatarColor}.contrastText`,
                        fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        fontWeight: "bold",
                        border: "3px solid rgba(255, 255, 255, 0.2)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </Avatar>
                    
                    <Stack spacing={0.5} flex={1} sx={{ minWidth: 0 }}>
                      <Stack 
                        direction={{ xs: "column", sm: "row" }} 
                        spacing={{ xs: 0.5, sm: 2 }} 
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        flexWrap="wrap"
                      >
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              "& svg": {
                                width: { xs: "14px", sm: "16px" },
                                height: { xs: "14px", sm: "16px" },
                              },
                            }}
                          >
                            <Iconify 
                              icon="solar:list-bold" 
                              sx={{ color: "rgba(255, 255, 255, 0.8)", flexShrink: 0 }} 
                            />
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "white", 
                              fontWeight: 600,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              whiteSpace: "nowrap",
                            }}
                          >
                            {totalModules} {t("learning-paths.details.modulesLabel")}
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              "& svg": {
                                width: { xs: "14px", sm: "16px" },
                                height: { xs: "14px", sm: "16px" },
                              },
                            }}
                          >
                            <Iconify 
                              icon="solar:clock-circle-bold" 
                              sx={{ color: "rgba(255, 255, 255, 0.8)", flexShrink: 0 }} 
                            />
                          </Box>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "white", 
                              fontWeight: 600,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              whiteSpace: "nowrap",
                            }}
                          >
                            {totalDuration} {t("learning-paths.details.hoursLabel")}
                          </Typography>
                        </Stack>
                      </Stack>
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: { xs: "0.65rem", sm: "0.75rem" },
                        }}
                      >
                        {totalCourses} {t("learning-paths.details.elementsTotal")}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
              {t("learning-paths.details.programContent")}
            </Typography>

            {learningPath.modules && learningPath.modules.length > 0 ? (
              <Stack spacing={0}>
                {learningPath.modules
                  .sort((a, b) => a.order - b.order)
                  .map((module, index) => {
                    const moduleColor = getModuleColor(index)
                    const coursesCount = module.learningObjects?.length || 0
                    const moduleName =
                      module.skill?.name ||
                      `${t("learning-paths.details.moduleNumber", { number: index + 1 })}`
                    const isLastModule = index === learningPath.modules!.length - 1

                    return (
                      <Box key={module.id} sx={{ position: "relative" }}>
                        <Accordion
                          defaultExpanded
                          disableGutters
                          elevation={0}
                          sx={{
                            border: (theme) => `1.5px solid ${alpha(theme.palette[moduleColor].main, 0.12)}`,
                            borderRadius: "16px !important",
                            "&:before": { display: "none" },
                            bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.02),
                            boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.grey[500], 0.06)}`,
                            transition: "all 0.3s ease",
                            overflow: "hidden",
                            "&.Mui-expanded": {
                              boxShadow: (theme) => `0 4px 16px ${alpha(theme.palette[moduleColor].main, 0.12)}`,
                              border: (theme) => `1.5px solid ${alpha(theme.palette[moduleColor].main, 0.24)}`,
                              bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.04),
                            },
                          }}
                        >
                        <AccordionSummary
                          expandIcon={
                            <Iconify 
                              icon="eva:arrow-ios-downward-fill" 
                              sx={{ 
                                color: `${moduleColor}.main`,
                                transition: "transform 0.3s ease",
                              }} 
                            />
                          }
                          sx={{
                            px: { xs: 2, sm: 3 },
                            py: { xs: 1.5, sm: 2 },
                            minHeight: { xs: 72, sm: 80 },
                            bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.04),
                            borderBottom: (theme) => `1px solid ${alpha(theme.palette[moduleColor].main, 0.08)}`,
                            "&:hover": {
                              bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.08),
                            },
                            "& .MuiAccordionSummary-content": {
                              my: 0,
                            },
                            "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
                              transform: "rotate(180deg)",
                            },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }} sx={{ width: "100%", pr: 1, pl: { xs: 1, sm: 1.5 } }}>
                            <Box
                              sx={{
                                width: { xs: 44, sm: 52 },
                                height: { xs: 44, sm: 52 },
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "transparent",
                                color: `${moduleColor}.main`,
                                border: (theme) => `3px solid ${theme.palette[moduleColor].main}`,
                                fontWeight: 900,
                                fontSize: { xs: "1.1rem", sm: "1.4rem" },
                                flexShrink: 0,
                                boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette[moduleColor].main, 0.2)}`,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.08),
                                  transform: "scale(1.05)",
                                },
                              }}
                            >
                              {index + 1}
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 700,
                                    fontSize: { xs: "1rem", sm: "1.15rem" },
                                    color: "text.primary",
                                  }}
                                >
                                  {moduleName}
                                </Typography>
                                {module.skillLevel && (
                                  <Label
                                    sx={{
                                      bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.12),
                                      color: `${moduleColor}.main`,
                                      fontWeight: 600,
                                      fontSize: "0.65rem",
                                      textTransform: "uppercase",
                                      px: 1,
                                      py: 0.25,
                                      borderRadius: 0.75,
                                      height: 20,
                                    }}
                                  >
                                    {module.skillLevel.name}
                                  </Label>
                                )}
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Iconify 
                                  icon="solar:play-circle-bold" 
                                  width={18} 
                                  sx={{ color: `${moduleColor}.main`, opacity: 0.6 }} 
                                />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: "text.secondary",
                                    fontWeight: 500,
                                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                  }}
                                >
                                  {coursesCount}{" "}
                                  {t("learning-paths.details.articlesLabel")}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </AccordionSummary>

                        <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
                          <Stack spacing={2}>
                            {module.learningObjects && module.learningObjects.length > 0 ? (
                              module.learningObjects.map((learningObj, courseIndex) => {
                                const course = learningObj.learningObject
                                if (!course) return null

                                const courseImage = course.bannerUrl || course.imageUrl || course.productImage
                                const hasValidImage = courseImage && courseImage !== "string" && courseImage !== null

                                return (
                                  <Box key={learningObj.id}>
                                    <Card
                                      sx={{
                                        display: "flex",
                                        flexDirection: { xs: "column", sm: "row" },
                                        overflow: "hidden",
                                        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                                        borderRadius: { xs: "12px", sm: "0 16px 16px 0" },
                                        transition: "all 0.2s",
                                        "&:hover": {
                                          boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.grey[500], 0.16)}`,
                                          transform: "translateY(-2px)",
                                        },
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: { xs: "100%", sm: 120 },
                                          height: { xs: 140, sm: 100 },
                                          flexShrink: 0,
                                          position: "relative",
                                          overflow: "hidden",
                                          borderRadius: { xs: "12px 12px 0 0", sm: "0 16px 16px 0" },
                                          ...(hasValidImage && {
                                            backgroundImage: `url(${courseImage})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                          }),
                                          ...(!hasValidImage && {
                                            background: (theme) =>
                                              `linear-gradient(135deg, ${alpha(theme.palette[moduleColor].main, 0.8)} 0%, ${alpha(theme.palette[moduleColor].dark, 0.6)} 100%)`,
                                          }),
                                        }}
                                      >
                                        {!hasValidImage && (
                                          <Box
                                            sx={{
                                              position: "absolute",
                                              top: "50%",
                                              left: "50%",
                                              transform: "translate(-50%, -50%)",
                                            }}
                                          >
                                            <Iconify
                                              icon="solar:play-circle-bold"
                                              width={40}
                                              sx={{ color: "white", opacity: 0.8 }}
                                            />
                                          </Box>
                                        )}
                                      </Box>

                                      <Stack
                                        sx={{ flex: 1, minWidth: 0 }}
                                      >
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          justifyContent="space-between"
                                          sx={{ p: 2, pb: 1 }}
                                        >
                                          <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                                            <Typography
                                              variant="subtitle1"
                                              sx={{
                                                fontWeight: 600,
                                                mb: 0.5,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                              }}
                                            >
                                              {course.name}
                                            </Typography>
                                            {course.duration && (
                                              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                {course.duration}
                                              </Typography>
                                            )}
                                          </Box>

                                          <Button
                                            size="small"
                                            color={moduleColor}
                                            endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                                            sx={{ flexShrink: 0 }}
                                            onClick={() => router.push(paths.dashboard.userLearning.myLearningDetails(course.id))}
                                          >
                                            {t("learning-paths.details.viewDetails")}
                                          </Button>
                                        </Stack>
                                      </Stack>
                                    </Card>
                                  </Box>
                                )
                              })
                            ) : (
                              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                                {t("learning-paths.details.noCoursesInModule")}
                              </Typography>
                            )}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                      
                      {/* Flecha conectora entre módulos */}
                      {!isLastModule && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            py: 2,
                            position: "relative",
                          }}
                        >
                          <Box
                            sx={{
                              width: 2,
                              height: 24,
                              bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.2),
                              position: "relative",
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.08),
                              border: (theme) => `2px solid ${alpha(theme.palette[moduleColor].main, 0.16)}`,
                            }}
                          >
                            <Iconify
                              icon="eva:arrow-downward-fill"
                              width={20}
                              sx={{ color: `${moduleColor}.main`, opacity: 0.7 }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                    )
                  })}
              </Stack>
            ) : (
              <EmptyContent
                filled
                title={t("learning-paths.details.noModules")}
                description={t("learning-paths.details.noModulesDescription")}
                sx={{ py: 10 }}
              />
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            sx={{
              position: { lg: "sticky" },
              top: { lg: 24 },
            }}
          >
            <Card
              sx={{
                p: 3,
                border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                boxShadow: "0 8px 24px rgba(145, 158, 171, 0.12)",
              }}
            >
              <Stack spacing={3}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {t("learning-paths.details.programSummary")}
                </Typography>

                <Divider />

                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Iconify icon="solar:list-bold" width={24} sx={{ color: "primary.main" }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {totalCourses}{" "}
                        {t("learning-paths.details.elementsTotal")}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Iconify icon="solar:clock-circle-bold" width={24} sx={{ color: "warning.main" }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {totalDuration}{" "}
                        {t("learning-paths.details.hoursVideoDemand")}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: "1rem",
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
                    "&:hover": {
                      boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.primary.main, 0.32)}`,
                    },
                  }}
                >
                  {t("learning-paths.details.enrollNow")}
                </Button>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                    {t("learning-paths.details.thisIncludes")}
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Iconify icon="eva:checkmark-circle-2-fill" width={20} sx={{ color: "success.main" }} />
                      <Typography variant="body2">
                        {t("learning-paths.details.benefit1")}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Iconify icon="eva:checkmark-circle-2-fill" width={20} sx={{ color: "success.main" }} />
                      <Typography variant="body2">
                        {t("learning-paths.details.benefit2")}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Iconify icon="eva:checkmark-circle-2-fill" width={20} sx={{ color: "success.main" }} />
                      <Typography variant="body2">
                        {t("learning-paths.details.benefit3")}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Iconify icon="eva:checkmark-circle-2-fill" width={20} sx={{ color: "success.main" }} />
                      <Typography variant="body2">
                        {t("learning-paths.details.benefit4")}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </DashboardContent>
  )
}