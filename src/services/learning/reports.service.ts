// utils
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

/**
 * Obtener reporte de learning.
 * Todos los parámetros son opcionales. Solo se enviarán en la query los que vengan definidos.
 * - employeeId: string | number (id del empleado)
 * - startDate, endDate: Date | string (si es Date, se convertirá a ISO string yyyy-mm-dd)
 */
export const GetReportService = async (
  employeeId?: string | number | null,
  startDate?: Date | string | null,
  endDate?: Date | string | null
) => {
  // Construir query params sólo con valores definidos (no null/undefined/empty)
  const params = new URLSearchParams();

  const pushIfValid = (key: string, value: any) => {
    if (value === undefined || value === null) return;
    // if it's an empty string, don't include
    if (typeof value === 'string' && value.trim() === '') return;
    params.append(key, String(value));
  };

  // Formatear fechas a YYYY-MM-DD si vienen como Date
  const formatDate = (d?: Date | string | null): string | undefined => {
    if (!d) return undefined;
    if (d instanceof Date) {
      // yyyy-mm-dd
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    // si es string, asumimos que ya está en un formato aceptable por el backend
    return d;
  };

  pushIfValid('employeeId', employeeId ?? undefined);
  pushIfValid('startDate', formatDate(startDate ?? undefined));
  pushIfValid('endDate', formatDate(endDate ?? undefined));

  const url = `${endpoints.learning.reports.getReport}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await axios.get<any>(url);
  return response;
};

/*
Example usage:

// 1) Sin filtros
// GetReportService();

// 2) Solo empleado
// GetReportService(123);

// 3) Fechas como Date
// GetReportService(null, new Date('2025-01-01'), new Date('2025-01-31'));

// Notas / suposiciones:
// - Query params enviados: employeeId, startDate, endDate
// - startDate/endDate se envían en formato YYYY-MM-DD si se pasan como Date
// - Si el backend espera otro nombre para los params, ajusta las claves en pushIfValid
*/