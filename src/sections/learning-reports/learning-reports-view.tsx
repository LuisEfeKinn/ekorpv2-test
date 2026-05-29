"use client";

import type { ILearningPath } from "src/types/learning";
import type { IUserManagement } from "src/types/employees";
import type { ReportFormat, IReportParams } from "src/services/learning/reports.service";

import { useState, useEffect, useCallback } from "react";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import { alpha } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Accordion from "@mui/material/Accordion";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import Pagination from "@mui/material/Pagination";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import FormControl from "@mui/material/FormControl";
import Autocomplete from "@mui/material/Autocomplete";
import TableContainer from "@mui/material/TableContainer";
import LinearProgress from "@mui/material/LinearProgress";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";

import { fDate } from "src/utils/format-time";

import { useTranslate } from "src/locales/use-locales";
import { DashboardContent } from "src/layouts/dashboard";
import { GetLearningPathsPaginationService } from "src/services/learning/learningPaths.service";
import { GetUserManagmentPaginationService } from "src/services/employees/user-managment.service";
import {
  GetCoursesReportService,
  GetProgramsReportService,
  GetLearningPathsReportService,
} from "src/services/learning/reports.service";

import { toast } from "src/components/snackbar";
import { Iconify } from "src/components/iconify";
import { Scrollbar } from "src/components/scrollbar";

// ----------------------------------------------------------------------

interface ReportCourse {
  courseName: string;
  progress: number;
  isCompleted: boolean;
}

interface ReportProgram {
  programId: number;
  programName: string;
  totalCourses: number;
  completedCourses: number;
  completionPercentage: number;
  courses?: ReportCourse[];
}

interface ReportEmployee {
  employeeId: number;
  employeeName: string;
  email?: string;
  cargo: string;
  organizationalUnit: string;
  status: string;
  progress: number;
  completedAt: string | null;
  programs?: ReportProgram[];
}

interface ReportRoute {
  routeId: number;
  routeName: string;
  employees: ReportEmployee[];
}

interface ReportMeta {
  page: number;
  perPage: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

type ReportType = "learningPaths" | "programs" | "courses";

// ----------------------------------------------------------------------

const ORDER_OPTIONS = [
  { value: "learningPath.name:asc", labelKey: "learning-reports.filters.orderOptions.learningPathNameAsc" },
  { value: "learningPath.name:desc", labelKey: "learning-reports.filters.orderOptions.learningPathNameDesc" },
  { value: "employee.firstName:asc", labelKey: "learning-reports.filters.orderOptions.employeeFirstNameAsc" },
  { value: "employee.firstName:desc", labelKey: "learning-reports.filters.orderOptions.employeeFirstNameDesc" },
  { value: "employee.lastName:asc", labelKey: "learning-reports.filters.orderOptions.employeeLastNameAsc" },
  { value: "employee.lastName:desc", labelKey: "learning-reports.filters.orderOptions.employeeLastNameDesc" },
  { value: "job.name:asc", labelKey: "learning-reports.filters.orderOptions.jobNameAsc" },
  { value: "job.name:desc", labelKey: "learning-reports.filters.orderOptions.jobNameDesc" },
  { value: "organizationalUnit.name:asc", labelKey: "learning-reports.filters.orderOptions.orgUnitNameAsc" },
  { value: "organizationalUnit.name:desc", labelKey: "learning-reports.filters.orderOptions.orgUnitNameDesc" },
  { value: "elp.status:asc", labelKey: "learning-reports.filters.orderOptions.statusAsc" },
  { value: "elp.status:desc", labelKey: "learning-reports.filters.orderOptions.statusDesc" },
  { value: "elp.completionPercentage:asc", labelKey: "learning-reports.filters.orderOptions.progressAsc" },
  { value: "elp.completionPercentage:desc", labelKey: "learning-reports.filters.orderOptions.progressDesc" },
  { value: "elp.createdAt:asc", labelKey: "learning-reports.filters.orderOptions.createdAtAsc" },
  { value: "elp.createdAt:desc", labelKey: "learning-reports.filters.orderOptions.createdAtDesc" },
];

const FORMAT_OPTIONS: { value: ReportFormat; labelKey: string }[] = [
  { value: "json", labelKey: "learning-reports.filters.formatOptions.json" },
  { value: "excel", labelKey: "learning-reports.filters.formatOptions.excel" },
  { value: "pdf", labelKey: "learning-reports.filters.formatOptions.pdf" },
  { value: "csv", labelKey: "learning-reports.filters.formatOptions.csv" },
];

// ----------------------------------------------------------------------

export function LearningReportsView() {
  const { t } = useTranslate("learning");

  // Tab / report type
  const [reportType, setReportType] = useState<ReportType>("learningPaths");

  // Filters
  const [order, setOrder] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IUserManagement | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<ILearningPath | null>(null);
  const [format, setFormat] = useState<ReportFormat>("json");

  // Employee autocomplete
  const [employeeInputValue, setEmployeeInputValue] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<IUserManagement[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Route autocomplete
  const [routeInputValue, setRouteInputValue] = useState("");
  const [routeOptions, setRouteOptions] = useState<ILearningPath[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // Report data
  const [reportData, setReportData] = useState<ReportRoute[]>([]);
  const [reportMeta, setReportMeta] = useState<ReportMeta | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Autocomplete debounce effects ──────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(async () => {
      setEmployeeLoading(true);
      try {
        const res = await GetUserManagmentPaginationService({ page: 1, perPage: 20, search: employeeInputValue });
        setEmployeeOptions(res.data?.data || []);
      } catch {
        setEmployeeOptions([]);
      } finally {
        setEmployeeLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [employeeInputValue]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setRouteLoading(true);
      try {
        const res = await GetLearningPathsPaginationService({ page: 1, perPage: 20, search: routeInputValue });
        setRouteOptions(res.data?.data || []);
      } catch {
        setRouteOptions([]);
      } finally {
        setRouteLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [routeInputValue]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const buildParams = useCallback(
    (overridePage?: number): IReportParams => {
      const params: IReportParams = {
        page: overridePage ?? page,
        perPage,
        format: format || "json",
      };
      if (order) params.order = order as IReportParams["order"];
      if (search.trim()) params.search = search.trim();
      if (includeInactive) params.includeInactive = true;
      if (selectedEmployee) params.employeeId = selectedEmployee.id;
      if (selectedRoute) params.routeId = selectedRoute.id;
      return params;
    },
    [page, perPage, format, order, search, includeInactive, selectedEmployee, selectedRoute]
  );

  const downloadBlob = useCallback(
    (data: any, fmt: ReportFormat) => {
      const ext = fmt === "excel" ? "xlsx" : fmt;
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_${reportType}_${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [reportType]
  );

  const fetchReport = useCallback(
    async (params: IReportParams) => {
      const serviceFn =
        reportType === "learningPaths"
          ? GetLearningPathsReportService
          : reportType === "programs"
            ? GetProgramsReportService
            : GetCoursesReportService;

      const response = await serviceFn(params);

      if (params.format && params.format !== "json") {
        downloadBlob(response.data, params.format);
        toast.success(t("learning-reports.messages.downloadSuccess"));
      } else {
        setReportData(response.data?.data || []);
        setReportMeta(response.data?.meta || null);
      }
    },
    [reportType, t, downloadBlob]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setReportData([]);
    setReportMeta(null);
    try {
      await fetchReport(buildParams(1));
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error(t("learning-reports.messages.error"));
    } finally {
      setLoading(false);
    }
  }, [buildParams, fetchReport, t]);

  const handlePageNav = useCallback(
    async (newPage: number) => {
      setPage(newPage);
      setLoading(true);
      try {
        await fetchReport(buildParams(newPage));
      } catch (error) {
        console.error("Error fetching page:", error);
        toast.error(t("learning-reports.messages.error"));
      } finally {
        setLoading(false);
      }
    },
    [buildParams, fetchReport, t]
  );

  const handleTabChange = (_: React.SyntheticEvent, newValue: ReportType) => {
    setReportType(newValue);
    setReportData([]);
    setReportMeta(null);
    setPage(1);
  };

  const handleClearFilters = useCallback(() => {
    setOrder("");
    setSearch("");
    setIncludeInactive(false);
    setSelectedEmployee(null);
    setSelectedRoute(null);
    setEmployeeInputValue("");
    setRouteInputValue("");
    setFormat("json");
    setPage(1);
    setPerPage(10);
    setReportData([]);
    setReportMeta(null);
  }, []);

  const getProgressColor = (progress: number): "success" | "info" | "warning" | "error" => {
    if (progress === 100) return "success";
    if (progress >= 70) return "info";
    if (progress >= 40) return "warning";
    return "error";
  };

  const getStatusColor = (status: string): "default" | "success" | "warning" | "info" => {
    const lower = (status || "").toLowerCase();
    if (lower.includes("complet") || lower.includes("finaliz")) return "success";
    if (lower.includes("progres") || lower.includes("curso")) return "warning";
    return "default";
  };

  // ─── Shared sub-renders ──────────────────────────────────────────────────────

  const renderProgressBar = (progress: number) => {
    const color = getProgressColor(progress);
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 110 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          color={color}
          sx={{ flexGrow: 1, height: 7, borderRadius: 1, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12) }}
        />
        <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 36, color: `${color}.main` }}>
          {progress}%
        </Typography>
      </Box>
    );
  };

  const renderRouteHeader = (route: ReportRoute) => (
    <Box
      sx={{
        px: 3,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
      }}
    >
      <Iconify icon="solar:map-point-bold" width={20} sx={{ color: "primary.main", flexShrink: 0 }} />
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.dark", flex: 1 }}>
        {route.routeName}
      </Typography>
      <Chip
        label={`${route.employees.length} ${t("learning-reports.table.employees")}`}
        size="small"
        variant="outlined"
      />
    </Box>
  );

  // ─── Report: Learning Paths ──────────────────────────────────────────────────

  const renderLearningPathsData = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {reportData.map((route) => (
        <Card key={route.routeId} elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}` }}>
          {renderRouteHeader(route)}
          <Scrollbar>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                    <TableCell sx={{ fontWeight: 700 }}>{t("learning-reports.table.columns.employee")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("learning-reports.table.columns.cargo")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {t("learning-reports.table.columns.organizationalUnit")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("learning-reports.table.columns.status")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("learning-reports.table.columns.progress")}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t("learning-reports.table.columns.completedAt")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {route.employees.map((emp) => (
                    <TableRow
                      key={emp.employeeId}
                      hover
                      sx={{ "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {emp.employeeName}
                        </Typography>
                        {emp.email && (
                          <Typography variant="caption" color="text.disabled">
                            {emp.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={emp.cargo} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {emp.organizationalUnit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={emp.status} size="small" color={getStatusColor(emp.status)} />
                      </TableCell>
                      <TableCell>{renderProgressBar(emp.progress)}</TableCell>
                      <TableCell>
                        {emp.completedAt ? (
                          <Chip
                            label={fDate(emp.completedAt)}
                            color="success"
                            size="small"
                            icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                          />
                        ) : (
                          <Chip
                            label={t("learning-reports.table.inProgress")}
                            color="warning"
                            size="small"
                            icon={<Iconify icon="solar:clock-circle-bold" width={16} />}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
        </Card>
      ))}
    </Box>
  );

  // ─── Report: Programs ────────────────────────────────────────────────────────

  const renderProgramsData = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {reportData.map((route) => (
        <Card key={route.routeId} elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}` }}>
          {renderRouteHeader(route)}
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {route.employees.map((emp) => (
              <Accordion
                key={emp.employeeId}
                elevation={0}
                defaultExpanded={route.employees.length === 1}
                sx={{
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  "&:before": { display: "none" },
                  borderRadius: "8px !important",
                  overflow: "hidden",
                }}
              >
                <AccordionSummary expandIcon={<Iconify icon="solar:alt-arrow-down-bold" width={20} />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", pr: 2, flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 160, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {emp.employeeName}
                      </Typography>
                      {emp.email && (
                        <Typography variant="caption" color="text.disabled">
                          {emp.email}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={emp.cargo} size="small" variant="outlined" />
                    <Chip label={emp.status} size="small" color={getStatusColor(emp.status)} />
                    <Box sx={{ minWidth: 110 }}>{renderProgressBar(emp.progress)}</Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Scrollbar>
                    <TableContainer>
                      <Table size="small" sx={{ minWidth: 500 }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {t("learning-reports.table.columns.programName")}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {t("learning-reports.table.columns.totalCourses")}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {t("learning-reports.table.columns.completedCourses")}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {t("learning-reports.table.columns.completionPercentage")}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(emp.programs || []).map((prog) => (
                            <TableRow
                              key={prog.programId}
                              hover
                              sx={{ "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) } }}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {prog.programName}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">{prog.totalCourses}</TableCell>
                              <TableCell align="center">{prog.completedCourses}</TableCell>
                              <TableCell>{renderProgressBar(prog.completionPercentage)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Scrollbar>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Card>
      ))}
    </Box>
  );

  // ─── Report: Courses ─────────────────────────────────────────────────────────

  const renderCoursesData = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {reportData.map((route) => (
        <Card key={route.routeId} elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}` }}>
          {renderRouteHeader(route)}
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {route.employees.map((emp) => (
              <Accordion
                key={emp.employeeId}
                elevation={0}
                defaultExpanded={route.employees.length === 1}
                sx={{
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  "&:before": { display: "none" },
                  borderRadius: "8px !important",
                  overflow: "hidden",
                }}
              >
                <AccordionSummary expandIcon={<Iconify icon="solar:alt-arrow-down-bold" width={20} />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", pr: 2, flexWrap: "wrap" }}>
                    <Box sx={{ minWidth: 160, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {emp.employeeName}
                      </Typography>
                      {emp.email && (
                        <Typography variant="caption" color="text.disabled">
                          {emp.email}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={emp.cargo} size="small" variant="outlined" />
                    <Chip label={emp.status} size="small" color={getStatusColor(emp.status)} />
                    <Box sx={{ minWidth: 110 }}>{renderProgressBar(emp.progress)}</Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                  {(emp.programs || []).map((prog) => (
                    <Accordion
                      key={prog.programId}
                      elevation={0}
                      sx={{
                        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.02),
                        "&:before": { display: "none" },
                        borderRadius: "6px !important",
                        overflow: "hidden",
                      }}
                    >
                      <AccordionSummary expandIcon={<Iconify icon="solar:alt-arrow-down-bold" width={18} />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", pr: 2, flexWrap: "wrap" }}>
                          <Iconify icon="solar:book-bold" width={18} sx={{ color: "info.main", flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 120 }}>
                            {prog.programName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prog.completedCourses}/{prog.totalCourses}
                          </Typography>
                          <Box sx={{ minWidth: 100 }}>{renderProgressBar(prog.completionPercentage)}</Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        <Scrollbar>
                          <TableContainer>
                            <Table size="small" sx={{ minWidth: 380 }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}>
                                  <TableCell sx={{ fontWeight: 700 }}>
                                    {t("learning-reports.table.columns.courseName")}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>
                                    {t("learning-reports.table.columns.progress")}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>
                                    {t("learning-reports.table.columns.isCompleted")}
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(prog.courses || []).map((course, idx) => (
                                  <TableRow
                                    key={idx}
                                    hover
                                    sx={{ "&:hover": { bgcolor: (theme) => alpha(theme.palette.info.main, 0.04) } }}
                                  >
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {course.courseName}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>{renderProgressBar(course.progress)}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={
                                          course.isCompleted
                                            ? t("learning-reports.table.completed")
                                            : t("learning-reports.table.inProgress")
                                        }
                                        color={course.isCompleted ? "success" : "warning"}
                                        size="small"
                                        icon={
                                          <Iconify
                                            icon={
                                              course.isCompleted
                                                ? "solar:check-circle-bold"
                                                : "solar:clock-circle-bold"
                                            }
                                            width={16}
                                          />
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Scrollbar>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Card>
      ))}
    </Box>
  );

  // ─── Main render sections ────────────────────────────────────────────────────

  const renderTabs = () => (
    <Card sx={{ mb: 3 }}>
      <Tabs
        value={reportType}
        onChange={handleTabChange}
        sx={{ px: 2, pt: 1 }}
        TabIndicatorProps={{ style: { height: 3, borderRadius: 2 } }}
      >
        <Tab
          value="learningPaths"
          label={t("learning-reports.reportTypes.learningPaths")}
          icon={<Iconify icon="solar:share-bold" width={20} />}
          iconPosition="start"
        />
        <Tab
          value="programs"
          label={t("learning-reports.reportTypes.programs")}
          icon={<Iconify icon="solar:book-bold" width={20} />}
          iconPosition="start"
        />
        <Tab
          value="courses"
          label={t("learning-reports.reportTypes.courses")}
          icon={<Iconify icon="solar:medal-star-bold" width={20} />}
          iconPosition="start"
        />
      </Tabs>
    </Card>
  );

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
      {/* Title */}
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

      {/* Row 1: Search · Order · Format */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label={t("learning-reports.filters.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("learning-reports.filters.searchPlaceholder")}
          sx={{ minWidth: 220, flex: "1 1 220px" }}
          slotProps={{
            input: {
              startAdornment: (
                <Box sx={{ mr: 1, display: "flex", color: "text.secondary" }}>
                  <Iconify icon="solar:magnifer-zoom-in-bold" width={20} />
                </Box>
              ),
            },
          }}
        />

        <FormControl sx={{ minWidth: 260, flex: "1 1 260px" }}>
          <InputLabel>{t("learning-reports.filters.order")}</InputLabel>
          <Select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            label={t("learning-reports.filters.order")}
          >
            <MenuItem value="">
              <em>{t("learning-reports.filters.noOrder")}</em>
            </MenuItem>
            {ORDER_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150, flex: "0 1 160px" }}>
          <InputLabel>{t("learning-reports.filters.format")}</InputLabel>
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
            label={t("learning-reports.filters.format")}
          >
            {FORMAT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Row 2: Employee autocomplete · Route autocomplete · Include inactive */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2, alignItems: "center" }}>
        <Autocomplete
          options={employeeOptions}
          getOptionLabel={(opt) => `${opt.firstName} ${opt.firstLastName}`.trim() || opt.firstName || ""}
          value={selectedEmployee}
          onChange={(_, newValue) => setSelectedEmployee(newValue)}
          inputValue={employeeInputValue}
          onInputChange={(_, value) => setEmployeeInputValue(value)}
          loading={employeeLoading}
          loadingText={t("learning-reports.filters.searching")}
          noOptionsText={t("learning-reports.filters.noOptions")}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ minWidth: 280, flex: "1 1 280px" }}
          renderOption={(props, opt) => (
            <li {...props} key={opt.id}>
              <Box>
                <Typography variant="body2">{`${opt.firstName} ${opt.firstLastName}`}</Typography>
                {opt.email && (
                  <Typography variant="caption" color="text.disabled">
                    {opt.email}
                  </Typography>
                )}
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("learning-reports.filters.employee")}
              placeholder={t("learning-reports.filters.employeePlaceholder")}
              slotProps={{
                input: {
                  ...(params.InputProps as any),
                  endAdornment: (
                    <>
                      {employeeLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />

        <Autocomplete
          options={routeOptions}
          getOptionLabel={(opt) => opt.name || ""}
          value={selectedRoute}
          onChange={(_, newValue) => setSelectedRoute(newValue)}
          inputValue={routeInputValue}
          onInputChange={(_, value) => setRouteInputValue(value)}
          loading={routeLoading}
          loadingText={t("learning-reports.filters.searching")}
          noOptionsText={t("learning-reports.filters.noOptions")}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ minWidth: 280, flex: "1 1 280px" }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("learning-reports.filters.route")}
              placeholder={t("learning-reports.filters.routePlaceholder")}
              slotProps={{
                input: {
                  ...(params.InputProps as any),
                  endAdornment: (
                    <>
                      {routeLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />

        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t("learning-reports.filters.includeInactive")}
            </Typography>
          }
          sx={{ ml: 0 }}
        />
      </Box>

      {/* Row 3: Per page · Actions */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <TextField
          label={t("learning-reports.filters.perPage")}
          type="number"
          value={perPage}
          onChange={(e) => setPerPage(Math.max(1, Math.min(100, Number(e.target.value))))}
          sx={{ maxWidth: 130 }}
          slotProps={{ htmlInput: { min: 1, max: 100, step: 5 } }}
        />

        <Box sx={{ display: "flex", gap: 1.5, ml: "auto", flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClearFilters}
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            sx={{ height: 48, borderWidth: 1.5 }}
          >
            {t("learning-reports.filters.clear")}
          </Button>

          <LoadingButton
            variant="contained"
            onClick={handleGenerateReport}
            loading={loading}
            startIcon={<Iconify icon="solar:chart-square-outline" />}
            sx={{
              height: 48,
              minWidth: 180,
              boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
            }}
          >
            {t("learning-reports.filters.generate")}
          </LoadingButton>
        </Box>
      </Box>
    </Card>
  );

  const renderResults = () => {
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
            {t("learning-reports.messages.loading")}
          </Typography>
        </Card>
      );
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
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t("learning-reports.messages.noData")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("learning-reports.messages.noDataDescription")}
          </Typography>
        </Card>
      );
    }

    // Non-json formats download the blob immediately; no table to show
    if (format !== "json") return null;

    const dataComponent =
      reportType === "learningPaths"
        ? renderLearningPathsData()
        : reportType === "programs"
          ? renderProgramsData()
          : renderCoursesData();

    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("learning-reports.table.results")}
          </Typography>
          {reportMeta && (
            <Chip
              label={`${reportMeta.itemCount} ${t("learning-reports.table.totalRecords")}`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {dataComponent}

        {reportMeta && reportMeta.pageCount > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={reportMeta.pageCount}
              page={reportMeta.page}
              onChange={(_, newPage) => handlePageNav(newPage)}
              color="primary"
              showFirstButton
              showLastButton
              disabled={loading}
            />
          </Box>
        )}
      </>
    );
  };

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
          {t("learning-reports.subtitle")}
        </Typography>
      </Box>

      {renderTabs()}
      {renderFilters()}
      {renderResults()}
    </DashboardContent>
  );
}
