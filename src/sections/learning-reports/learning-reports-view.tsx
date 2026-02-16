"use client";

import type { IDatePickerControl } from "src/types/common";

import { useState, useCallback } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import TableContainer from "@mui/material/TableContainer";
import LinearProgress from "@mui/material/LinearProgress";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CircularProgress from "@mui/material/CircularProgress";

import { fDate } from "src/utils/format-time";

import { useTranslate } from "src/locales/use-locales";
import { DashboardContent } from "src/layouts/dashboard";
import { GetReportService } from "src/services/learning/reports.service";

import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";

// ----------------------------------------------------------------------

interface ReportItem {
  collaborator: string;
  position: string;
  course: string;
  progress: string;
  startDate: string;
  completionDate: string | null;
}

interface ReportResponse {
  statusCode: number;
  data: ReportItem[];
  message: string;
}

// ----------------------------------------------------------------------

export function LearningReportsView() {
  const { t } = useTranslate("learning");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [startDate, setStartDate] = useState<IDatePickerControl>(null);
  const [endDate, setEndDate] = useState<IDatePickerControl>(null);
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetReportService(
        employeeId ? Number(employeeId) : null,
        startDate ? startDate.toDate() : null,
        endDate ? endDate.toDate() : null,
      );

      const data: ReportResponse = response.data;
      setReportData(data.data || []);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error(t("learning-reports.messages.error"));
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [t, employeeId, startDate, endDate]);

  const handleClearFilters = useCallback(() => {
    setEmployeeId("");
    setStartDate(null);
    setEndDate(null);
  }, []);

  const hasFilters = Boolean((employeeId && employeeId.toString().trim() !== "") || startDate || endDate);

  const handleExportToCSV = useCallback(() => {
    if (reportData.length === 0) return;

    // Encabezados
    const headers = [
      t("learning-reports.table.columns.colaborator") || "Colaborador",
      t("learning-reports.table.columns.position") || "Cargo",
      t("learning-reports.table.columns.course") || "Curso",
      t("learning-reports.table.columns.progress") || "Progreso (%)",
      t("learning-reports.table.columns.startDate") || "Fecha Inicio",
      t("learning-reports.table.columns.endDate") || "Fecha Finalización",
    ];

    // Convertir datos a formato CSV con separador punto y coma
    const csvContent = [
      headers.join(";"),
      ...reportData.map((row) =>
        [
          row.collaborator,
          row.position,
          row.course,
          row.progress,
          row.startDate ? fDate(row.startDate) : "",
          row.completionDate ? fDate(row.completionDate) : t("learning-reports.table.inProgress"),
        ].join(";"),
      ),
    ].join("\n");

    // Crear y descargar archivo
    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_learning_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [t, reportData]);

  const getProgressColor = (progress: string) => {
    const value = Number.parseFloat(progress);
    if (value === 100) return "success";
    if (value >= 70) return "info";
    if (value >= 40) return "warning";
    return "error";
  }

  const renderFilters = () => (
    <Card
      sx={{
        p: 3,
        mb: 3,
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
          }}
        >
          <Iconify icon="solar:settings-bold" width={24} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("learning-reports.filters.title")}
        </Typography>
      </Box>

      <Box
        sx={{
          gap: 2,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "flex-start" },
        }}
      >
        <TextField
          fullWidth
          label={t("learning-reports.filters.employeeId")}
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          type="number"
          placeholder={t("learning-reports.filters.employeeIdPlaceholder")}
          sx={{ maxWidth: { md: 250 } }}
          slotProps={{
            htmlInput: {
              min: 0,
              step: 1,
            },
            input: {
              startAdornment: (
                <Box sx={{ mr: 1, display: "flex", color: "text.secondary" }}>
                  <Iconify icon="solar:user-id-bold" width={20} />
                </Box>
              ),
            },
          }}
        />

        <DatePicker
          label={t("learning-reports.filters.startDate")}
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          sx={{ maxWidth: { md: 250 } }}
        />

        <DatePicker
          label={t("learning-reports.filters.endDate")}
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          sx={{ maxWidth: { md: 250 } }}
          slotProps={{
            textField: {
              helperText:
                startDate && endDate && endDate < startDate
                  ? t("learning-reports.filters.endDate") + ": " + t("learning-reports.filters.endDateError")
                  : null,
              error: !!(startDate && endDate && endDate < startDate),
            },
          }}
        />

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title={t("learning-reports.filters.generateTooltip")}>
            <LoadingButton
              variant="contained"
              onClick={handleGenerateReport}
              loading={loading}
              startIcon={<Iconify icon="solar:chart-square-outline" />}
              sx={{
                minWidth: 180,
                height: 56,
                bgcolor: "primary.main",
                boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
                "&:hover": {
                  boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.primary.main, 0.32)}`,
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              {t("learning-reports.filters.generate")}
            </LoadingButton>
          </Tooltip>

          {hasFilters && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleClearFilters}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              sx={{
                minWidth: 160,
                height: 56,
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  transform: "translateY(-2px)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              {t("learning-reports.filters.clear")}
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  )

  const renderTable = () => {
    if (loading) {
      return (
        <Card
          sx={{
            p: 8,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 3,
          }}
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {t("learning-reports.messages.loading") || "Generando reporte..."}
          </Typography>
        </Card>
      )
    }

    if (reportData.length === 0) {
      return (
        <Card sx={{ p: 8, textAlign: "center" }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
              color: "text.disabled",
              mx: "auto",
              mb: 3,
            }}
          >
            <Iconify icon="solar:file-text-bold" width={64} />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, color: "text.primary" }}>
            {t("learning-reports.messages.noData")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("learning-reports.messages.noDataDescription") || "Ajusta los filtros y genera un nuevo reporte"}
          </Typography>
        </Card>
      )
    }

    return (
      <Card>
        <Box
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            background: (theme) => alpha(theme.palette.grey[500], 0.04),
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t("learning-reports.table.results")}
            </Typography>
            <Chip
              label={`${reportData.length} ${reportData.length === 1 ? t("learning-reports.table.record") : t("learning-reports.table.records")}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={handleExportToCSV}
            sx={{
              boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.success.main, 0.24)}`,
              "&:hover": {
                boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.success.main, 0.32)}`,
              },
            }}
          >
            {t("learning-reports.table.download")}
          </Button>
        </Box>

        <Scrollbar>
          <TableContainer sx={{ overflow: "unset" }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:user-rounded-bold" width={18} />
                      {t("learning-reports.table.columns.colaborator")}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:case-minimalistic-bold" width={18} />
                      {t("learning-reports.table.columns.position")}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:bill-list-bold" width={18} />
                      {t("learning-reports.table.columns.course")}
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <Iconify icon="solar:chart-square-outline" width={18} />
                      {t("learning-reports.table.columns.progress")}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:calendar-date-bold" width={18} />
                      {t("learning-reports.table.columns.startDate")}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:verified-check-bold" width={18} />
                      {t("learning-reports.table.columns.endDate")}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row, index) => {
                  const progressValue = Number.parseFloat(row.progress)
                  const progressColor = getProgressColor(row.progress)

                  return (
                    <TableRow
                      key={index}
                      hover
                      sx={{
                        "&:hover": {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.collaborator}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.position} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.course}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5,
                            minWidth: 120,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                            <LinearProgress
                              variant="determinate"
                              value={progressValue}
                              color={progressColor}
                              sx={{
                                flexGrow: 1,
                                height: 8,
                                borderRadius: 1,
                                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                minWidth: 40,
                                color: `${progressColor}.main`,
                              }}
                            >
                              {row.progress}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {row.startDate ? fDate(row.startDate) : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.completionDate ? (
                          <Chip
                            label={fDate(row.completionDate)}
                            color="success"
                            size="small"
                            icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                            sx={{ fontWeight: 500 }}
                          />
                        ) : (
                          <Chip
                            label={t("learning-reports.table.inProgress")}
                            color="warning"
                            size="small"
                            icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>
    )
  }

  return (
    <DashboardContent>
      <Box sx={{ mb: { xs: 3, md: 5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <Iconify icon="solar:bill-list-bold" width={28} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t("learning-reports.title")}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 8 }}>
          {t("learning-reports.subtitle") ||
            "Genera reportes detallados del progreso de aprendizaje de tus colaboradores"}
        </Typography>
      </Box>

      {renderFilters()}
      {renderTable()}
    </DashboardContent>
  )
}
