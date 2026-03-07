'use client';

import '@xyflow/react/dist/style.css';

import type { Node, Edge, NodeTypes } from '@xyflow/react';
import type { Theme, SxProps } from '@mui/material/styles';

import dagre from '@dagrejs/dagre';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  MarkerType,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  BackgroundVariant,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { DeleteDataTableService } from 'src/services/architecture/data/dataTable.service';
import { GetDomainPaginationService } from 'src/services/architecture/catalogs/domains.service';
import { GetDataTypesPaginationService } from 'src/services/architecture/catalogs/dataTypes.service';
import {
  GetDataFlowService,
  GetDataFlowByIdService,
} from 'src/services/architecture/data/dataMap.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DataTableDiagram } from './data-table-diagram';
import { DataDiagramFlowEditModal } from './data-diagram-flow-edit';
import { DataDiagramFlowCreateModal } from './data-diagram-flow-create';

// ----------------------------------------------------------------------

type DomainNode = {
  id: number;
  code: string;
  name: string;
  corporateScope: string;
  owner: string;
  admin: string;
  color: string;
};

type DataTypeNode = {
  id: number;
  name: string;
};

type ApplicationFlowNode = {
  id: number;
  label: string;
  data: {
    id: number;
    name: string;
    description: string;
    architecture: boolean;
    sla: boolean;
    nomenclature: string;
    code: string | null;
    requiresSla: boolean;
    hasSla: boolean;
    file?: string;
    type?: string;
    rules?: string;
    localExternal?: string;
    superiorSystem?: any;
    expirationDate?: string;
    renewalDate?: string;
  };
  children: ApplicationFlowNode[];
};

type RootNode = {
  id: number;
  name: string;
  type: 'domain' | 'dataType';
  color?: string;
  code?: string;
  corporateScope?: string;
  owner?: string;
  admin?: string;
  children?: ApplicationFlowNode[];
  isExpanded?: boolean;
};

type DataDiagramFlowProps = {
  filterType?: 'domains' | 'types';
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

// Nodo de Datos Estilo n8n/Make
function DataNode({ data }: any) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const {
    label,
    description,
    code,
    nomenclature,
    hasSla,
    localExternal,
    expirationDate,
    renewalDate,
    onDelete,
    onExpand,
    onAddChild,
    onEdit,
    onViewMap,
    color,
    isDeleting,
    isExpanded,
    isRoot
  } = data;

  return (
    <Paper
      elevation={isRoot ? 12 : 8}
      sx={{
        px: 2.5,
        py: 2,
        borderRadius: 3,
        background: theme.palette.background.paper,
        border: `2px solid ${alpha(color, isRoot ? 0.6 : 0.4)}`,
        boxShadow: isRoot
          ? `0 12px 40px ${alpha(color, 0.35)}`
          : `0 8px 32px ${alpha(color, 0.25)}`,
        cursor: isDeleting ? 'not-allowed' : 'grab',
        minWidth: 240,
        maxWidth: 320, // Aumentado para acomodar fechas
        position: 'relative',
        overflow: 'hidden',
        opacity: isDeleting ? 0.6 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: isDeleting ? 'none' : 'translateY(-6px) scale(1.02)',
          boxShadow: `0 16px 48px ${alpha(color, 0.35)}`,
          borderColor: color,
          '& .action-buttons': {
            opacity: isDeleting ? 0 : 1,
          },
        },
        '&:active': {
          cursor: isDeleting ? 'not-allowed' : 'grabbing',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: isRoot ? '6px' : '5px',
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
          boxShadow: `0 3px 10px ${alpha(color, 0.4)}`,
        },
      }}
    >
      {/* Handle de entrada (arriba) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 14,
          height: 14,
          background: color,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: `0 2px 8px ${alpha(color, 0.5)}`,
        }}
      />

      {/* Handle de salida (abajo) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 14,
          height: 14,
          background: color,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: `0 2px 8px ${alpha(color, 0.5)}`,
        }}
      />

      <Stack spacing={1.5}>
        {/* Header con ícono, badges y botón de expandir */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: alpha(color, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${alpha(color, 0.25)}`,
                position: 'relative',
              }}
            >
              <Iconify
                icon={isRoot ? 'solar:crown-bold' : 'solar:inbox-in-bold'}
                width={22}
                sx={{ color }}
              />
            </Box>

            <Stack direction="row" spacing={0.5}>
              {hasSla && (
                <Tooltip title={t('data.diagram.tooltips.hasSla')}>
                  <Chip
                    size="small"
                    icon={<Iconify icon="solar:shield-check-bold" width={14} />}
                    sx={{
                      height: 22,
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: theme.palette.success.main,
                      '& .MuiChip-icon': { color: theme.palette.success.main },
                    }}
                  />
                </Tooltip>
              )}
              {localExternal === 'E' && (
                <Tooltip title={t('data.diagram.tooltips.external')}>
                  <Chip
                    size="small"
                    icon={<Iconify icon="solar:letter-bold" width={14} />}
                    sx={{
                      height: 22,
                      bgcolor: alpha(theme.palette.info.main, 0.12),
                      color: theme.palette.info.main,
                      '& .MuiChip-icon': { color: theme.palette.info.main },
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* Botón de expandir/contraer integrado */}
          <Tooltip title={isExpanded ? t('data.diagram.tooltips.collapse') : t('data.diagram.tooltips.expand')}>
            <span>
              <IconButton
                size="small"
                onClick={onExpand}
                disabled={isDeleting}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(color, 0.1),
                  color,
                  border: `2px solid ${alpha(color, 0.25)}`,
                  '&:hover': {
                    bgcolor: alpha(color, 0.2),
                    borderColor: color,
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    opacity: 0.4,
                    bgcolor: alpha(theme.palette.grey[400], 0.1),
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Iconify
                  icon={(isExpanded ? "eva:chevron-up-fill" : "eva:chevron-down-fill") as any}
                  width={20}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* Título */}
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.95rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {label}
        </Typography>

        {/* Descripción */}
        {description && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </Typography>
        )}

        {/* Sección de fechas */}
        {(expirationDate || renewalDate) && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(color, 0.06),
              border: `1px solid ${alpha(color, 0.15)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${alpha(color, 0.4)}, ${alpha(color, 0.2)})`,
              },
            }}
          >
            <Stack spacing={1}>
              {expirationDate && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '6px',
                      bgcolor: alpha(theme.palette.warning.main, 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify
                      icon="solar:calendar-mark-bold"
                      width={12}
                      sx={{ color: theme.palette.warning.main }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        lineHeight: 1.2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {t('data.diagram.labels.expiration')}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: theme.palette.warning.main,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        lineHeight: 1.2,
                        mt: 0.2,
                      }}
                    >
                      {new Date(expirationDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Stack>
              )}
              {renewalDate && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '6px',
                      bgcolor: alpha(theme.palette.success.main, 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify
                      icon="solar:refresh-circle-bold"
                      width={12}
                      sx={{ color: theme.palette.success.main }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        lineHeight: 1.2,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {t('data.diagram.labels.renew')}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: theme.palette.success.main,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        lineHeight: 1.2,
                        mt: 0.2,
                      }}
                    >
                      {new Date(renewalDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>
        )}

        {/* Footer con código y nomenclatura */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Chip
            label={`#${code}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              bgcolor: alpha(color, 0.1),
              color,
              fontWeight: 600,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.7rem',
              fontWeight: 500,
            }}
          >
            {nomenclature}
          </Typography>
        </Stack>

        {/* Botones de acción */}
        <Stack
          className="action-buttons"
          direction="row"
          spacing={0.75}
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s',
            mt: 0.5,
          }}
        >
          <Button
            size="medium"
            variant="outlined"
            onClick={onAddChild}
            disabled={isDeleting}
            startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
            sx={{
              flex: 1,
              height: 36,
              fontSize: '0.8rem',
              borderColor: alpha(color, 0.3),
              color,
              fontWeight: 600,
              '&:hover': {
                borderColor: color,
                bgcolor: alpha(color, 0.08),
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s',
            }}
          >
            {t('data.diagram.actions.add')}
          </Button>
          <Tooltip title={t('data.diagram.actions.edit')} placement="top">
            <Button
              size="medium"
              variant="outlined"
              onClick={onEdit}
              disabled={isDeleting}
              sx={{
                minWidth: 42,
                width: 42,
                height: 36,
                p: 0,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </Button>
          </Tooltip>
          <Tooltip title={t('data.diagram.actions.viewMap') || 'Ver Mapa'} placement="top">
            <Button
              size="medium"
              variant="outlined"
              onClick={onViewMap}
              disabled={isDeleting}
              sx={{
                minWidth: 42,
                width: 42,
                height: 36,
                p: 0,
                borderColor: alpha(theme.palette.info.main, 0.3),
                color: theme.palette.info.main,
                '&:hover': {
                  borderColor: theme.palette.info.main,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              <Iconify icon="solar:map-point-bold" width={18} />
            </Button>
          </Tooltip>
          <Button
            size="medium"
            variant="outlined"
            onClick={onDelete}
            disabled={isDeleting}
            color="error"
            sx={{
              minWidth: 42,
              width: 42,
              height: 36,
              p: 0,
              '&:hover': {
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s',
            }}
          >
            {isDeleting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
            )}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

// Nodo de agregar (placeholder)
function AddNode({ data }: any) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const { onAdd } = data;

  return (
    <Paper
      onClick={onAdd}
      elevation={4}
      sx={{
        p: 2,
        borderRadius: 3,
        background: alpha(theme.palette.primary.main, 0.08),
        border: `2px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
        cursor: 'pointer',
        minWidth: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'scale(1.05)',
          background: alpha(theme.palette.primary.main, 0.12),
          borderColor: theme.palette.primary.main,
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
        },
      }}
    >
      <Stack spacing={1} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify
            icon="solar:add-circle-bold"
            width={28}
            sx={{ color: theme.palette.primary.main }}
          />
        </Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
        >
          {t('data.diagram.actions.add')}
        </Typography>
      </Stack>
    </Paper>
  );
}

// Nodo raíz para Dominios/Tipos (solo con botón de expandir)
function RootNode({ data }: any) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  const {
    label,
    code,
    corporateScope,
    owner,
    color,
    onExpand,
    isExpanded,
    hasChildren,
    nodeType
  } = data;

  return (
    <Paper
      elevation={12}
      sx={{
        px: 3,
        py: 2.5,
        borderRadius: 3,
        background: theme.palette.background.paper,
        border: `3px solid ${color || theme.palette.primary.main}`,
        boxShadow: `0 12px 40px ${alpha(color || theme.palette.primary.main, 0.35)}`,
        cursor: 'grab',
        minWidth: 280,
        maxWidth: 360,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-6px) scale(1.02)',
          boxShadow: `0 16px 48px ${alpha(color || theme.palette.primary.main, 0.4)}`,
          borderColor: color || theme.palette.primary.main,
        },
        '&:active': {
          cursor: 'grabbing',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: `linear-gradient(90deg, ${color || theme.palette.primary.main}, ${alpha(color || theme.palette.primary.main, 0.6)})`,
          boxShadow: `0 3px 10px ${alpha(color || theme.palette.primary.main, 0.4)}`,
        },
      }}
    >
      {/* Handle superior */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 14,
          height: 14,
          background: color || theme.palette.primary.main,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: `0 2px 8px ${alpha(color || theme.palette.primary.main, 0.5)}`,
          visibility: 'hidden',
        }}
      />

      {/* Handle inferior */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 14,
          height: 14,
          background: color || theme.palette.primary.main,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: `0 2px 8px ${alpha(color || theme.palette.primary.main, 0.5)}`,
        }}
      />

      <Stack spacing={2}>
        {/* Header con nombre */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${alpha(color || theme.palette.primary.main, 0.2)}, ${alpha(color || theme.palette.primary.main, 0.05)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${alpha(color || theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Iconify
              icon={(nodeType === 'domain' ? "solar:book-bookmark-bold" : "solar:documents-bold") as any}
              width={22}
              sx={{ color: color || 'primary.main' }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Typography>
            {code && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {code}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Información adicional para dominios */}
        {nodeType === 'domain' && (
          <Stack spacing={1}>
            {corporateScope && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                  {t('data.diagram.labels.corporateScope')}:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.813rem' }}>
                  {corporateScope}
                </Typography>
              </Box>
            )}
            {owner && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                  {t('data.diagram.labels.owner')}:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.813rem' }}>
                  {owner}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* Botón de expandir */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pt: 1,
            mt: 1,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Tooltip title={isExpanded ? t('data.diagram.tooltips.collapse') : t('data.diagram.tooltips.expand')}>
            <IconButton
              onClick={onExpand}
              disabled={!hasChildren}
              sx={{
                bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(color || theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  bgcolor: alpha(color || theme.palette.primary.main, 0.2),
                  transform: 'scale(1.1)',
                },
                '&:disabled': {
                  bgcolor: alpha(theme.palette.grey[500], 0.05),
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`,
                },
              }}
            >
              <Iconify
                icon={isExpanded ? "eva:collapse-fill" : "eva:expand-fill"}
                width={20}
                sx={{ 
                  color: hasChildren ? (color || 'primary.main') : 'text.disabled',
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Paper>
  );
}

const nodeTypes: NodeTypes = {
  rootNode: RootNode,
  dataNode: DataNode,
  addNode: AddNode,
};

// Componente de controles personalizados con botones de reset, expandir y contraer todo
function CustomControls({
  onReset,
  onExpandAll,
  onCollapseAll,
  onResetView,
  // onOpenFilters
}: {
  onReset: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onResetView: () => void;
  // onOpenFilters: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();

  const buttonStyle = {
    width: 36,
    height: 36,
    backgroundColor: alpha(theme.palette.background.paper, 0.95),
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
      transform: 'scale(1.05)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 270,
        left: 16,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <Tooltip title={t('data.diagram.tooltips.expandAll')} placement="right">
        <IconButton onClick={onExpandAll} sx={buttonStyle}>
          <Iconify
            icon="eva:expand-fill"
            width={20}
            sx={{ color: theme.palette.text.primary }}
          />
        </IconButton>
      </Tooltip>

      <Tooltip title={t('data.diagram.tooltips.collapseAll')} placement="right">
        <IconButton onClick={onCollapseAll} sx={buttonStyle}>
          <Iconify
            icon="eva:collapse-fill"
            width={20}
            sx={{ color: theme.palette.text.primary }}
          />
        </IconButton>
      </Tooltip>

      <Tooltip title={t('data.diagram.tooltips.initialView')} placement="right">
        <IconButton onClick={onResetView} sx={buttonStyle}>
          <Iconify
            icon="solar:eye-scan-bold"
            width={20}
            sx={{ color: theme.palette.text.primary }}
          />
        </IconButton>
      </Tooltip>

      <Tooltip title={t('data.diagram.tooltips.restartDiagram')} placement="right">
        <IconButton onClick={onReset} sx={buttonStyle}>
          <Iconify
            icon="solar:restart-bold"
            width={20}
            sx={{ color: theme.palette.text.primary }}
          />
        </IconButton>
      </Tooltip>

      {/* <Tooltip title={t('data.diagram.filters.title')} placement="right">
        <IconButton onClick={onOpenFilters} sx={buttonStyle}>
          <Iconify
            icon="solar:filter-broken"
            width={20}
            sx={{ color: theme.palette.text.primary }}
          />
        </IconButton>
      </Tooltip> */}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function DataDiagramFlow({ 
  filterType: filterTypeProp = 'domains', 
  sx 
}: DataDiagramFlowProps) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [rootNodes, setRootNodes] = useState<RootNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [expandedNodesData, setExpandedNodesData] = useState<Map<number, ApplicationFlowNode[]>>(new Map());
  const [nodesWithNoChildren, setNodesWithNoChildren] = useState<Set<number>>(new Set());
  const [nodesLoadedFromService, setNodesLoadedFromService] = useState<Set<number>>(new Set());
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set()); // Nodos manualmente colapsados
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [shouldResetView, setShouldResetView] = useState(true);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Edit modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: number | null;
    childId: number | null;
    name: string;
  }>({ open: false, id: null, childId: null, name: '' });

  // Diagram modal state
  const [diagramModal, setDiagramModal] = useState<{
    open: boolean;
    dataId: string | null;
    nodeLabel: string;
  }>({ open: false, dataId: null, nodeLabel: '' });

  // Paleta de colores para los nodos
  const colors = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.info.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
    ],
    [theme]
  );

  // Cargar nodos raíz (dominios o tipos) según el switch
  const loadRootNodes = useCallback(async () => {
    try {
      setLoading(true);
      
      if (filterTypeProp === 'domains') {
        // Cargar dominios
        const response = await GetDomainPaginationService({});
        if (response?.data && Array.isArray(response.data[0])) {
          const domains: RootNode[] = response.data[0].map((domain: DomainNode) => ({
            id: domain.id,
            name: domain.name,
            type: 'domain' as const,
            color: domain.color,
            code: domain.code,
            corporateScope: domain.corporateScope,
            owner: domain.owner,
            admin: domain.admin,
            isExpanded: false,
          }));
          setRootNodes(domains);
        }
      } else {
        // Cargar tipos de datos
        const response = await GetDataTypesPaginationService({});
        if (response?.data && Array.isArray(response.data[0])) {
          const types: RootNode[] = response.data[0].map((type: DataTypeNode) => ({
            id: type.id,
            name: type.name,
            type: 'dataType' as const,
            isExpanded: false,
          }));
          setRootNodes(types);
        }
      }
      
      // Limpiar nodos expandidos al cambiar el tipo de filtro
      setExpandedNodes(new Set());
      setExpandedNodesData(new Map());
      setNodesLoadedFromService(new Set());
      setNodesWithNoChildren(new Set());
      setCollapsedNodes(new Set());
    } catch (error) {
      console.error('Error loading root nodes:', error);
      toast.error(t('data.diagram.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [t, filterTypeProp]);

  useEffect(() => {
    loadRootNodes();
  }, [loadRootNodes]);

  // Handler para abrir el diálogo de confirmación
  const handleOpenDeleteDialog = useCallback((id: number, childId: number, name: string) => {
    setDeleteDialog({ open: true, id, childId, name });
  }, []);

  // Handler para cerrar el diálogo
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, id: null, childId: null, name: '' });
  }, []);

  // Handler para confirmar eliminación
  const handleConfirmDelete = useCallback(async () => {
    const { id, childId } = deleteDialog;
    if (!id || !childId || deletingId) return;

    try {
      setDeletingId(childId);
      handleCloseDeleteDialog();
      await DeleteDataTableService(childId);
      toast.success(t('data.diagram.messages.success.deleted'));
      await loadRootNodes();
    } catch (error) {
      console.error('Error deleting data flow node:', error);
      toast.error(t('data.diagram.messages.error.deleting'));
    } finally {
      setDeletingId(null);
    }
  }, [deleteDialog, deletingId, t, loadRootNodes, handleCloseDeleteDialog]);

  // Handler para expandir/contraer nodos raíz y de aplicaciones
  const handleExpandRootNode = useCallback(async (rootNodeId: number) => {
    const isExpanded = expandedNodes.has(rootNodeId);

    if (isExpanded) {
      // Contraer: remover del set de nodos expandidos
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rootNodeId);
        return newSet;
      });
    } else {
      // Expandir: cargar aplicaciones del dominio/tipo
      if (!expandedNodesData.has(rootNodeId)) {
        try {
          setLoadingExpand(true);
          const params: any = {};
          
          if (filterTypeProp === 'domains') {
            params.domain = rootNodeId;
          } else {
            params.type = rootNodeId;
          }
          
          const response = await GetDataFlowService(params);
          
          if (response?.data) {
            setExpandedNodesData((prev) => {
              const newMap = new Map(prev);
              newMap.set(rootNodeId, response.data);
              return newMap;
            });
            
            // Si no tiene hijos, marcarlo
            if (!response.data || response.data.length === 0) {
              setNodesWithNoChildren((prev) => new Set(prev).add(rootNodeId));
            }
          } else {
            // Si la respuesta está vacía, marcarlo como sin hijos
            setNodesWithNoChildren((prev) => new Set(prev).add(rootNodeId));
            setExpandedNodesData((prev) => {
              const newMap = new Map(prev);
              newMap.set(rootNodeId, []);
              return newMap;
            });
          }
        } catch (error) {
          console.error('Error expanding root node:', error);
          toast.error(t('data.diagram.messages.error.loading'));
          return;
        } finally {
          setLoadingExpand(false);
        }
      }

      // Agregar al set de nodos expandidos
      setExpandedNodes((prev) => new Set(prev).add(rootNodeId));
    }
  }, [expandedNodes, expandedNodesData, filterTypeProp, t]);

  // Handler para expandir/contraer nodos de aplicaciones hijos
  const handleExpandApplicationNode = useCallback(async (nodeId: number, rootNodeId: number) => {
    const isExpanded = expandedNodes.has(nodeId);
    const isCollapsed = collapsedNodes.has(nodeId);
    const hasLoadedFromService = nodesLoadedFromService.has(nodeId);

    // Verificar si el nodo tiene children en los datos actuales
    const currentRootData = expandedNodesData.get(rootNodeId) || [];
    const findNodeInData = (dataNodes: ApplicationFlowNode[]): ApplicationFlowNode | null => {
      for (const node of dataNodes) {
        if (node.id === nodeId) return node;
        if (node.children && node.children.length > 0) {
          const found = findNodeInData(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    const nodeData = findNodeInData(currentRootData);
    const hasChildrenInData = nodeData?.children && nodeData.children.length > 0;

    if (isCollapsed) {
      // Si está colapsado manualmente, removerlo del set de colapsados
      setCollapsedNodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      return;
    }

    // Si tiene hijos visibles (está expandido o tiene children en los datos), contraer
    if (isExpanded || hasChildrenInData) {
      // Contraer: agregar al set de nodos colapsados
      setCollapsedNodes((prev) => new Set(prev).add(nodeId));
      // También remover del set de expandidos si estaba ahí
      if (isExpanded) {
        setExpandedNodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }
    } else {
      // Expandir: si no se ha cargado desde el servicio, llamarlo
      if (!hasLoadedFromService) {
        try {
          setLoadingExpand(true);
          const response = await GetDataFlowByIdService(nodeId);
          
          // Marcar como cargado desde el servicio
          setNodesLoadedFromService((prev) => new Set(prev).add(nodeId));
          
          if (response?.data) {
            // Actualizar los datos del nodo raíz expandido
            setExpandedNodesData((prev) => {
              const newMap = new Map(prev);
              const rootData = newMap.get(rootNodeId) || [];
              
              const updateNodeChildren = (nd: ApplicationFlowNode[]): ApplicationFlowNode[] =>
                nd.map((node) => {
                  if (node.id === nodeId) {
                    return response.data;
                  }
                  if (node.children && node.children.length > 0) {
                    return {
                      ...node,
                      children: updateNodeChildren(node.children),
                    };
                  }
                  return node;
                });
              
              newMap.set(rootNodeId, updateNodeChildren(rootData));
              return newMap;
            });
            
            // Si no tiene hijos, marcarlo
            if (!response.data.children || response.data.children.length === 0) {
              setNodesWithNoChildren((prev) => new Set(prev).add(nodeId));
            }
          }
        } catch (error) {
          console.error('Error expanding application node:', error);
          toast.error(t('data.diagram.messages.error.loading'));
          return;
        } finally {
          setLoadingExpand(false);
        }
      }

      // Agregar al set de nodos expandidos
      setExpandedNodes((prev) => new Set(prev).add(nodeId));
    }
  }, [expandedNodes, nodesLoadedFromService, collapsedNodes, expandedNodesData, t]);

  // Handler para abrir modal de agregar hijo
  const handleAddChild = useCallback((parentId: number | null) => {
    setSelectedParentId(parentId);
    setOpenModal(true);
  }, []);

  // Handler para abrir modal de edición
  const handleEditNode = useCallback((nodeId: number) => {
    setSelectedNodeId(String(nodeId));
    setOpenEditModal(true);
  }, []);

  // Handler para cerrar modal de edición
  const handleCloseEditModal = useCallback(() => {
    setOpenEditModal(false);
    setSelectedNodeId(null);
  }, []);

  // Handler para guardar edición
  const handleEditSave = useCallback(() => {
    loadRootNodes();
    handleCloseEditModal();
  }, [loadRootNodes, handleCloseEditModal]);

  // Handler para abrir modal del diagrama/mapa
  const handleViewMap = useCallback((nodeId: number, nodeLabel: string) => {
    setDiagramModal({ open: true, dataId: String(nodeId), nodeLabel });
  }, []);

  // Handler para cerrar modal del diagrama
  const handleCloseDiagramModal = useCallback(() => {
    setDiagramModal({ open: false, dataId: null, nodeLabel: '' });
  }, []);

  // Handler para expandir todos los nodos raíz
  const handleExpandAll = useCallback(async () => {
    const allRootNodeIds = rootNodes.map(node => node.id);
    
    // Cargar datos de todos los nodos raíz que no están cargados
    const loadPromises = allRootNodeIds.map(async (nodeId) => {
      if (!expandedNodesData.has(nodeId)) {
        try {
          const params: any = {};
          
          if (filterTypeProp === 'domains') {
            params.domain = nodeId;
          } else {
            params.type = nodeId;
          }
          
          const response = await GetDataFlowService(params);
          
          if (response?.data) {
            return { nodeId, data: response.data };
          }
        } catch (error) {
          console.error(`Error loading data for node ${nodeId}:`, error);
        }
      }
      return null;
    });

    const results = await Promise.all(loadPromises);
    
    // Actualizar el mapa de datos expandidos
    setExpandedNodesData((prev) => {
      const newMap = new Map(prev);
      results.forEach((result) => {
        if (result) {
          newMap.set(result.nodeId, result.data);
        }
      });
      return newMap;
    });
    
    // Expandir todos los nodos raíz
    setExpandedNodes(new Set(allRootNodeIds));
  }, [rootNodes, expandedNodesData, filterTypeProp]);

  // Handler para contraer todos los nodos
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Función para aplicar layout con dagre
  const applyDagreLayout = useCallback((nds: Node[], edgs: Edge[]): Node[] => {
    if (nds.length === 0) return nds;

    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    
    // Configuración del grafo con espaciado amplio
    graph.setGraph({
      rankdir: 'TB', // Top to Bottom
      nodesep: 150,  // Espaciado horizontal entre nodos (aumentado significativamente)
      ranksep: 300,  // Espaciado vertical entre niveles
      marginx: 50,
      marginy: 50,
    });

    // Agregar nodos al grafo con sus dimensiones
    nds.forEach((node) => {
      const nodeWidth = node.type === 'rootNode' ? 360 : node.type === 'default' ? 220 : 320;
      const nodeHeight = node.type === 'rootNode' ? 200 : node.type === 'default' ? 80 : 280;
      graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Agregar edges al grafo
    edgs.forEach((edge) => {
      graph.setEdge(edge.source, edge.target);
    });

    // Calcular layout
    dagre.layout(graph);

    // Aplicar las posiciones calculadas a los nodos
    return nds.map((node) => {
      const nodeWithPosition = graph.node(node.id);
      const nodeWidth = node.type === 'rootNode' ? 360 : node.type === 'default' ? 220 : 320;
      const nodeHeight = node.type === 'rootNode' ? 200 : node.type === 'default' ? 80 : 280;
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });
  }, []);

  // Generar nodos y conexiones jerárquicas basadas en nodos raíz
  const generateNodesAndEdges = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Función recursiva para procesar nodos de aplicación y sus hijos
    const processApplicationNode = (
      node: ApplicationFlowNode,
      rootNodeId: number,
      parentId?: number
    ): void => {
      const color = colors[node.id % colors.length];
      const isExpanded = expandedNodes.has(node.id);
      const isCollapsed = collapsedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      // Si los hijos ya vienen en los datos Y NO está colapsado, considerarlo como expandido visualmente
      const isVisuallyExpanded = (isExpanded || hasChildren) && !isCollapsed;

      // Crear el nodo de aplicación (posición temporal, dagre la calculará)
      newNodes.push({
        id: `node-${node.id}`,
        type: 'dataNode',
        position: { x: 0, y: 0 }, // Posición temporal
        data: {
          label: node.label,
          description: node.data.description,
          code: node.data.code,
          nomenclature: node.data.nomenclature,
          hasSla: node.data.hasSla,
          localExternal: node.data.localExternal || '',
          expirationDate: node.data.expirationDate,
          renewalDate: node.data.renewalDate,
          color,
          isDeleting: deletingId === node.id,
          isExpanded: isVisuallyExpanded,
          hasChildren,
          isRoot: false,
          onExpand: () => handleExpandApplicationNode(node.id, rootNodeId),
          onAddChild: () => handleAddChild(node.id),
          onEdit: () => handleEditNode(node.id),
          onViewMap: () => handleViewMap(node.id, node.label),
          onDelete: () => handleOpenDeleteDialog(parentId || rootNodeId, node.id, node.label),
        },
        draggable: !deletingId,
      });

      // Crear conexión con el padre
      const sourceId = parentId ? `node-${parentId}` : `root-${rootNodeId}`;
      newEdges.push({
        id: `edge-${sourceId}-${node.id}`,
        source: sourceId,
        target: `node-${node.id}`,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: alpha(color, 0.5),
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: alpha(color, 0.5),
          width: 20,
          height: 20,
        },
      });

      // Procesar hijos si:
      // 1. El nodo está expandido manualmente O los hijos ya vienen en los datos
      // 2. Y el nodo NO está colapsado manualmente
      if ((isExpanded || hasChildren) && !isCollapsed) {
        if (hasChildren) {
          node.children.forEach((child) => {
            processApplicationNode(child, rootNodeId, node.id);
          });
        } else if (isExpanded && nodesWithNoChildren.has(node.id)) {
          // Mostrar mensaje de "sin nodos hijos" solo si se expandió manualmente y no tiene hijos
          const emptyNodeId = `empty-${node.id}`;
          newNodes.push({
            id: emptyNodeId,
            type: 'default',
            position: { x: 0, y: 0 }, // Posición temporal
            data: {
              label: t('data.diagram.messages.noChildren'),
            },
            style: {
              background: alpha(theme.palette.grey[500], 0.08),
              border: `2px dashed ${alpha(theme.palette.grey[500], 0.3)}`,
              borderRadius: '12px',
              padding: '16px',
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              width: '200px',
              textAlign: 'center',
            },
            draggable: false,
          });

          // Crear conexión con el nodo padre
          newEdges.push({
            id: `edge-node-${node.id}-empty`,
            source: `node-${node.id}`,
            target: emptyNodeId,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: alpha(theme.palette.grey[500], 0.3),
              strokeWidth: 2,
              strokeDasharray: '5,5',
            },
          });
        }
      }
    };

    // Procesar nodos raíz (dominios o tipos)
    if (rootNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Crear nodos raíz
    rootNodes.forEach((rootNode) => {
      const isRootExpanded = expandedNodes.has(rootNode.id);
      const rootApplications = expandedNodesData.get(rootNode.id) || [];
      
      // Crear nodo raíz (posición temporal, dagre la calculará)
      newNodes.push({
        id: `root-${rootNode.id}`,
        type: 'rootNode',
        position: { x: 0, y: 0 }, // Posición temporal
        data: {
          label: rootNode.name,
          code: rootNode.code,
          corporateScope: rootNode.corporateScope,
          owner: rootNode.owner,
          admin: rootNode.admin,
          color: rootNode.color || colors[rootNode.id % colors.length],
          nodeType: rootNode.type,
          isExpanded: isRootExpanded,
          hasChildren: true,
          onExpand: () => handleExpandRootNode(rootNode.id),
        },
        draggable: false,
      });

      // Procesar aplicaciones del nodo raíz si está expandido
      if (isRootExpanded) {
        if (rootApplications.length > 0) {
          rootApplications.forEach((appNode) => {
            processApplicationNode(appNode, rootNode.id);
          });
        } else {
          // Mostrar mensaje de "sin nodos hijos"
          const emptyNodeId = `empty-${rootNode.id}`;
          newNodes.push({
            id: emptyNodeId,
            type: 'default',
            position: { x: 0, y: 0 }, // Posición temporal
            data: {
              label: t('data.diagram.messages.noChildren'),
            },
            style: {
              background: alpha(theme.palette.grey[500], 0.08),
              border: `2px dashed ${alpha(theme.palette.grey[500], 0.3)}`,
              borderRadius: '12px',
              padding: '16px',
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              width: '200px',
              textAlign: 'center',
            },
            draggable: false,
          });

          // Crear conexión con el nodo raíz
          newEdges.push({
            id: `edge-root-${rootNode.id}-empty`,
            source: `root-${rootNode.id}`,
            target: emptyNodeId,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: alpha(theme.palette.grey[500], 0.3),
              strokeWidth: 2,
              strokeDasharray: '5,5',
            },
          });
        }
      }
    });

    // Aplicar layout con dagre para calcular posiciones óptimas
    const layoutedNodes = applyDagreLayout(newNodes, newEdges);

    setNodes(layoutedNodes);
    setEdges(newEdges);
  }, [
    rootNodes,
    expandedNodes,
    expandedNodesData,
    nodesWithNoChildren,
    collapsedNodes,
    colors,
    deletingId,
    theme,
    t,
    handleExpandRootNode,
    handleExpandApplicationNode,
    handleEditNode,
    handleViewMap,
    handleAddChild,
    handleOpenDeleteDialog,
    setNodes,
    setEdges,
    applyDagreLayout,
  ]);

  useEffect(() => {
    if (!loading) {
      generateNodesAndEdges();
    }
  }, [loading, generateNodesAndEdges]);

  // Alinear nodos en la parte superior usando React Flow API (solo al cargar inicialmente)
  useEffect(() => {
    if (nodes.length === 0 || !reactFlowInstance || !shouldResetView) return undefined;

    const timer = setTimeout(() => {
      // Calcular el bounding box de todos los nodos
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        maxX = Math.max(maxX, node.position.x + 350); // Ancho del nodo aumentado
        minY = Math.min(minY, node.position.y);
        maxY = Math.max(maxY, node.position.y + 280); // Alto del nodo aumentado para fechas
      });

      const diagramWidth = maxX - minX;
      const diagramHeight = maxY - minY;

      // Obtener dimensiones del contenedor
      const container = document.querySelector('.react-flow') as HTMLElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calcular zoom para que quepa todo el ancho (85% del ancho disponible)
      const zoomToFitWidth = (containerWidth * 0.85) / diagramWidth;
      const zoomToFitHeight = (containerHeight * 0.8) / diagramHeight;
      const zoom = Math.min(zoomToFitWidth, zoomToFitHeight, 1); // Máximo zoom 1

      // Calcular posición X para centrar horizontalmente
      const x = (containerWidth - diagramWidth * zoom) / 2 - minX * zoom;

      // Posición Y fija en la parte superior con margen
      const y = 80;

      // Aplicar viewport usando la API de React Flow
      reactFlowInstance.setViewport({ x, y, zoom }, { duration: 300 });

      // Desactivar el reset automático después de la primera vez
      setShouldResetView(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [nodes, reactFlowInstance, shouldResetView]);

  // Handler para guardar/actualizar
  const handleModalSave = useCallback(() => {
    loadRootNodes();
    setOpenModal(false);
    setSelectedParentId(null);
  }, [loadRootNodes]);

  // Handler para resetear el diagrama a su estado inicial
  const handleResetDiagram = useCallback(() => {
    // Regenerar nodos y edges desde rootNodes
    generateNodesAndEdges();
    // Activar el reset de vista automático
    setShouldResetView(true);
  }, [generateNodesAndEdges]);

  // Handler para restaurar la vista inicial (todos los nodos visibles desde arriba)
  const handleResetView = useCallback(() => {
    if (!reactFlowInstance || nodes.length === 0) return;

    // Calcular el bounding box de todos los nodos
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + 350); // Ancho del nodo aumentado
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + 280); // Alto del nodo aumentado para fechas
    });

    const diagramWidth = maxX - minX;
    const diagramHeight = maxY - minY;

    // Obtener dimensiones del contenedor
    const container = document.querySelector('.react-flow') as HTMLElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calcular zoom para que quepa todo el ancho (85% del ancho disponible)
    const zoomToFitWidth = (containerWidth * 0.85) / diagramWidth;
    const zoomToFitHeight = (containerHeight * 0.8) / diagramHeight;
    const zoom = Math.min(zoomToFitWidth, zoomToFitHeight, 1); // Máximo zoom 1

    // Calcular posición X para centrar horizontalmente
    const x = (containerWidth - diagramWidth * zoom) / 2 - minX * zoom;

    // Posición Y fija en la parte superior con margen
    const y = 80;

    // Aplicar viewport usando la API de React Flow con animación
    reactFlowInstance.setViewport({ x, y, zoom }, { duration: 400 });
  }, [reactFlowInstance, nodes]);

  if (loading) {
    return (
      <Card
        sx={{
          width: '100%',
          height: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('data.diagram.messages.loading')}
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card
        sx={{
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.neutral',
          ...sx,
        }}
      >
        {/* Header con botón de agregar */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={2}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: theme.palette.success.main,
                  animation: 'blink 2s ease-in-out infinite',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                  },
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {rootNodes.length} {rootNodes.length === 1 ? t('data.diagram.node.singular') : t('data.diagram.node.plural')}
              </Typography>
            </Stack>
          </Paper>

          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => handleAddChild(0)}
            sx={{
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              '&:hover': {
                boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
              },
            }}
          >
            {t('data.diagram.addDiagram')}
          </Button>
        </Box>

        {/* Canvas de React Flow */}
        <Box
          sx={{
            width: '100%',
            height: 800,
            position: 'relative',
          }}
        >
          {/* Loader global durante la expansión */}
          {loadingExpand && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.background.paper, 0.7),
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
              }}
            >
              <Paper
                elevation={8}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <CircularProgress size={48} thickness={4} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t('data.diagram.messages.loadingExpand')}
                </Typography>
              </Paper>
            </Box>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onInit={setReactFlowInstance}
            minZoom={0.1}
            maxZoom={2}
            panOnScroll
            panOnDrag
            selectionOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch
            zoomOnDoubleClick
            preventScrolling={false}
            zoomActivationKeyCode="Control"
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              color={alpha(theme.palette.primary.main, 0.08)}
              gap={20}
              size={1.5}
              variant={BackgroundVariant.Dots}
            />
            {/* Controles personalizados de React Flow con tooltips */}
            <Box
              sx={{
                position: 'absolute',
                top: 96,
                left: 16,
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <Tooltip title={t('data.diagram.tooltips.zoomIn')} placement="right">
                <IconButton
                  onClick={() => reactFlowInstance?.zoomIn()}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.background.paper,
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <Iconify
                    icon="material-symbols-light:zoom-in"
                    width={20}
                    sx={{ color: theme.palette.text.primary }}
                  />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('data.diagram.tooltips.zoomOut')} placement="right">
                <IconButton
                  onClick={() => reactFlowInstance?.zoomOut()}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.background.paper,
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <Iconify
                    icon="material-symbols-light:zoom-out"
                    width={20}
                    sx={{ color: theme.palette.text.primary }}
                  />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('data.diagram.tooltips.fitView')} placement="right">
                <IconButton
                  onClick={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 400 })}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.background.paper,
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <Iconify
                    icon="iconoir:expand"
                    width={20}
                    sx={{ color: theme.palette.text.primary }}
                  />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('data.diagram.tooltips.lock')} placement="right">
                <IconButton
                  onClick={() => {
                    // Toggle interactividad
                    const currentInteractive = reactFlowInstance?.getNodes()[0]?.draggable ?? true;
                    reactFlowInstance?.setNodes(
                      reactFlowInstance.getNodes().map((node: Node) => ({
                        ...node,
                        draggable: !currentInteractive
                      }))
                    );
                  }}
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.background.paper,
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                >
                  <Iconify
                    icon="material-symbols:lock-outline"
                    width={20}
                    sx={{ color: theme.palette.text.primary }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
            <CustomControls
              onReset={handleResetDiagram}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              onResetView={handleResetView}
              // onOpenFilters={handleOpenFilterPopover}
            />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'addNode') return theme.palette.primary.light;
                return (node.data as any).color || theme.palette.grey[400];
              }}
              maskColor={alpha(theme.palette.background.paper, 0.85)}
              style={{
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                borderRadius: '12px',
                overflow: 'hidden',
                border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
              position="bottom-right"
            />
          </ReactFlow>
        </Box>

        {/* Controles de ayuda */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <Paper
            elevation={2}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="solar:magnifer-zoom-in-bold" width={14} sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  Ctrl + Rueda para zoom
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="eva:move-fill" width={14} sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  Scroll para desplazamiento
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* Estilos para los controles de React Flow */}
        <style>
          {`
            .react-flow__controls {
              box-shadow: 0 4px 12px ${alpha(theme.palette.common.black, 0.1)} !important;
            }
            
            .react-flow__controls-button {
              background-color: ${alpha(theme.palette.background.paper, 0.95)} !important;
              border: 1px solid ${alpha(theme.palette.divider, 0.1)} !important;
              border-radius: 8px !important;
              width: 36px !important;
              height: 36px !important;
              transition: all 0.2s ease !important;
            }
            
            .react-flow__controls-button:hover {
              background-color: ${theme.palette.background.paper} !important;
              transform: scale(1.05) !important;
              box-shadow: 0 4px 12px ${alpha(theme.palette.primary.main, 0.15)} !important;
              border-color: ${alpha(theme.palette.primary.main, 0.3)} !important;
            }
            
            .react-flow__controls-button svg {
              fill: ${theme.palette.text.primary} !important;
            }
          `}
        </style>
      </Card>

      {/* Modal para agregar nodos */}
      <DataDiagramFlowCreateModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedParentId(null);
        }}
        parentNodeId={selectedParentId || undefined}
        onSave={handleModalSave}
      />

      {/* Modal para editar nodos */}
      <DataDiagramFlowEditModal
        open={openEditModal}
        onClose={handleCloseEditModal}
        dataId={selectedNodeId || undefined}
        onSave={handleEditSave}
      />

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t('data.diagram.actions.delete')} {deleteDialog.name}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('data.diagram.dialogs.delete.title', { name: deleteDialog.name })}
          </Typography>
          <Typography>
            {t('data.diagram.dialogs.delete.content')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            {t('data.diagram.actions.cancel')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            {t('data.diagram.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal del diagrama/mapa */}
      <Dialog
        open={diagramModal.open}
        onClose={handleCloseDiagramModal}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            pb: 2,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:map-point-bold"
                width={24}
                sx={{ color: 'info.main' }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('data.diagram.dialogs.map.title') || 'Mapa de Relaciones'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {diagramModal.nodeLabel}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={handleCloseDiagramModal}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Iconify icon="solar:close-circle-bold" width={24} />
          </IconButton>
        </DialogTitle>
        <DialogContent 
          sx={{ 
            p: 0, 
            height: '100%', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {diagramModal.dataId && (
            <Box sx={{ flex: 1, position: 'relative' }}>
              <DataTableDiagram
                dataId={diagramModal.dataId}
                sx={{ height: '100%', borderRadius: 0 }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Popover de filtros */}
      {/* <ApplicationFiltersPopover
        anchorEl={filterAnchorEl}
        open={openFilterPopover}
        onClose={handleCloseFilterPopover}
        onApplyFilters={handleApplyFiltersInternal}
        selectedDomainId={selectedDomainIdProp}
        selectedTypeId={selectedTypeIdProp}
      /> */}
    </>
  );
}
