"use client";

import type { ILearningObject } from "src/types/learning"

import { useState, useEffect, useCallback } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import Container from "@mui/material/Container";

import { paths } from "src/routes/paths";
import { useRouter, useParams } from "src/routes/hooks";

import { useTranslate } from "src/locales";
import { GetCoursesByIdService } from "src/services/learning/courses.service";

import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";
import { CustomBreadcrumbs } from "src/components/custom-breadcrumbs";

import { LearningObjectDetailsCard } from "../user-learning-objects-details-card";

// ----------------------------------------------------------------------

export function UserLearningObjectsDetailsView() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslate("learning");

  const [learningObject, setLearningObject] = useState<ILearningObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Simular progreso - en producción esto vendría del backend
  const [progress] = useState(100); // Cambia a 100 para ver el certificado, o cualquier número entre 0-100

  const { id } = params;

  const loadLearningObject = useCallback(async () => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);

      const response = await GetCoursesByIdService(id);

      if (response.data?.statusCode === 200 && response.data?.data) {
        setLearningObject(response.data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e) {
      console.error("Error loading learning object:", e);
      setError(true);
      toast.error(t("learning-objects.messages.error.loading"));
    } finally {
      setLoading(false);
    }
  }, [id, t])

  useEffect(() => {
    loadLearningObject();
  }, [loadLearningObject]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            py: { xs: 5, md: 10 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: 300, md: 500 },
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: (theme) => `4px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderTopColor: "primary.main",
                animation: "spin 1s linear infinite",
                mx: "auto",
                mb: 3,
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
            <Box sx={{ typography: "h6", color: "text.primary", mb: 1 }}>
              {t("learning-objects.messages.loading")}
            </Box>
          </Box>
        </Box>
      </Container>
    )
  }

  if (error || !learningObject) {
    return (
      <Container maxWidth="xl">
        <CustomBreadcrumbs
          heading={t("learning-objects.details.user-title")}
          links={[
            {
              name: t("learning-objects.user-title"),
              href: paths.dashboard.learning.learningObjects,
            },
            { name: t("learning-objects.details.user-title") },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Box
          sx={{
            py: { xs: 5, md: 10 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: 300, md: 400 },
            textAlign: "center",
          }}
        >
          <Box sx={{ maxWidth: 480 }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <Iconify icon="solar:file-corrupted-bold-duotone" width={64} sx={{ color: "error.main" }} />
            </Box>
            <Box sx={{ typography: "h5", mb: 1, fontWeight: 700 }}>
              {t("learning-objects.messages.error.notFound")}
            </Box>
            <Box sx={{ typography: "body1", color: "text.secondary", mb: 4 }}>
              {t(
                "learning-objects.messages.error.notFoundDescription"
              )}
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={handleBack}
              startIcon={<Iconify icon={"solar:arrow-left-outline" as any} />}
            >
              {t("learning-objects.actions.back")}
            </Button>
          </Box>
        </Box>
      </Container>
    )
  }

  return (
    <>
      <Container maxWidth="xl">
        <CustomBreadcrumbs
          heading={learningObject.name}
          links={[
            { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
            {
              name: t("learning-objects.user-title"),
              href: paths.dashboard.userLearning.myLearning,
            },
            { name: learningObject?.name || 'Detalle' },
          ]}
          action={
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<Iconify icon={"solar:arrow-left-outline" as any} />}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              {t("learning-objects.actions.back")}
            </Button>
          }
          sx={{ mb: { xs: 2, md: 3 } }}
        />
      </Container>

      <LearningObjectDetailsCard learningObject={learningObject} progress={progress} />
    </>
  )
}
