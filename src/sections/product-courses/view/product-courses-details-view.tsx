"use client";

import type { IProductCourse } from "src/types/learning"

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

import { ProductCoursesDetailsCard } from "../product-courses-details-card";

// ----------------------------------------------------------------------

export function ProductCoursesDetailsView() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslate("learning");

  const [productCourse, setProductCourse] = useState<IProductCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { id } = params;

  const loadProductCourse = useCallback(async () => {
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
        setProductCourse(response.data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e) {
      console.error("Error loading product course:", e);
      setError(true);
      toast.error(t("product-courses.messages.error.loading"));
    } finally {
      setLoading(false);
    }
  }, [id, t])

  useEffect(() => {
    loadProductCourse();
  }, [loadProductCourse]);

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
              {t("product-courses.messages.loading")}
            </Box>
          </Box>
        </Box>
      </Container>
    )
  }

  if (error || !productCourse) {
    return (
      <Container maxWidth="xl">
        <CustomBreadcrumbs
          heading={t("product-courses.details.title", "Detalles del Curso")}
          links={[
            {
              name: t("product-courses.title", "Catálogo de Cursos"),
              href: paths.dashboard.learning.productCourses,
            },
            { name: t("product-courses.details.title", "Detalles") },
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
              {t("product-courses.messages.error.notFound")}
            </Box>
            <Box sx={{ typography: "body1", color: "text.secondary", mb: 4 }}>
              {t(
                "product-courses.messages.error.notFoundDescription"
              )}
            </Box>
            <Button
              variant="contained"
              size="large"
              onClick={handleBack}
              startIcon={<Iconify icon={"solar:arrow-left-outline" as any} />}
            >
              {t("product-courses.actions.back")}
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
          heading={productCourse.name}
          links={[
            {
              name: t("product-courses.title", "Catálogo de Cursos"),
              href: paths.dashboard.learning.productCourses,
            },
            { name: t("product-courses.details.title", "Detalles") },
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
              {t("product-courses.actions.back")}
            </Button>
          }
          sx={{ mb: { xs: 2, md: 3 } }}
        />
      </Container>

      <ProductCoursesDetailsCard productCourse={productCourse} />
    </>
  )
}
