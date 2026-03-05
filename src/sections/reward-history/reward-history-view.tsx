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
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";
import LoadingButton from "@mui/lab/LoadingButton";
import TableContainer from "@mui/material/TableContainer";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CircularProgress from "@mui/material/CircularProgress";

import { fDate } from "src/utils/format-time";

import { useTranslate } from "src/locales/use-locales";
import { DashboardContent } from "src/layouts/dashboard";
import { GetRewardHistoryService } from "src/services/rewards/rewardHistory.service";

import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";

// ----------------------------------------------------------------------

interface RewardHistoryItem {
  userEmail: string;
  rewardName: string;
  pointsRequired: number;
  stockTotal: number;
  imageUrl: string;
  redeemedAt: string;
}

interface RewardHistoryMeta {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface RewardHistoryResponse {
  data: RewardHistoryItem[];
  meta: RewardHistoryMeta;
}

// ----------------------------------------------------------------------

export function RewardHistoryView() {
  const { t } = useTranslate("rewards");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [startDate, setStartDate] = useState<IDatePickerControl>(null);
  const [endDate, setEndDate] = useState<IDatePickerControl>(null);
  const [reportData, setReportData] = useState<RewardHistoryItem[]>([]);
  const [meta, setMeta] = useState<RewardHistoryMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);
    setPage(1); // Reset to first page when generating new report
    try {
      const response = await GetRewardHistoryService(
        startDate ? startDate.toDate() : null,
        endDate ? endDate.toDate() : null,
        page,
      );

      const data: RewardHistoryResponse = response.data;
      setReportData(data.data || []);
      setMeta(data.meta);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error(t("rewards-history.messages.error"));
      setReportData([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [t, startDate, endDate, page]);

  const handleClearFilters = useCallback(() => {
    setEmployeeId("");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
    setReportData([]);
    setMeta(null);
  }, []);

  const handlePageChange = useCallback(
    async (event: React.ChangeEvent<unknown>, value: number) => {
      setPage(value);
      setLoading(true);
      try {
        const response = await GetRewardHistoryService(
          startDate ? startDate.toDate() : null,
          endDate ? endDate.toDate() : null,
          value,
        );

        const data: RewardHistoryResponse = response.data;
        setReportData(data.data || []);
        setMeta(data.meta);
      } catch (error) {
        console.error("Error fetching report:", error);
        toast.error(t("rewards-history.messages.error"));
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, t]
  );

  const hasFilters = Boolean((employeeId && employeeId.toString().trim() !== "") || startDate || endDate);

  const handleExportToCSV = useCallback(() => {
    if (reportData.length === 0) return;

    // Encabezados
    const headers = [
      t("rewards-history.table.columns.userEmail") || "Email Usuario",
      t("rewards-history.table.columns.rewardName") || "Recompensa",
      t("rewards-history.table.columns.pointsRequired") || "Puntos Requeridos",
      t("rewards-history.table.columns.redeemedAt") || "Fecha de Redención",
    ];

    // Convertir datos a formato CSV con separador punto y coma
    const csvContent = [
      headers.join(";"),
      ...reportData.map((row) =>
        [
          row.userEmail,
          row.rewardName,
          row.pointsRequired,
          row.redeemedAt ? fDate(row.redeemedAt) : "",
        ].join(";"),
      ),
    ].join("\n");

    // Crear y descargar archivo
    const blob = new Blob(["\ufeff", csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reward_history_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [t, reportData]);



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
          {t("rewards-history.filters.title")}
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
        <DatePicker
          label={t("rewards-history.filters.startDate")}
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          sx={{ maxWidth: { md: 250 } }}
        />

        <DatePicker
          label={t("rewards-history.filters.endDate")}
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          sx={{ maxWidth: { md: 250 } }}
          slotProps={{
            textField: {
              helperText:
                startDate && endDate && endDate < startDate
                  ? t("rewards-history.filters.endDate") + ": " + t("rewards-history.filters.endDateError")
                  : null,
              error: !!(startDate && endDate && endDate < startDate),
            },
          }}
        />

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Tooltip title={t("rewards-history.filters.generateTooltip")}>
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
              {t("rewards-history.filters.generate")}
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
              {t("rewards-history.filters.clear")}
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
            {t("rewards-history.messages.loading") || "Generando reporte..."}
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
            {t("rewards-history.messages.noData")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("rewards-history.messages.noDataDescription") || "Ajusta los filtros y genera un nuevo reporte"}
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
              {t("rewards-history.table.results")}
            </Typography>
            <Chip
              label={`${reportData.length} ${reportData.length === 1 ? t("rewards-history.table.record") : t("rewards-history.table.records")}`}
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
            {t("rewards-history.table.download")}
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
                      {t("rewards-history.table.columns.userEmail")}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:medal-star-bold" width={18} />
                      {t("rewards-history.table.columns.rewardName")}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:star-bold" width={18} />
                      {t("rewards-history.table.columns.pointsRequired")}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Iconify icon="solar:calendar-date-bold" width={18} />
                      {t("rewards-history.table.columns.redeemedAt")}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row, index) => (
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
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            color: "primary.main",
                          }}
                        >
                          <Iconify icon="solar:user-rounded-bold" width={18} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.userEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          component="img"
                          src={row.imageUrl}
                          alt={row.rewardName}
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            objectFit: "cover",
                            border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {row.rewardName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${row.pointsRequired} pts`}
                        size="small"
                        color="primary"
                        icon={<Iconify icon="solar:star-bold" width={14} />}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fDate(row.redeemedAt)}
                        color="success"
                        size="small"
                        icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        {meta && meta.pageCount > 1 && (
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              background: (theme) => alpha(theme.palette.grey[500], 0.04),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("rewards-history.pagination.page")} {meta.page} {t("rewards-history.pagination.of")} {meta.pageCount} ({meta.itemCount} {meta.itemCount === 1 ? t("rewards-history.table.record") : t("rewards-history.table.records")})
            </Typography>
            <Pagination
              count={meta.pageCount}
              page={meta.page}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              sx={{
                "& .MuiPaginationItem-root": {
                  fontWeight: 600,
                },
              }}
            />
          </Box>
        )}
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
            {t("rewards-history.title")}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 8 }}>
          {t("rewards-history.subtitle") ||
            "Genera reportes detallados del progreso de aprendizaje de tus colaboradores"}
        </Typography>
      </Box>

      {renderFilters()}
      {renderTable()}
    </DashboardContent>
  )
}
