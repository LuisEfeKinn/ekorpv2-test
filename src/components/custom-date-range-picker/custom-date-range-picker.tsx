'use client';

import type { Dayjs } from 'dayjs';
import type { PaperProps } from '@mui/material/Paper';
import type { DialogProps } from '@mui/material/Dialog';
import type { UseDateRangePickerReturn } from './use-date-range-picker';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormHelperText from '@mui/material/FormHelperText';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateCalendar, dateCalendarClasses } from '@mui/x-date-pickers/DateCalendar';

// ----------------------------------------------------------------------

export type CustomDateRangePickerProps = DialogProps &
  UseDateRangePickerReturn & {
    onSubmit?: () => void;
    onClear?: () => void;
    errorMessage?: string;
    cancelLabel?: string;
    applyLabel?: string;
    clearLabel?: string;
    minDate?: Dayjs;
  };

export function CustomDateRangePicker({
  open,
  error,
  onClose,
  onSubmit,
  onClear,
  /********/
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  /********/
  slotProps,
  variant = 'input',
  title = 'Select date range',
  errorMessage = 'End date must be later than start date',
  cancelLabel = 'Cancel',
  applyLabel = 'Apply',
  clearLabel = 'Clear',
  minDate,
  ...other
}: CustomDateRangePickerProps) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const isCalendarView = mdUp && variant === 'calendar';

  const handleSubmit = useCallback(() => {
    onClose();
    onSubmit?.();
  }, [onClose, onSubmit]);

  const dialogPaperSx = (slotProps?.paper as PaperProps)?.sx;

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth={isCalendarView ? false : 'xs'}
      slotProps={{
        ...slotProps,
        paper: {
          ...slotProps?.paper,
          sx: [
            { ...(isCalendarView && { maxWidth: 720 }) },
            ...(Array.isArray(dialogPaperSx) ? dialogPaperSx : [dialogPaperSx]),
          ],
        },
      }}
      {...other}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent
        sx={[
          (theme) => ({
            display: 'flex',
            overflow: 'unset',
            flexDirection: 'column',
            gap: 1,
            [`& .${dateCalendarClasses.root}`]: {
              borderRadius: 2,
              border: `dashed 1px ${theme.vars.palette.divider}`,
            },
          }),
        ]}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isCalendarView ? 'row' : 'column',
            gap: 3,
          }}
        >
          {isCalendarView ? (
            <>
              <DateCalendar value={startDate} onChange={onChangeStartDate} minDate={minDate} />
              <DateCalendar
                value={endDate}
                onChange={onChangeEndDate}
                minDate={startDate ? startDate.add(1, 'day') : undefined}
              />
            </>
          ) : (
            <>
              <DatePicker label="Start date" value={startDate} onChange={onChangeStartDate} minDate={minDate} />
              <DatePicker
                label="End date"
                value={endDate}
                onChange={onChangeEndDate}
                minDate={startDate ? startDate.add(1, 'day') : undefined}
              />
            </>
          )}
        </Box>

        {error && (
          <FormHelperText error sx={{ px: 2 }}>
            {errorMessage}
          </FormHelperText>
        )}
      </DialogContent>

      <DialogActions>
        {onClear && (
          <Button variant="soft" color="error" onClick={onClear} sx={{ mr: 'auto' }}>
            {clearLabel}
          </Button>
        )}
        <Button variant="outlined" color="inherit" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button disabled={error} variant="contained" onClick={handleSubmit}>
          {applyLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
