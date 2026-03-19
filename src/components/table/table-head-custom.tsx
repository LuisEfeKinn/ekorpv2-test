import type { Theme, SxProps, CSSObject } from '@mui/material/styles';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';

// ----------------------------------------------------------------------

const visuallyHidden: CSSObject = {
  border: 0,
  padding: 0,
  width: '1px',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
};

// ----------------------------------------------------------------------

export type TableHeadCellProps = {
  id: string;
  label?: string;
  width?: CSSObject['width'];
  align?: 'left' | 'center' | 'right';
  sx?: SxProps<Theme>;
  /** Campo del backend usado para ordenar desde el servidor (ej: 'employee.firstName') */
  sortField?: string;
};

export type TableHeadCustomProps = {
  orderBy?: string;
  rowCount?: number;
  sx?: SxProps<Theme>;
  numSelected?: number;
  order?: 'asc' | 'desc';
  headCells: TableHeadCellProps[];
  onSort?: (id: string) => void;
  onSelectAllRows?: (checked: boolean) => void;
  /** Campo del backend actualmente ordenado (ej: 'employee.firstName') */
  serverOrderBy?: string;
  /** Dirección del orden del servidor */
  serverOrder?: 'asc' | 'desc';
  /** Callback cuando el usuario hace clic en una columna con sortField */
  onServerSort?: (sortField: string, direction: 'asc' | 'desc') => void;
};

export function TableHeadCustom({
  sx,
  order,
  onSort,
  orderBy,
  headCells,
  rowCount = 0,
  numSelected = 0,
  onSelectAllRows,
  serverOrderBy,
  serverOrder,
  onServerSort,
}: TableHeadCustomProps) {
  return (
    <TableHead sx={sx}>
      <TableRow>
        {onSelectAllRows && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={!!numSelected && numSelected < rowCount}
              checked={!!rowCount && numSelected === rowCount}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onSelectAllRows(event.target.checked)
              }
              slotProps={{
                input: {
                  id: `all-row-checkbox`,
                  'aria-label': `All row Checkbox`,
                },
              }}
            />
          </TableCell>
        )}

        {headCells.map((headCell) => {
          const isServerSortable = !!headCell.sortField && !!onServerSort;
          const isServerActive = isServerSortable && serverOrderBy === headCell.sortField;

          return (
            <TableCell
              key={headCell.id}
              align={headCell.align || 'left'}
              sortDirection={
                isServerActive
                  ? serverOrder
                  : orderBy === headCell.id
                    ? order
                    : false
              }
              sx={[
                { width: headCell.width },
                ...(Array.isArray(headCell.sx) ? headCell.sx : [headCell.sx]),
              ]}
            >
              {isServerSortable ? (
                <TableSortLabel
                  hideSortIcon
                  active={isServerActive}
                  direction={isServerActive ? serverOrder : 'asc'}
                  onClick={() => {
                    const nextDir =
                      isServerActive && serverOrder === 'asc' ? 'desc' : 'asc';
                    onServerSort!(headCell.sortField!, nextDir);
                  }}
                >
                  {headCell.label}
                  {isServerActive ? (
                    <Box component="span" sx={visuallyHidden}>
                      {serverOrder === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              ) : onSort ? (
                <TableSortLabel
                  hideSortIcon
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={() => onSort(headCell.id)}
                >
                  {headCell.label}
                  {orderBy === headCell.id ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              ) : (
                headCell.label
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}
