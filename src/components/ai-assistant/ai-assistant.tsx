'use client';

import Script from 'next/script';
import { useId, useState, useEffect } from 'react';

import { Box, Tooltip, IconButton } from '@mui/material';

import { Iconify } from 'src/components/iconify';

declare global {
  interface Window {
    initChatbot?: (containerId: string, opts: Record<string, any>) => void;
    destroyChatbot?: (containerId?: string) => void;
  }
}

type Props = {
  widgetId: string;
  containerId?: string;
  baseUrl?: string;
};

export default function AiAssistant({
  widgetId,
  containerId,
  baseUrl = process.env.NEXT_PUBLIC_WIDGET_BASE_URL
  ?? 'https://widget-assistant-test.kamilainnovation.co',
}: Props) {
  const autoId = useId().replace(/:/g, '_');
  const divId = containerId ?? `ai_assistant_${autoId}`;
  const cssHref = `${baseUrl.replace(/\/$/, '')}/chatbot-widget.css`;
  const scriptSrc = `${baseUrl.replace(/\/$/, '')}/widget.umd.js`;

  const [isOpen, setIsOpen] = useState(false);

  // Montaje defensivo si el script ya estaba en cache o precargado:
  useEffect(() => {
    if (typeof window !== 'undefined' && window.initChatbot && isOpen) {
      window.initChatbot(divId, { widgetId });
    }
    return () => {
      if (isOpen) {
        window.destroyChatbot?.(divId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botón flotante para abrir/cerrar el asistente */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Tooltip title={isOpen ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'}>
          <IconButton
            onClick={handleToggle}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              width: 56,
              height: 56,
            }}
          >
            <Iconify icon={isOpen ? 'solar:close-circle-bold' : 'tabler:robot'} width={24} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Contenedor del widget, solo visible cuando está abierto */}
      {isOpen && (
        <>
          <div id={divId} />

          {/* CSS del widget */}
          <link rel="stylesheet" href={cssHref} />

          {/* Script UMD y boot */}
          <Script
            src={scriptSrc}
            strategy="afterInteractive"
            onLoad={() => window.initChatbot?.(divId, { widgetId })}
          />
        </>
      )}
    </>
  );
}