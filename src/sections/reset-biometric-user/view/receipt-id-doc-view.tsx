import Box from '@mui/material/Box';

import { ReceiptIdDocumentForm } from '../receipt-id-document-form';

// ----------------------------------------------------------------------

export function ReceiptIdDocumentView() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 5,
        px: 2,
      }}
    >
      <ReceiptIdDocumentForm />
    </Box>
  );
}
