'use client';

import type { IRewardHistoryItem } from 'src/types/rewards';

import {
  Box,
  Card,
  Stack,
  Rating,
  Tooltip,
  IconButton,
  Typography,
} from '@mui/material';

import { useTranslate } from 'src/locales';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------
interface RewardHistoryCardProps {
  item: IRewardHistoryItem;
  onRate?: (item: IRewardHistoryItem) => void;
  onDetails?: (item: IRewardHistoryItem) => void;
}

export const RewardHistoryCard = ({ item, onRate, onDetails }: RewardHistoryCardProps) => {
  const { t } = useTranslate('rewards');

  const handleRate = () => {
    if (onRate) {
      onRate(item);
    }
  };

  const handleDetails = () => {
    if (onDetails) {
      onDetails(item);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      {/* Puntos usados */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1,
          backgroundColor: 'warning.main',
          color: 'warning.contrastText',
          borderRadius: 2,
          px: 1.5,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          boxShadow: 2,
        }}
      >
        <Iconify icon="solar:cup-star-bold" width={18} />
        <Typography variant="subtitle2" fontWeight={700}>
          {item.points} {t('userReward.header.pointsShort')}
        </Typography>
      </Box>



      {/* Imagen del producto */}
      <Box
        sx={{
          position: 'relative',
          pt: '75%',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          overflow: 'hidden',
        }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            ratio="1/1"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/assets/icons/empty/ic-content.svg"
              alt="Sin imagen"
              style={{ width: 80, height: 80, opacity: 0.7 }}
            />
          </Box>
        )}
      </Box>



      {/* Contenido */}
      <Stack spacing={1.5} sx={{ p: 2, pt: 1, flexGrow: 1 }}>
        {/* Título */}
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
          {item.name}
        </Typography>

        {/* Fecha de canje */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Iconify icon="solar:calendar-date-bold" width={16} sx={{ color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {new Date(item.redeemedAt).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Typography>
        </Box>

        {/* Rating interactivo y botón de información */}
        <Box sx={{ mt: 'auto !important' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {t('userReward.rating.current')}:
          </Typography>
          
          {/* Contenedor horizontal para rating y botón de info */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tooltip 
              title={item.myRating 
                ? t('userReward.rating.edit') 
                : t('userReward.rating.rate')
              }
              placement="top"
            >
              <Box
                onClick={handleRate}
                sx={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  p: 1,
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'warning.lighter',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Rating 
                  value={item.myRating || 0} 
                  readOnly 
                  size="medium"
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: 'warning.main',
                    },
                    '& .MuiRating-iconEmpty': {
                      color: 'grey.300',
                    },
                  }}
                />
              </Box>
            </Tooltip>
            
            {/* Botón de información */}
            <Tooltip title={t('userReward.actions.viewDetails')} placement="top">
              <IconButton
                onClick={handleDetails}
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: 'primary.main',
                  width: 36,
                  height: 36,
                  '&:hover': {
                    backgroundColor: 'primary.lighter',
                    color: 'primary.dark',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
                size="small"
              >
                <Iconify icon="solar:info-circle-bold" width={18} />
              </IconButton>
            </Tooltip>
          </Box>
          
          {!item.myRating && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                display: 'block', 
                textAlign: 'center', 
                mt: 0.5,
                fontStyle: 'italic'
              }}
            >
              {t('userReward.rating.tapToRate')}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
};