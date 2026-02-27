'use client';

import type { FC } from 'react';
import type { IReward } from 'src/types/rewards';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Typography,
  LinearProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface RewardProductCardProps {
  product: IReward;
  pointsRequired?: number;
  onClaim?: (productId: string, pointsRequired: number) => void;
}

export const RewardProductCard: FC<RewardProductCardProps> = ({ product, onClaim }) => {
  const { t } = useTranslate('rewards');
  const stock = product.stockAvailable ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock < 5 && stock > 0;
  const stockPercentage = 100;

  const handleClaim = () => {
    if (onClaim && !isOutOfStock) {
      onClaim(product.id, product.pointsRequired);
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
          transform: 'translateY(-8px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      {/* Badge superior */}
      {/* {product.badge && (
        <Chip
          label={product.badge}
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
            fontWeight: 700,
            fontSize: '0.7rem',
          }}
        />
      )} */}

      {/* Puntos requeridos */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
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
          {product.pointsRequired} {t('userReward.header.pointsShort')}
        </Typography>
      </Box>
      {/* Imagen del producto o placeholder personalizado */}
      <Box
        sx={{
          position: 'relative',
          pt: '75%',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          overflow: 'hidden',
        }}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            ratio="1/1"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isOutOfStock ? 'grayscale(100%)' : 'none',
              opacity: isOutOfStock ? 0.5 : 1,
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
        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'error.main',
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: 1,
              fontWeight: 700,
            }}
          >
            {t('userReward.products.outOfStock')}
          </Box>
        )}
      </Box>
       {/* Categoría */}
      <Box
        sx={{
          px: 2,
          pt: 2,
          pb: 0.5,
        }}
      >
        <Chip
          label={product.categoryReward?.name?.toUpperCase() ?? ''}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.65rem',
            height: 20,
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Contenido */}
      <Stack spacing={1.5} sx={{ p: 2, pt: 1, flexGrow: 1 }}>
        {/* Título */}
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
          {product.name}
        </Typography>

        {/* Rating */}
        {/* {product.rating > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={product.rating} readOnly size="small" precision={0.5} />
            <Typography variant="caption" color="text.secondary">
              ({product.rating})
            </Typography>
          </Box>
        )} */}

        {/* Descripción */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.5,
            minHeight: '3em',
          }}
        >
          {product.description}
        </Typography>

        {/* Stock */}
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              <Iconify
                icon="solar:box-minimalistic-bold"
                width={14}
                sx={{ mr: 0.5, verticalAlign: 'middle' }}
              />
              {t('userReward.products.stockAvailable')}
            </Typography>
            <Typography
              variant="caption"
              fontWeight={700}
              color={isLowStock ? 'error.main' : 'text.primary'}
            >
              {stock}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stockPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: isLowStock ? 'error.main' : 'success.main',
                borderRadius: 3,
              },
            }}
          />
        </Stack>

        {/* Botón de reclamar */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isOutOfStock}
          onClick={handleClaim}
          startIcon={<Iconify icon="solar:cart-3-bold" />}
          sx={{
            mt: 'auto !important',
            fontWeight: 700,
            py: 1.2,
            borderRadius: 1.5,
            textTransform: 'none',
            fontSize: '0.95rem',
          }}
        >
          {isOutOfStock ? t('userReward.products.outOfStock') : t('userReward.products.claim')}
        </Button>
      </Stack>
    </Card>
  );
};
