'use client';

import type { IEvaluationData } from 'src/types/performance';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleButton from '@mui/material/ToggleButton';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

type Props = {
	evaluationData: IEvaluationData | null;
	loading: boolean;
	onSaveAnswer: (answer: any) => Promise<void>;
	assignmentId: string;
};

export function EvaluationResponseObjectivesCanva({
	evaluationData,
	loading,
	onSaveAnswer,
}: Props) {
	const theme = useTheme();
	const router = useRouter();
	const { t } = useTranslate('performance');
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
	const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(0);
	const [selectedScaleLevel, setSelectedScaleLevel] = useState<string | null>(null);
	const [achievedValue, setAchievedValue] = useState<string>('');
	const [comments, setComments] = useState('');
	const [saving, setSaving] = useState(false);

	const objectives = evaluationData?.sections?.objectives || [];
	const currentObjective = objectives[currentObjectiveIndex];
	const isObjectiveAnswered = currentObjective?.currentAnswer !== null && 
		currentObjective?.currentAnswer?.scaleLevelId !== null &&
		currentObjective?.currentAnswer?.scaleLevelId !== 0;

	// Calcular estadísticas globales
	const totalObjectives = objectives.length;
	const completedObjectives = objectives.filter((obj: any) => 
		obj.currentAnswer !== null && 
		obj.currentAnswer?.scaleLevelId !== null &&
		obj.currentAnswer?.scaleLevelId !== 0
	).length;
	const completionPercentage = totalObjectives > 0 
		? Math.round((completedObjectives / totalObjectives) * 100) 
		: 0;

	// Inicializar respuesta actual cuando cambia el objetivo
	React.useEffect(() => {
		if (currentObjective?.currentAnswer) {
			if (currentObjective.currentAnswer.scaleLevelId) {
				setSelectedScaleLevel(String(currentObjective.currentAnswer.scaleLevelId));
			} else {
				setSelectedScaleLevel(null);
			}
			setComments(currentObjective.currentAnswer.comments || '');
			setAchievedValue(currentObjective.achievedValue?.toString() || '');
		} else {
			setSelectedScaleLevel(null);
			setComments('');
			setAchievedValue('');
		}
	}, [currentObjective]);

	const handleStartEvaluation = (index: number) => {
		setCurrentObjectiveIndex(index);
		setViewMode('detail');
	};

	const handleBackToSummary = () => {
		setViewMode('summary');
	};

	const handleSaveAndNext = async () => {
		// Si el objetivo ya fue respondido, solo avanzar
		if (isObjectiveAnswered) {
			if (currentObjectiveIndex < objectives.length - 1) {
				setCurrentObjectiveIndex(currentObjectiveIndex + 1);
			} else {
				// Si es el último objetivo, volver al resumen
				setViewMode('summary');
			}
			return;
		}

		// Validar que se haya seleccionado una escala
		if (!selectedScaleLevel) {
			toast.warning(t('evaluation-responses.objectives.messages.selectScale'));
			return;
		}

		// Validar que se haya ingresado un valor alcanzado
		if (!achievedValue || achievedValue.trim() === '') {
			toast.warning(t('evaluation-responses.objectives.messages.enterAchievedValue'));
			return;
		}

		try {
			setSaving(true);

			await onSaveAnswer({
				objectiveId: Number(currentObjective.objectiveId),
				scaleLevelId: Number(selectedScaleLevel),
				achievedValue: Number(achievedValue),
				comments: comments || undefined,
			});

			// Avanzar a la siguiente pregunta o volver al resumen
			if (currentObjectiveIndex < objectives.length - 1) {
				setCurrentObjectiveIndex(currentObjectiveIndex + 1);
			} else {
				setViewMode('summary');
			}
		} catch (error: any) {
			console.error('Error saving answer:', error);
			toast.error(t(error?.message) || t('evaluation-responses.messages.error.savingAnswer'));
		} finally {
			setSaving(false);
		}
	};

	const handlePrevious = () => {
		if (currentObjectiveIndex > 0) {
			setCurrentObjectiveIndex(currentObjectiveIndex - 1);
		}
	};

	if (loading) {
		return <LoadingScreen />;
	}

	if (!evaluationData) {
		return <EmptyContent filled title={t('evaluation-responses.messages.noData')} />;
	}

	if (!objectives || objectives.length === 0) {
		return <EmptyContent filled title={t('evaluation-responses.objectives.messages.noObjectives')} />;
	}

	// VISTA DE RESUMEN
	if (viewMode === 'summary') {
		return (
			<Box>
				{/* Información general */}
				<Paper sx={{ p: 3, mb: 3 }}>
					<Stack direction="row" alignItems="center" spacing={2}>
						<Iconify icon="solar:user-rounded-bold" width={24} />
						<Box>
							<Typography variant="h5">{evaluationData.campaign.name}</Typography>
							<Typography variant="body2" color="text.secondary">
								{t('evaluation-responses.objectives.evaluating')}: {evaluationData.participant.fullName}
							</Typography>
						</Box>
					</Stack>
				</Paper>

			<Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
				{/* Card de Rendimiento Global */}
				<Box sx={{ flex: { xs: '1 1 100%', md: '0 0 40%' } }}>
						<Card
							sx={{
								p: 4,
								background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
								color: 'white',
								position: 'relative',
								overflow: 'hidden',
								height: '100%',
							}}
						>
							{/* Icono decorativo */}
							<Box
								sx={{
									position: 'absolute',
									top: -20,
									right: -20,
									opacity: 0.1,
								}}
							>
								<Iconify icon="solar:medal-star-bold" width={180} />
							</Box>

							<Box sx={{ position: 'relative', zIndex: 1 }}>
								<Typography variant="h6" sx={{ mb: 3 }}>
									{t('evaluation-responses.objectives.globalPerformance')}
								</Typography>

								<Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>
									{evaluationData.sections?.objectivesTotalScore?.toFixed(0) || 0}%
								</Typography>

								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
									<Iconify icon="solar:check-circle-bold" width={20} />
									<Typography variant="body2">
										{completedObjectives} {t('evaluation-responses.objectives.objectivesEvaluated')}
									</Typography>
								</Stack>

								<LinearProgress
									variant="determinate"
									value={completionPercentage}
									sx={{
										mt: 2,
										height: 8,
										borderRadius: 1,
										bgcolor: alpha('#fff', 0.3),
										'& .MuiLinearProgress-bar': {
											bgcolor: 'white',
											borderRadius: 1,
										},
									}}
								/>
							</Box>
						</Card>
				</Box>

				{/* Distribución de Objetivos */}
				<Box sx={{ flex: { xs: '1 1 100%', md: '1 1 60%' } }}>
						<Paper sx={{ p: 3, height: '100%' }}>
							<Typography variant="h6" sx={{ mb: 3 }}>
								{t('evaluation-responses.objectives.objectivesDistribution')}
							</Typography>

							<Stack spacing={2}>
								{objectives.map((objective: any, index: number) => {
									const isAnswered = objective.currentAnswer !== null && 
										objective.currentAnswer?.scaleLevelId !== null &&
										objective.currentAnswer?.scaleLevelId !== 0;
									const compliancePercentage = objective.compliancePercentage || 0;
									const complianceColor = 
										compliancePercentage >= 90 ? theme.palette.success.main :
										compliancePercentage >= 70 ? theme.palette.warning.main :
										theme.palette.error.main;

									return (
										<Box
											key={objective.objectiveId}
											onClick={() => handleStartEvaluation(index)}
											sx={{
												p: 2,
												borderRadius: 2,
												border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
												cursor: 'pointer',
												transition: 'all 0.2s',
												bgcolor: isAnswered ? alpha(theme.palette.success.main, 0.04) : 'transparent',
												'&:hover': {
													bgcolor: alpha(theme.palette.primary.main, 0.04),
													borderColor: theme.palette.primary.main,
													transform: 'translateY(-2px)',
													boxShadow: theme.customShadows.z8,
												},
											}}
										>
											<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
												<Stack direction="row" alignItems="center" spacing={2} flex={1}>
													<Box
														sx={{
															width: 32,
															height: 32,
															borderRadius: '50%',
															bgcolor: isAnswered 
																? alpha(theme.palette.success.main, 0.1)
																: alpha(theme.palette.primary.main, 0.1),
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													>
														{isAnswered ? (
															<Iconify 
																icon="solar:check-circle-bold" 
																width={20} 
																sx={{ color: theme.palette.success.main }} 
															/>
														) : (
															<Typography 
																variant="caption" 
																fontWeight={700}
																color="primary.main"
															>
																{index + 1}
															</Typography>
														)}
													</Box>

													<Box flex={1}>
														<Typography variant="subtitle2">
															{objective.name}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															{t('evaluation-responses.objectives.weight')}: {objective.weight}%
														</Typography>
													</Box>
												</Stack>

												<Box sx={{ minWidth: 120 }}>
													{isAnswered ? (
														<Typography 
															variant="h6" 
															color={complianceColor}
															fontWeight={700}
														>
															{compliancePercentage.toFixed(0)}%
														</Typography>
													) : (
														<Typography variant="caption" color="text.secondary">
															{t('evaluation-responses.objectives.pending')}
														</Typography>
													)}
												</Box>
											</Stack>

											{/* Barra de progreso */}
											{isAnswered && (
												<LinearProgress
													variant="determinate"
													value={Math.min(compliancePercentage, 100)}
													sx={{
														mt: 1.5,
														height: 6,
														borderRadius: 1,
														'& .MuiLinearProgress-bar': {
															bgcolor: complianceColor,
														},
													}}
												/>
											)}
										</Box>
									);
								})}
							</Stack>

							<Button
								fullWidth
								variant="outlined"
								size="large"
								sx={{ mt: 3 }}
								onClick={() => router.push(paths.dashboard.performance.evaluationResponses)}
							>
								{t('evaluation-responses.objectives.backToList')}
							</Button>
						</Paper>
				</Box>
			</Stack>
		</Box>
	);
}

// VISTA DE DETALLE
return (
	<Box>
			{/* Barra de progreso superior con mini indicadores */}
			<Paper sx={{ p: 2, mb: 3 }}>
				<Stack direction="row" spacing={0.5}>
					{objectives.map((objective: any, index: number) => {
						const isAnswered = objective.currentAnswer !== null && 
							objective.currentAnswer?.scaleLevelId !== null &&
							objective.currentAnswer?.scaleLevelId !== 0;
						const isCurrent = index === currentObjectiveIndex;

						return (
							<Tooltip key={objective.objectiveId} title={objective.name}>
								<Box
									onClick={() => setCurrentObjectiveIndex(index)}
									sx={{
										flex: 1,
										height: 8,
										borderRadius: 1,
										cursor: 'pointer',
										transition: 'all 0.2s',
										bgcolor: isAnswered
											? theme.palette.success.main
											: isCurrent
												? theme.palette.primary.main
												: alpha(theme.palette.grey[500], 0.2),
									}}
								/>
							</Tooltip>
						);
					})}
				</Stack>
			</Paper>

		<Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
			{/* Sidebar compacto */}
			{!isMobile && (
				<Box sx={{ flex: { xs: '1 1 100%', md: '0 0 25%' } }}>
						<Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
							<Typography variant="subtitle2" sx={{ mb: 2 }}>
								{t('evaluation-responses.objectives.objectivesList')}
							</Typography>
							<Stack spacing={1}>
								{objectives.map((objective: any, index: number) => {
									const isAnswered = objective.currentAnswer !== null && 
										objective.currentAnswer?.scaleLevelId !== null &&
										objective.currentAnswer?.scaleLevelId !== 0;
									const isCurrent = index === currentObjectiveIndex;

									return (
										<Box
											key={objective.objectiveId}
											onClick={() => setCurrentObjectiveIndex(index)}
											sx={{
												p: 1.5,
												borderRadius: 1.5,
												border: `1px solid ${alpha(theme.palette.grey[500], isCurrent ? 0.3 : 0.1)}`,
												bgcolor: isCurrent 
													? alpha(theme.palette.primary.main, 0.08)
													: 'transparent',
												cursor: 'pointer',
												transition: 'all 0.2s',
												'&:hover': {
													bgcolor: alpha(theme.palette.primary.main, 0.04),
												},
											}}
										>
											<Stack direction="row" alignItems="center" spacing={1.5}>
												<Box
													sx={{
														width: 24,
														height: 24,
														borderRadius: '50%',
														bgcolor: isAnswered 
															? theme.palette.success.main
															: isCurrent
																? theme.palette.primary.main
																: alpha(theme.palette.grey[500], 0.2),
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}
												>
													{isAnswered ? (
														<Iconify 
															icon="solar:check-circle-bold" 
															width={14} 
															sx={{ color: 'white' }} 
														/>
													) : (
														<Typography variant="caption" fontSize={10} fontWeight={700} color="white">
															{index + 1}
														</Typography>
													)}
												</Box>
												<Box flex={1} sx={{ minWidth: 0 }}>
													<Typography 
														variant="caption" 
														noWrap 
														fontWeight={isCurrent ? 600 : 400}
														color={isCurrent ? 'primary.main' : 'text.primary'}
													>
														{objective.name}
													</Typography>
												</Box>
											</Stack>
											<Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
												{objective.weight}%
											</Typography>
										</Box>
									);
								})}
							</Stack>

							<Button
								fullWidth
								variant="text"
								size="small"
								startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
								onClick={handleBackToSummary}
								sx={{ mt: 2 }}
							>
								{t('evaluation-responses.objectives.backToSummary')}
							</Button>
						</Paper>
				</Box>
			)}

			{/* Contenido principal */}
			<Box sx={{ flex: { xs: '1 1 100%', md: '1 1 75%' } }}>
					{currentObjective && (
						<Paper sx={{ p: 3 }}>
							<Stack spacing={3}>
								{/* Header del objetivo */}
								<Box>
									<Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
										<Box
											sx={{
												width: 48,
												height: 48,
												borderRadius: 2,
												bgcolor: alpha(theme.palette.primary.main, 0.1),
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
											}}
										>
											<Typography variant="h5" color="primary.main" fontWeight={700}>
												{currentObjectiveIndex + 1}
											</Typography>
										</Box>
										<Box flex={1}>
											<Typography variant="overline" color="text.secondary">
												{t('evaluation-responses.objectives.objective')} {currentObjectiveIndex + 1} {t('evaluation-responses.objectives.of')} {objectives.length}
											</Typography>
											<Typography variant="h5" sx={{ mt: 0.5 }}>
												{currentObjective.name}
											</Typography>
										</Box>
										{isObjectiveAnswered && (
											<Iconify 
												icon="solar:check-circle-bold" 
												width={32} 
												sx={{ color: theme.palette.success.main }} 
											/>
										)}
									</Stack>
									<Divider />
								</Box>

								{/* 1. Descripción del objetivo */}
								<Box>
									<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
										1. {t('evaluation-responses.objectives.objectiveDescription')}
									</Typography>
									<TextField
										fullWidth
										multiline
										rows={3}
										value={currentObjective.name}
										disabled
										sx={{
											'& .MuiInputBase-input.Mui-disabled': {
												WebkitTextFillColor: theme.palette.text.primary,
											},
										}}
									/>
									<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
										{t('evaluation-responses.objectives.objectiveDescriptionHelper')}
									</Typography>
								</Box>

								{/* 2. Indicador de medición */}
								{currentObjective.customKpi && (
									<Box>
										<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
											2. {t('evaluation-responses.objectives.measurementIndicator')}
										</Typography>
										<TextField
											fullWidth
											value={currentObjective.customKpi}
											disabled
											sx={{
												'& .MuiInputBase-input.Mui-disabled': {
													WebkitTextFillColor: theme.palette.text.primary,
												},
											}}
										/>
										<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
											{t('evaluation-responses.objectives.measurementIndicatorHelper')}
										</Typography>
									</Box>
								)}

								{/* 3, 4, 5. Meta, Peso, Valor Real */}
							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
											3. {t('evaluation-responses.objectives.targetValue')} (%)
										</Typography>
										<TextField
											fullWidth
											type="number"
											value={currentObjective.targetValue}
											disabled
											sx={{
												'& .MuiInputBase-input.Mui-disabled': {
													WebkitTextFillColor: theme.palette.text.primary,
												},
											}}
										/>
										<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
											{t('evaluation-responses.objectives.targetValueHelper')}
										</Typography>
								</Box>

								<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
											4. {t('evaluation-responses.objectives.weight')} (%)
										</Typography>
										<TextField
											fullWidth
											type="number"
											value={currentObjective.weight}
											disabled
											sx={{
												'& .MuiInputBase-input.Mui-disabled': {
													WebkitTextFillColor: theme.palette.text.primary,
												},
											}}
										/>
										<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
											{t('evaluation-responses.objectives.weightHelper')}
										</Typography>
								</Box>

								<Box sx={{ flex: 1 }}>
										<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
											5. {t('evaluation-responses.objectives.achievedValue')} (%)
										</Typography>
										<TextField
											fullWidth
											type="number"
											value={achievedValue}
											onChange={(e) => setAchievedValue(e.target.value)}
											placeholder={t('evaluation-responses.objectives.enterValue')}
											disabled={isObjectiveAnswered}
											inputProps={{
												min: 0,
												step: 'any',
											}}
											sx={{
												'& .MuiInputBase-root': {
													bgcolor: isObjectiveAnswered 
														? alpha(theme.palette.success.main, 0.08)
														: alpha(theme.palette.primary.main, 0.04),
												},
											}}
										/>
										<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
											{t('evaluation-responses.objectives.achievedValueHelper')}
										</Typography>
								</Box>
							</Stack>

							{/* Resultado de la Evaluación */}
							{isObjectiveAnswered && (currentObjective.compliancePercentage ?? 0) >= 0 && (
									<Box
										sx={{
											p: 3,
											borderRadius: 2,
											bgcolor: alpha(theme.palette.success.main, 0.08),
											border: `1px solid ${alpha(theme.palette.success.main, 0.24)}`,
										}}
									>
										<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
											{t('evaluation-responses.objectives.evaluationResult')}
										</Typography>
										<Stack spacing={2}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="body2" color="text.secondary">
													{t('evaluation-responses.objectives.complianceLevel')}
												</Typography>
												<Typography variant="h5" color="success.main" fontWeight={700}>
												{(currentObjective.compliancePercentage ?? 0).toFixed(1)}%
												</Typography>
											</Stack>
											<LinearProgress
												variant="determinate"
											value={Math.min(currentObjective.compliancePercentage ?? 0, 100)}
												sx={{
													height: 8,
													borderRadius: 1,
													'& .MuiLinearProgress-bar': {
														bgcolor: theme.palette.success.main,
													},
												}}
											/>
											<Typography variant="caption" color="text.secondary">
												{t('evaluation-responses.objectives.evaluationResultDescription')}
											</Typography>
										</Stack>
									</Box>
								)}

								{/* Escala de evaluación */}
								{!isObjectiveAnswered && currentObjective.scale?.levels && currentObjective.scale.levels.length > 0 && (
									<Box>
										<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
											{t('evaluation-responses.objectives.evaluationScale')}
										</Typography>
										<ToggleButtonGroup
											value={selectedScaleLevel}
											exclusive
											onChange={(_, value) => {
												if (value !== null) {
													setSelectedScaleLevel(value);
												}
											}}
											fullWidth
											sx={{
												'& .MuiToggleButton-root': {
													py: 2,
													flexDirection: 'column',
													gap: 1,
												},
											}}
										>
											{currentObjective.scale.levels.map((level: any) => (
												<ToggleButton key={level.id} value={level.id}>
													<Typography variant="h6" fontWeight={700}>
														{level.value}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														{level.label}
													</Typography>
												</ToggleButton>
											))}
										</ToggleButtonGroup>
									</Box>
								)}

								{/* Comentarios */}
								<Box>
									<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
										{t('evaluation-responses.objectives.comments')} ({t('evaluation-responses.objectives.optional')})
									</Typography>
									<TextField
										fullWidth
										multiline
										rows={3}
										value={comments}
										onChange={(e) => setComments(e.target.value)}
										placeholder={t('evaluation-responses.objectives.commentsPlaceholder')}
										disabled={isObjectiveAnswered}
									/>
								</Box>

								{/* Botones de navegación */}
								<Stack 
									direction={{ xs: 'column', sm: 'row' }} 
									justifyContent="space-between" 
									spacing={2}
									sx={{ pt: 2 }}
								>
									<Button
										variant="outlined"
										startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
										onClick={handlePrevious}
										disabled={currentObjectiveIndex === 0}
									>
										{t('evaluation-responses.objectives.previous')}
									</Button>

									<Stack direction="row" spacing={2}>
										{isMobile && (
											<Button
												variant="text"
												startIcon={<Iconify icon="solar:list-bold" />}
												onClick={handleBackToSummary}
											>
												{t('evaluation-responses.objectives.viewSummary')}
											</Button>
										)}

										{!isObjectiveAnswered ? (
											<LoadingButton
												variant="contained"
												endIcon={
													currentObjectiveIndex < objectives.length - 1 ? (
														<Iconify icon="eva:arrow-ios-forward-fill" />
													) : (
														<Iconify icon="solar:check-circle-bold" />
													)
												}
												onClick={handleSaveAndNext}
												loading={saving}
											>
												{currentObjectiveIndex < objectives.length - 1
													? t('evaluation-responses.objectives.saveAndNext')
													: t('evaluation-responses.objectives.finish')}
											</LoadingButton>
										) : (
											<Button
												variant="contained"
												endIcon={
													currentObjectiveIndex < objectives.length - 1 ? (
														<Iconify icon="eva:arrow-ios-forward-fill" />
													) : (
														<Iconify icon="solar:check-circle-bold" />
													)
												}
												onClick={handleSaveAndNext}
											>
												{currentObjectiveIndex < objectives.length - 1
													? t('evaluation-responses.objectives.next')
													: t('evaluation-responses.objectives.viewSummary')}
											</Button>
										)}
									</Stack>
								</Stack>
							</Stack>
						</Paper>
					)}
				</Box>
			</Stack>
		</Box>
	);
}
