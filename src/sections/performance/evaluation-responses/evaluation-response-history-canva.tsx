'use client';

import type { IEvaluationData } from 'src/types/performance';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// Componente de contenido del sidebar
function SidebarContent({ allSections, selectedCompetenceId, onSelectCompetence, theme, t }: any) {
	return (
		<Stack spacing={1}>
			{allSections.map((section: any) => (
				<Box
					key={`${section.type}-${section.id}`}
					onClick={() => {
						if (section.type === 'competence') {
							onSelectCompetence(section.id);
						}
					}}
					sx={{
						p: 2,
						borderRadius: 1.5,
						border: `1px solid ${
							selectedCompetenceId === section.id
								? theme.palette.primary.main
								: alpha(theme.palette.grey[500], 0.24)
						}`,
						bgcolor:
							selectedCompetenceId === section.id
								? alpha(theme.palette.primary.main, 0.08)
								: 'transparent',
						cursor: 'pointer',
						transition: 'all 0.2s',
						'&:hover': {
							borderColor: theme.palette.primary.main,
							bgcolor: alpha(theme.palette.primary.main, 0.04),
						},
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor:
									selectedCompetenceId === section.id
										? theme.palette.primary.main
										: alpha(theme.palette.grey[500], 0.16),
								color:
									selectedCompetenceId === section.id
										? theme.palette.primary.contrastText
										: 'text.secondary',
							}}
						>
							{selectedCompetenceId === section.id ? (
								<Iconify icon="eva:checkmark-fill" width={20} />
							) : (
								<Typography variant="caption" fontWeight={600}>
									{section.number}
								</Typography>
							)}
						</Box>
						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography variant="subtitle2" noWrap>
								{t('evaluation-responses.history.section')} {section.number}
							</Typography>
							<Typography variant="caption" color="text.secondary" noWrap>
								{section.name}
							</Typography>
						</Box>
					</Stack>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
						<Typography variant="caption" color="text.secondary">
							{section.answeredCount}/{section.questionsCount}
						</Typography>
						<Typography variant="caption" fontWeight={600}>
							{section.percentage}%
						</Typography>
					</Stack>
				</Box>
			))}
		</Stack>
	);
}

// ----------------------------------------------------------------------

type Props = {
	evaluationData: IEvaluationData | null;
	loading: boolean;
	questions: any[];
	loadingQuestions: boolean;
	selectedCompetenceId: number | null;
	onSelectCompetence: (competenceId: number) => void;
	onSaveAnswer: (answer: any) => Promise<void>;
	assignmentId: string;
};

export function EvaluationResponseHistoryCanva({
	evaluationData,
	loading,
	questions,
	loadingQuestions,
	selectedCompetenceId,
	onSelectCompetence,
	onSaveAnswer,
}: Props) {
	const theme = useTheme();
	const router = useRouter();
	const { t } = useTranslate('performance');
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedScaleLevel, setSelectedScaleLevel] = useState<number | null>(null);
	const [comments, setComments] = useState('');
	const [saving, setSaving] = useState(false);
	const [openDrawer, setOpenDrawer] = useState(false);

	const currentQuestion = questions[currentQuestionIndex];
	const isQuestionAnswered = currentQuestion?.currentAnswer !== null;

	// Inicializar respuesta actual cuando cambia la pregunta
	React.useEffect(() => {
		if (currentQuestion?.currentAnswer) {
			setSelectedScaleLevel(Number(currentQuestion.currentAnswer.scaleLevelId));
			setComments(currentQuestion.currentAnswer.comments || '');
		} else {
			setSelectedScaleLevel(null);
			setComments('');
		}
	}, [currentQuestion]);

	const handleSaveAndNext = async () => {
		// Si la pregunta ya fue respondida, solo avanzar
		if (isQuestionAnswered) {
			if (currentQuestionIndex < questions.length - 1) {
				setCurrentQuestionIndex(currentQuestionIndex + 1);
			}
			return;
		}

		// Validar si la pregunta es obligatoria y no se ha respondido
		if (!currentQuestion.isOptional && !selectedScaleLevel) {
			toast.warning(t('evaluation-responses.history.requiredQuestion'));
			return;
		}

		try {
			setSaving(true);

			// Solo guardar si hay una respuesta seleccionada
			if (selectedScaleLevel) {
				await onSaveAnswer({
					questionId: Number(currentQuestion.questionId),
					scaleLevelId: selectedScaleLevel,
					comments: comments || undefined,
				});
			}

			// Avanzar a la siguiente pregunta
			if (currentQuestionIndex < questions.length - 1) {
				setCurrentQuestionIndex(currentQuestionIndex + 1);
			}
		} catch (error: any) {
			console.error('Error saving answer:', error);
			toast.error(t(error?.message) || t('evaluation-responses.messages.error.savingAnswer'));
		} finally {
			setSaving(false);
		}
	};

	const handleSaveAndExit = async () => {
		try {
			setSaving(true);
			// Guardar la respuesta actual si no ha sido respondida
			if (!isQuestionAnswered && selectedScaleLevel) {
				await onSaveAnswer({
					questionId: Number(currentQuestion.questionId),
					scaleLevelId: selectedScaleLevel,
					comments: comments || undefined,
				});
			}
			// Redirigir al listado de evaluaciones
			router.push(paths.dashboard.performance.evaluationResponses);

			toast.success(t('evaluation-responses.messages.success.progressSaved'));
		} catch (error: any) {
			console.error('Error saving answer:', error);
			toast.error(t(error?.message) || t('evaluation-responses.messages.error.savingAnswer'));
		} finally {
			setSaving(false);
		}
	};

	const handlePrevious = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	// Construir todas las secciones (competencias + objetivos)
	const allSections = React.useMemo(() => {
		if (!evaluationData) return [];

		const sections: any[] = [];
		let sectionNumber = 1;

		// Añadir competencias
		if (evaluationData.sections.competences) {
			evaluationData.sections.competences.forEach((competence) => {
				sections.push({
					id: competence.competenceId,
					type: 'competence',
					number: sectionNumber++,
					name: competence.name,
					description: competence.description,
					questionsCount: competence.questionsCount,
					answeredCount: competence.answeredCount,
					percentage: Math.round((competence.answeredCount / competence.questionsCount) * 100),
				});
			});
		}

		// Añadir objetivos
		if (evaluationData.sections.objectives) {
			evaluationData.sections.objectives.forEach((objective) => {
				sections.push({
					id: objective.objectiveId,
					type: 'objective',
					number: sectionNumber++,
					name: objective.name,
					questionsCount: 0, // Los objetivos no tienen preguntas por ahora
					answeredCount: 0,
					percentage: 0,
				});
			});
		}

		return sections;
	}, [evaluationData]);

	if (loading) {
		return <LoadingScreen />;
	}

	if (!evaluationData) {
		return <EmptyContent filled title={t('evaluation-responses.messages.noData')} />;
	}

	return (
		<Box>
			{/* Header con información general */}
			<Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
				<Stack spacing={2}>
					<Stack 
						direction={{ xs: 'column', sm: 'row' }} 
						justifyContent="space-between" 
						alignItems={{ xs: 'flex-start', sm: 'center' }}
						spacing={{ xs: 2, sm: 0 }}
					>
						<Box sx={{ flex: 1 }}>
							<Typography 
								variant="h4" 
								gutterBottom
								sx={{ 
									fontSize: { xs: '1.5rem', sm: '2.125rem' } 
								}}
							>
								{evaluationData.campaign.name}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{t(`configure-evaluations.types.${evaluationData.campaign.type}`)}
							</Typography>
						</Box>
						<Button 
							variant="outlined" 
							startIcon={!isMobile && <Iconify icon="eva:save-outline" />}
							onClick={handleSaveAndExit} 
							disabled={saving}
							fullWidth={isMobile}
						>
							{t('evaluation-responses.history.saveAndExit')}
						</Button>
					</Stack>

					<Divider />

					<Stack 
						direction={{ xs: 'column', sm: 'row' }} 
						spacing={2} 
						alignItems={{ xs: 'stretch', sm: 'center' }}
					>
						<Box>
							<Typography variant="caption" color="text.secondary">
								{evaluationData.progress.answeredQuestions} de {evaluationData.progress.totalQuestions} {t('evaluation-responses.preview.questionsAnswered')}
							</Typography>
						</Box>
						<Box sx={{ flex: 1 }}>
							<LinearProgress
								variant="determinate"
								value={evaluationData.progress.percentage}
								sx={{ height: 6, borderRadius: 1 }}
							/>
						</Box>
						<Typography 
							variant="h6"
							color={evaluationData.progress.percentage === 100 ? 'success.main' : 'text.primary'}
							sx={{ 
								textAlign: { xs: 'right', sm: 'left' },
								fontSize: { xs: '0.875rem', sm: '1.25rem' }
							}}
						>
							{evaluationData.progress.percentage}% {t('evaluation-responses.preview.completed')}
						</Typography>
					</Stack>
				</Stack>
			</Paper>

			{/* Layout principal con sidebar */}
			<Box sx={{ display: 'flex', gap: { xs: 0, md: 3 }, flexDirection: { xs: 'column', md: 'row' } }}>
				{/* Botón para abrir sidebar en móviles */}
				{isMobile && (
					<Box sx={{ mb: 2 }}>
						<Button
							fullWidth
							variant="outlined"
						startIcon={<Iconify icon="solar:list-bold" />}
							onClick={() => setOpenDrawer(true)}
						>
							{t('evaluation-responses.history.sections')}
						</Button>
					</Box>
				)}

				{/* Sidebar de secciones - Desktop */}
				{!isMobile && (
					<Paper
						sx={{
							width: 250,
							flexShrink: 0,
							p: 2,
							height: 'fit-content',
							position: 'sticky',
							top: 20,
						}}
					>
						<Typography variant="h6" sx={{ mb: 2 }}>
							{t('evaluation-responses.history.sections')}
						</Typography>
						<SidebarContent 
							allSections={allSections}
							selectedCompetenceId={selectedCompetenceId}
							onSelectCompetence={onSelectCompetence}
							theme={theme}
							t={t}
						/>
					</Paper>
				)}

				{/* Drawer para móviles */}
				<Drawer
					anchor="left"
					open={openDrawer}
					onClose={() => setOpenDrawer(false)}
				>
					<Box sx={{ width: 280, p: 2 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
							<Typography variant="h6">
								{t('evaluation-responses.history.sections')}
							</Typography>
							<IconButton onClick={() => setOpenDrawer(false)} size="small">
							<Iconify icon="solar:close-circle-bold" />
							</IconButton>
						</Stack>
						<SidebarContent 
							allSections={allSections}
							selectedCompetenceId={selectedCompetenceId}
						onSelectCompetence={(id: number) => {
								onSelectCompetence(id);
								setOpenDrawer(false);
							}}
							theme={theme}
							t={t}
						/>
					</Box>
				</Drawer>

				{/* Área de contenido principal */}
				<Box sx={{ flex: 1, minWidth: 0 }}>
					{!selectedCompetenceId || loadingQuestions ? (
						/* Mensaje de bienvenida o cargando */
						<Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
							{loadingQuestions ? (
								<Stack spacing={2}>
									<Skeleton variant="rectangular" height={200} />
									<Skeleton variant="text" />
									<Skeleton variant="text" />
								</Stack>
							) : (
								<Stack spacing={2} alignItems="center">
									<Iconify icon="solar:list-bold" width={64} sx={{ color: 'text.disabled' }} />
									<Typography variant="h6" color="text.secondary">
										{t('evaluation-responses.history.selectSectionPrompt')}
									</Typography>
								</Stack>
							)}
						</Paper>
					) : questions.length === 0 ? (
						<EmptyContent filled title={t('evaluation-responses.history.noQuestions')} />
					) : (
						/* Área de preguntas */
						<Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
							{/* Header de la sección */}
							<Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
								<Typography 
									variant="h5" 
									gutterBottom
									sx={{ 
										fontSize: { xs: '1.25rem', sm: '1.5rem' } 
									}}
								>
									{allSections.find((s) => s.id === selectedCompetenceId)?.name}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{t('evaluation-responses.history.section')} {allSections.find((s) => s.id === selectedCompetenceId)?.number} de {allSections.length}
								</Typography>
								<Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
									<Typography variant="caption" color="text.secondary">
										{allSections.find((s) => s.id === selectedCompetenceId)?.answeredCount}/{allSections.find((s) => s.id === selectedCompetenceId)?.questionsCount} respondidas
									</Typography>
									<Box sx={{ flex: 1 }}>
										<LinearProgress
											variant="determinate"
											value={allSections.find((s) => s.id === selectedCompetenceId)?.percentage || 0}
											sx={{ height: 4, borderRadius: 1 }}
										/>
									</Box>
									<Typography variant="caption" fontWeight={600}>
										{allSections.find((s) => s.id === selectedCompetenceId)?.percentage}%
									</Typography>
								</Stack>
							</Box>

							<Divider sx={{ mb: { xs: 2, sm: 3, md: 4 } }} />

							{/* Paginación de preguntas */}
							<Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
								<Box 
									sx={{ 
										overflowX: { xs: 'auto', sm: 'visible' },
										pb: { xs: 1, sm: 0 },
										'&::-webkit-scrollbar': { height: 6 },
										'&::-webkit-scrollbar-thumb': { 
											bgcolor: alpha(theme.palette.grey[500], 0.3),
											borderRadius: 1 
										}
									}}
								>
									<Stack 
										direction="row" 
										alignItems="center" 
										justifyContent={{ xs: 'flex-start', sm: 'center' }} 
										spacing={1.5} 
										sx={{ minWidth: { xs: 'max-content', sm: 'auto' } }}
									>
									{questions.map((question, index) => {
										const isAnswered = question.currentAnswer !== null;
										const isCurrent = index === currentQuestionIndex;

										return (
											<Box
												key={index}
												onClick={() => setCurrentQuestionIndex(index)}
												sx={{
													position: 'relative',
													width: 36,
													height: 36,
													borderRadius: '50%',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													border: `2px solid ${isCurrent
														? theme.palette.primary.main
														: isAnswered
															? alpha(theme.palette.success.main, 0.5)
															: alpha(theme.palette.grey[500], 0.24)
														}`,
													bgcolor: isCurrent
														? theme.palette.primary.main
														: isAnswered
															? alpha(theme.palette.success.main, 0.08)
															: 'transparent',
													color: isCurrent
														? theme.palette.primary.contrastText
														: isAnswered
															? theme.palette.success.main
															: 'text.secondary',
													cursor: 'pointer',
													transition: 'all 0.3s',
													'&:hover': {
														transform: 'scale(1.15)',
														borderColor: theme.palette.primary.main,
														bgcolor: isCurrent
															? theme.palette.primary.main
															: alpha(theme.palette.primary.main, 0.08),
													},
												}}
											>
												{isAnswered && !isCurrent ? (
													<Iconify icon="eva:checkmark-fill" width={20} />
												) : (
													<Typography variant="caption" fontWeight={600}>
														{index + 1}
													</Typography>
												)}
											</Box>
										);
									})}
								</Stack>
							</Box>
							<Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<Box
											sx={{
												width: 12,
												height: 12,
												borderRadius: '50%',
												bgcolor: theme.palette.primary.main,
											}}
										/>
										<Typography variant="caption" color="text.secondary">
											{t('evaluation-responses.history.current')}
										</Typography>
									</Stack>
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<Box
											sx={{
												width: 12,
												height: 12,
												borderRadius: '50%',
												bgcolor: alpha(theme.palette.success.main, 0.5),
											}}
										/>
										<Typography variant="caption" color="text.secondary">
											{t('evaluation-responses.history.answered')}
										</Typography>
									</Stack>
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<Box
											sx={{
												width: 12,
												height: 12,
												borderRadius: '50%',
												border: `2px solid ${alpha(theme.palette.grey[500], 0.24)}`,
											}}
										/>
										<Typography variant="caption" color="text.secondary">
											{t('evaluation-responses.history.pending')}
										</Typography>
									</Stack>
								</Stack>
							</Box>

							{/* Pregunta actual */}
							{currentQuestion && (
								<Box>
										<Stack 
											direction={{ xs: 'column', sm: 'row' }} 
											alignItems={{ xs: 'flex-start', sm: 'center' }} 
											justifyContent="space-between" 
											spacing={1}
											sx={{ mb: 3 }}
										>
										<Typography 
											variant="h6" 
											component="span"
											sx={{ 
												fontSize: { xs: '1rem', sm: '1.25rem' } 
											}}
										>
											{t('evaluation-responses.history.question')} {currentQuestionIndex + 1}
										</Typography>
										{!currentQuestion.isOptional && (
											<Label color="error" variant="soft">
												* {t('evaluation-responses.history.required')}
											</Label>
										)}
									</Stack>

									<Typography 
										variant="h6" 
										sx={{ 
											mb: 1,
											fontSize: { xs: '1rem', sm: '1.25rem' } 
										}}
									>
										{currentQuestion.text}
									</Typography>

									{currentQuestion.description && (
										<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
											{currentQuestion.description}
										</Typography>
									)}

									{/* Opciones de respuesta */}
									{isQuestionAnswered && (
										<Alert severity="info" sx={{ mb: 3 }}>
											<Typography variant="body2">
												{t('evaluation-responses.history.questionAlreadyAnswered')}
											</Typography>
										</Alert>
									)}

									<RadioGroup
										value={selectedScaleLevel?.toString() || ''}
										onChange={(e) => !isQuestionAnswered && setSelectedScaleLevel(Number(e.target.value))}
									>
										<Stack spacing={2}>
											{currentQuestion.scale.levels.map((level: any) => (
												<Box
													key={level.id}
													onClick={() => !isQuestionAnswered && setSelectedScaleLevel(Number(level.id))}
													sx={{
														p: 2.5,
														borderRadius: 2,
														border: `2px solid ${selectedScaleLevel === Number(level.id)
															? theme.palette.text.primary
															: alpha(theme.palette.grey[500], 0.24)
															}`,
														bgcolor:
															selectedScaleLevel === Number(level.id)
																? alpha(theme.palette.text.primary, 0.04)
																: 'transparent',
														cursor: isQuestionAnswered ? 'not-allowed' : 'pointer',
														opacity: isQuestionAnswered ? 0.6 : 1,
														transition: 'all 0.2s',
														'&:hover': isQuestionAnswered ? {} : {
															borderColor: theme.palette.text.primary,
															bgcolor: alpha(theme.palette.text.primary, 0.02),
														},
													}}
												>
													<FormControlLabel
														value={level.id}
														control={
															<Radio
																disabled={isQuestionAnswered}
																sx={{
																	'& .MuiSvgIcon-root': {
																		fontSize: 24,
																	},
																}}
															/>
														}
														label={
															<Typography variant="body1" fontWeight={500}>
																{level.label}
															</Typography>
														}
														sx={{ width: '100%', m: 0, ml: 1 }}
													/>
												</Box>
											))}
										</Stack>
									</RadioGroup>

									{/* Campo de comentarios */}
									<Box sx={{ mt: 4 }}>
										<Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
											{t('evaluation-responses.history.comments')}
										</Typography>
										<TextField
											fullWidth
											multiline
											rows={4}
											value={comments}
											onChange={(e) => !isQuestionAnswered && setComments(e.target.value)}
											placeholder={t('evaluation-responses.history.commentsPlaceholder')}
											disabled={isQuestionAnswered}
											sx={{
												'& .MuiOutlinedInput-root': {
													bgcolor: isQuestionAnswered ? alpha(theme.palette.grey[500], 0.04) : 'background.paper',
												},
											}}
										/>
									</Box>

									{/* Navegación */}
									<Box sx={{ 
										mt: 4, 
										display: 'flex', 
										flexDirection: { xs: 'column-reverse', sm: 'row' },
										justifyContent: 'space-between', 
										alignItems: 'center',
										gap: 2
									}}>
										<Button
											variant="text"
											onClick={handlePrevious}
											disabled={currentQuestionIndex === 0}
											fullWidth={isMobile}
										>
											{t('evaluation-responses.history.previous')}
										</Button>

										<LoadingButton
											variant="contained"
											onClick={handleSaveAndNext}
											disabled={!currentQuestion.isOptional && !selectedScaleLevel}
											loading={saving}
											endIcon={!isMobile && <Iconify icon="eva:arrow-forward-fill" />}
											fullWidth={isMobile}
										>
											{currentQuestionIndex === questions.length - 1
												? t('evaluation-responses.history.finish')
												: t('evaluation-responses.history.continue')}
										</LoadingButton>
									</Box>
								</Box>
							)}
						</Paper>
					)}
				</Box>
			</Box>
		</Box>
	);
}
