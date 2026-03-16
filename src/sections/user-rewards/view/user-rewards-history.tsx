'use client';

import type { IRewardHistoryItem, IRatingDialogState, IDetailsDialogState } from 'src/types/rewards';

import { useDebounce } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { useTranslate } from 'src/locales';
import { SaveRewardsRateService } from 'src/services/rewards/rewards.service';
import { GetPointsByLoggedUserService } from 'src/services/security/users.service';
import { GetRedemptionEmployeeHistoryService } from 'src/services/rewards/redemption.service';
import { GetRewardCategoryPaginationService } from 'src/services/rewards/rewardCategory.service';

import { Image } from 'src/components/image';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { RewardHistoryCard } from '../user-rewards-history-card';

// ----------------------------------------------------------------------

export function UserRewardsHistoryView() {
  const { t } = useTranslate('rewards');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [historyItems, setHistoryItems] = useState<IRewardHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [userInfo, setUserInfo] = useState<{ points: number; level?: string; nextLevelPoints?: number }>({ points: 0 });
  
  // Rating dialog state
  const [ratingDialog, setRatingDialog] = useState<IRatingDialogState>({
    open: false,
    item: null,
    rating: 0,
    comment: '',
  });

  // Details dialog state
  const [detailsDialog, setDetailsDialog] = useState<IDetailsDialogState>({
    open: false,
    item: null,
  });

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

  // Cargar historial cuando cambian filtros o paginación
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const params: any = {
          page,
          perPage: rowsPerPage,
        };
        
        if (debouncedSearchQuery) params.search = debouncedSearchQuery;
        if (selectedCategory) params.categoryRewardId = selectedCategory;
        
        const res = await GetRedemptionEmployeeHistoryService(params);
        setHistoryItems(res.data.data || []);
        setMeta(res.data.meta);
      } catch (err) {
        setHistoryItems([]);
        setMeta(null);
        console.error(err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [page, rowsPerPage, debouncedSearchQuery, selectedCategory]);

  // Abrir dialog de rating
  const handleOpenRatingDialog = useCallback((item: IRewardHistoryItem) => {
    setRatingDialog({
      open: true,
      item,
      rating: item.myRating || 0,
      comment: '',
    });
  }, []);

  // Cerrar dialog de rating
  const handleCloseRatingDialog = useCallback(() => {
    setRatingDialog({
      open: false,
      item: null,
      rating: 0,
      comment: '',
    });
  }, []);

  // Guardar rating
  const handleSaveRating = useCallback(async () => {
    if (!ratingDialog.item) return;

    try {
      await SaveRewardsRateService({
        rewardId: Number(ratingDialog.item.rewardId),
        rating: ratingDialog.rating,
        comment: ratingDialog.comment,
      });

      // Actualizar el item en la lista
      setHistoryItems(prev => prev.map(item => 
        item.historyId === ratingDialog.item!.historyId 
          ? { ...item, myRating: ratingDialog.rating }
          : item
      ));

      toast.success(t('userReward.rating.success'));
      handleCloseRatingDialog();
    } catch (error: any) {
      const errorMsg = error?.message ? t(error.message) : t('userReward.rating.error');
      toast.error(errorMsg);
    }
  }, [ratingDialog, t, handleCloseRatingDialog]);

  // Abrir dialog de detalles
  const handleOpenDetailsDialog = useCallback((item: IRewardHistoryItem) => {
    setDetailsDialog({
      open: true,
      item,
    });
  }, []);

  // Cerrar dialog de detalles
  const handleCloseDetailsDialog = useCallback(() => {
    setDetailsDialog({
      open: false,
      item: null,
    });
  }, []);

  // Handlers para filtros
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setPage(1); // Reset page when filter changes
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setPage(1);
  }, []);

  const pointsPercentage = userInfo.nextLevelPoints ? (userInfo.points / userInfo.nextLevelPoints) * 100 : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header con información del usuario */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Iconify icon="solar:clock-circle-bold" width={40} />
                <Typography variant="h4" fontWeight={700}>
                  {t('userReward.history.title')}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.95 }}>
                {t('userReward.history.subtitle')}
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
                    {t('userReward.history.rewardsRedeemed')}
                  </Typography>
                  <Chip
                    label={userInfo.level ?? t('userReward.header.level')}
                    color="success"
                    size="small"
                    icon={<Iconify icon="solar:verified-check-bold" width={16} />}
                  />
                </Box>
                <Typography variant="h3" color="success.main" fontWeight={700}>
                  {meta?.itemCount || 0}
                  <Typography component="span" variant="h6" color="text.secondary">
                    {' '}
                    {t('userReward.history.rewardsCount')}
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
                          background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
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

                {/* Categorías (placeholder para futuro) */}
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

                {/* Botón limpiar filtros */}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Iconify icon="solar:restart-bold" />}
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none' }}
                >
                  {t('userReward.filters.clearFilters')}
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Grid de historial */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Stack spacing={3}>
            {/* Header de resultados */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {loading
                  ? t('userReward.history.loading')
                  : t('userReward.history.itemsFound', { count: historyItems.length })}
              </Typography>
              {searchQuery && (
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

        {/* Grid de items del historial */}
        {historyItems.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {historyItems.map((item) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={item.historyId}>
                  <RewardHistoryCard 
                    item={item} 
                    onRate={handleOpenRatingDialog}
                    onDetails={handleOpenDetailsDialog}
                  />
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
              icon="solar:clock-circle-bold"
              width={80}
              sx={{ color: 'grey.400', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('userReward.history.noItemsFound')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('userReward.history.noItemsDescription')}
            </Typography>
          </Paper>
        )}
          </Stack>
        </Grid>
      </Grid>

      {/* Rating Dialog */}
      <Dialog
        open={ratingDialog.open}
        onClose={handleCloseRatingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Iconify icon="solar:star-bold" />
            {t('userReward.rating.title')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {ratingDialog.item && (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Typography variant="h6" textAlign="center">
                {ratingDialog.item.name}
              </Typography>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('userReward.rating.instruction')}
                </Typography>
                <Rating
                  size="large"
                  value={ratingDialog.rating}
                  onChange={(_, value) => 
                    setRatingDialog((prev: any) => ({ ...prev, rating: value || 0 }))
                  }
                />
                {ratingDialog.rating > 0 && (
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    color="primary.main"
                    sx={{ mt: 1 }}
                  >
                    {ratingDialog.rating === 1 && t('userReward.rating.veryBad')}
                    {ratingDialog.rating === 2 && t('userReward.rating.bad')}
                    {ratingDialog.rating === 3 && t('userReward.rating.regular')}
                    {ratingDialog.rating === 4 && t('userReward.rating.good')}
                    {ratingDialog.rating === 5 && t('userReward.rating.veryGood')}
                  </Typography>
                )}
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('userReward.rating.comment')}
                placeholder={t('userReward.rating.commentPlaceholder')}
                value={ratingDialog.comment}
                onChange={(e) => 
                  setRatingDialog((prev: any) => ({ ...prev, comment: e.target.value }))
                }
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRatingDialog}>
            {t('actions.cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveRating}
            disabled={ratingDialog.rating === 0}
          >
            {t('actions.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={handleCloseDetailsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Iconify icon="solar:info-circle-bold" />
            {t('userReward.details.title')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.item && (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Typography variant="h6" textAlign="center">
                {detailsDialog.item.name}
              </Typography>
              
              {detailsDialog.item.imageUrl && (
                <Box sx={{ textAlign: 'center' }}>
                  <Image
                    src={detailsDialog.item.imageUrl}
                    alt={detailsDialog.item.name}
                    sx={{ 
                      width: 200, 
                      height: 200, 
                      borderRadius: 2,
                      mx: 'auto'
                    }}
                  />
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('userReward.details.points')}:
                </Typography>
                <Chip
                  icon={<Iconify icon="solar:cup-star-bold" width={16} />}
                  label={`${detailsDialog.item.points} ${t('userReward.header.pointsShort')}`}
                  color="warning"
                  variant="outlined"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('userReward.details.redeemedAt')}:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(detailsDialog.item.redeemedAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog} variant="contained">
            {t('userReward.actions.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
