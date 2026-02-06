'use client';

import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';
import type { IconifyName } from 'src/components/iconify';

import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export type AuthSplitSectionProps = BoxProps & {
  title?: string;
  method?: string;
  imgUrl?: string;
  subtitle?: string;
  layoutQuery?: Breakpoint;
  methods?: {
    path: string;
    icon: string;
    label: string;
  }[];
};

// Feature item component
function FeatureItem({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: IconifyName;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <Box
      component={m.div}
      variants={varFade('inUp', { distance: 24 })}
      transition={{ delay }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={(theme) => ({
          width: 56,
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          background: `linear-gradient(135deg, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.2)}, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.05)})`,
          border: `1px solid ${varAlpha(theme.vars.palette.primary.mainChannel, 0.2)}`,
        })}
      >
        <Iconify icon={icon} width={28} sx={{ color: 'primary.main' }} />
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

export function AuthSplitSection({
  sx,
  layoutQuery = 'md',
  title = 'auth.greeting',
  subtitle = 'auth.slogan',
  ...other
}: AuthSplitSectionProps) {
  const { t } = useTranslate();

  const features: { icon: IconifyName; title: string; description: string }[] = [
    {
      icon: 'solar:shield-check-bold',
      title: t('authSection.features.security.title'),
      description: t('authSection.features.security.description'),
    },
    {
      icon: 'solar:chart-square-outline',
      title: t('authSection.features.analytics.title'),
      description: t('authSection.features.analytics.description'),
    },
    {
      icon: 'solar:users-group-rounded-bold',
      title: t('authSection.features.teamManagement.title'),
      description: t('authSection.features.teamManagement.description'),
    },
  ];

  return (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(135deg, ${varAlpha(theme.vars.palette.primary.darkerChannel, 0.95)}, ${varAlpha(theme.vars.palette.grey['900Channel'], 0.98)})`,
              `url(${CONFIG.assetsDir}/assets/background/background-3-blur.webp)`,
            ],
          }),
          px: 6,
          pb: 5,
          display: 'none',
          position: 'relative',
          pt: 'var(--layout-header-desktop-height)',
          overflow: 'hidden',
          [theme.breakpoints.up(layoutQuery)]: {
            width: '70%',
            gap: 5,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* Decorative elements */}
      <Box
        component={m.div}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        sx={(theme) => ({
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.15)}, transparent 70%)`,
          top: -150,
          right: -150,
          pointerEvents: 'none',
        })}
      />

      <Box
        component={m.div}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        sx={(theme) => ({
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${varAlpha(theme.vars.palette.info.mainChannel, 0.1)}, transparent 70%)`,
          bottom: -100,
          left: -100,
          pointerEvents: 'none',
        })}
      />

      <MotionContainer>
        {/* Header Section */}
        <Box component={m.div} variants={varFade('inDown', { distance: 24 })} sx={{ mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              color: 'common.white',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {t(title)}
          </Typography>

          {subtitle && (
            <Typography
              variant="h6"
              sx={{
                mt: 2,
                color: 'grey.400',
                fontWeight: 400,
              }}
            >
              {t(subtitle)}
            </Typography>
          )}
        </Box>

        {/* Features List */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 4,
            mt: 4,
            maxWidth: 700,
            '& .MuiTypography-root': {
              color: 'common.white',
            },
            '& .MuiTypography-body2': {
              color: 'grey.400',
            },
          }}
        >
          {features.map((feature, index) => (
            <FeatureItem
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={0.1 * (index + 1)}
            />
          ))}
        </Box>

        {/* Company logo or branding */}
        <Box
          component={m.div}
          variants={varFade('inUp', { distance: 24 })}
          sx={{
            mt: 'auto',
            pt: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Box
            component="img"
            src={`${CONFIG.assetsDir}/logo/logo-single.svg`}
            sx={{ width: 32, height: 32, opacity: 0.7 }}
          />
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            {t('authSection.trustedPlatform')}
          </Typography>
        </Box>
      </MotionContainer>
    </Box>
  );
}
