'use client';


import { useDebounce } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { useTranslate } from 'src/locales';
import { CreateRedemptionService } from 'src/services/rewards/redemption.service';
import { GetPointsByLoggedUserService } from 'src/services/security/users.service';
import { GetRewardsPaginationService } from 'src/services/rewards/rewards.service';
import { GetRewardCategoryPaginationService } from 'src/services/rewards/rewardCategory.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { RewardProductCard } from '../user-rewards-cards';

// ----------------------------------------------------------------------

export function UserRewardsView() {
  const { t } = useTranslate('rewards');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(15);
  const [userInfo, setUserInfo] = useState<{ points: number; level?: string; nextLevelPoints?: number }>({ points: 0 });

  // Cargar puntos del usuario al montar
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await GetPointsByLoggedUserService();
        setUserInfo({
          points: res.data.points ?? 0,
          level: res.data.level,
          nextLevelPoints: res.data.nextLevelPoints,
        });
      } catch (err) {
        setUserInfo({ points: 0 });
        console.error(err);
      }
    };
    fetchUserInfo();
  }, []);

  // Cargar categorías al montar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await GetRewardCategoryPaginationService({ page: 1, perPage: 15 });
        setCategories(res.data.data);
      } catch (err) {
        setCategories([]);
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Cargar productos cuando cambian filtros
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          perPage: rowsPerPage,
          // isActive: true,
        };
        if (debouncedSearchQuery) params.search = debouncedSearchQuery;
        if (selectedCategory) params.categoryRewardId = selectedCategory;
        
        const res = await GetRewardsPaginationService(params);
        setProducts(res.data.data);
        setMeta(res.data.meta);
      } catch (err) {
        setProducts([]);
        setMeta(null);
        console.error(err);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [debouncedSearchQuery, selectedCategory, page, rowsPerPage]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handlePriceRangeChange = useCallback((_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange([0, 1000]);
  }, []);

  const handleClaimProduct = useCallback(async (productId: string, productPoints?: number) => {
    if (productPoints !== undefined && userInfo.points < productPoints) {
      toast.error(t('userReward.messages.notEnoughPoints'));
      return;
    }
    try {
      await CreateRedemptionService({ rewardId: Number(productId) });
      toast.success(t('userReward.messages.claimSuccess'));
      // Actualizar puntos y productos
      const userRes = await GetPointsByLoggedUserService();
      setUserInfo({
        points: userRes.data.points ?? 0,
        level: userRes.data.level,
        nextLevelPoints: userRes.data.nextLevelPoints,
      });
      // Actualizar productos
      const params: any = {
        page,
        perPage: rowsPerPage,
      };
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (selectedCategory) params.categoryRewardId = selectedCategory;
      const prodRes = await GetRewardsPaginationService(params);
      setProducts(prodRes.data.data);
      setMeta(prodRes.data.meta);
    } catch (error: any) {
      const errorMsg = error?.message ? t(error.message) : t('userReward.messages.claimError');
      toast.error(errorMsg);
    }
  }, [t, userInfo.points, page, rowsPerPage, debouncedSearchQuery, selectedCategory]);


  const pointsPercentage = userInfo.nextLevelPoints ? (userInfo.points / userInfo.nextLevelPoints) * 100 : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header con información del usuario */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Iconify icon="solar:cup-star-bold" width={40} />
                <Typography variant="h4" fontWeight={700}>
                  {t('userReward.header.title')}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.95 }}>
                {t('userReward.header.subtitle')}
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('userReward.header.pointsAvailable')}
                  </Typography>
                  <Chip
                    label={userInfo.level ?? t('userReward.header.level')}
                    color="primary"
                    size="small"
                    icon={<Iconify icon="solar:verified-check-bold" width={16} />}
                  />
                </Box>
                <Typography variant="h3" color="primary.main" fontWeight={700}>
                  {userInfo.points}
                  <Typography component="span" variant="h6" color="text.secondary">
                    {' '}
                    {t('userReward.header.pointsShort')}
                  </Typography>
                </Typography>
                {userInfo.nextLevelPoints && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('userReward.header.nextLevel')}
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {userInfo.nextLevelPoints} {t('userReward.header.pointsShort')}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${pointsPercentage}%`,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Sidebar de filtros */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Stack spacing={3}>
            {/* Búsqueda */}
            <Card sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder={t('userReward.filters.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:eye-bold" width={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Card>

            {/* Filtros */}
            <Card sx={{ p: 2.5 }}>
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:list-bold" width={20} />
                  <Typography variant="h6" fontWeight={700}>
                    {t('userReward.filters.title')}
                  </Typography>
                </Box>

                {/* Categorías */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    {t('userReward.filters.category')}
                  </Typography>
                  <RadioGroup value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                    <FormControlLabel
                      key="all"
                      value=""
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">{t('userReward.filters.all')}</Typography>}
                      sx={{ width: '100%' }}
                    />
                    {categories.map((category) => (
                      <FormControlLabel
                        key={category.id}
                        value={category.id}
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">{category.name}</Typography>}
                        sx={{ width: '100%' }}
                      />
                    ))}
                  </RadioGroup>
                </Box>

                {/* Rango de puntos (no implementado aún) */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    {t('userReward.filters.rewardRange')}
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <Slider
                      value={priceRange}
                      onChange={handlePriceRangeChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={1000}
                      marks={[
                        { value: 0, label: t('userReward.filters.rangeMin') },
                        { value: 1000, label: t('userReward.filters.rangeMax') },
                      ]}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('userReward.filters.min')}: {priceRange[0]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('userReward.filters.max')}: {priceRange[1]}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Botón personalizar */}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Iconify icon="solar:settings-bold" />}
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none' }}
                >
                  {t('userReward.filters.customize')}
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Grid de productos */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Stack spacing={3}>
            {/* Header de resultados */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {loading
                  ? t('userReward.products.loading')
                  : t('userReward.products.productsFound', { count: products.length })}
              </Typography>
              {(searchQuery || selectedCategory !== '' || priceRange[0] !== 0 || priceRange[1] !== 1000) && (
                <Button
                  variant="text"
                  color="error"
                  startIcon={<Iconify icon="solar:close-circle-bold" />}
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none' }}
                >
                  {t('userReward.filters.clearFilters')}
                </Button>
              )}
            </Box>

            {/* Grid de productos */}
            {products.length > 0 ? (
              <>
                <Grid container spacing={3}>
                  {products.map((product: any) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={product.id}>
                      <RewardProductCard product={product} onClaim={handleClaimProduct} />
                    </Grid>
                  ))}
                </Grid>
                {/* Paginación */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={meta?.pageCount || 1}
                      page={page}
                      onChange={(_e, value) => setPage(value)}
                      sx={{ mt: 4, [`& .${paginationClasses.ul}`]: { justifyContent: 'center' } }}
                    />
                  </Box>
              </>
            ) : (
              <Paper
                sx={{
                  p: 8,
                  textAlign: 'center',
                  backgroundColor: 'grey.50',
                }}
              >
                <Iconify
                  icon="solar:inbox-bold"
                  width={80}
                  sx={{ color: 'grey.400', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('userReward.products.noProductsFound')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('userReward.products.noProductsDescription')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:restart-bold" />}
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none' }}
                >
                  {t('userReward.actions.resetFilters')}
                </Button>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}