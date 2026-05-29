'use client';

import type { IEvaluationData } from 'src/types/performance';

import React, { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
// import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

// ── Adaptive deadline countdown ───────────────────────────────────────────────

export function DeadlineDisplay({ deadline }: { deadline?: string }) {
	const theme = useTheme();
	const [now, setNow] = useState(Date.now);

	useEffect(() => {
		if (!deadline) return undefined;
		const deadlineMs = new Date(deadline).getTime();
		const diff = deadlineMs - Date.now();

		let intervalMs = 0;
		if (diff < 3_600_000) intervalMs = 1_000;
		else if (diff < 86_400_000) intervalMs = 60_000;
		if (!intervalMs) return undefined;

		const id = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(id);
	}, [deadline]);

	if (!deadline) return null;

	const diffMs = new Date(deadline).getTime() - now;
	const diffDays = diffMs / 86_400_000;
	const diffHours = diffMs / 3_600_000;
	const diffMins = diffMs / 60_000;

	let label: string;
	let urgency: 'normal' | 'warning' | 'error' = 'normal';

	if (diffMs <= 0) {
		label = 'Vencida';
		urgency = 'error';
	} else if (diffDays > 7) {
		label = `Vence el ${fDate(deadline, 'DD MMM YYYY')}`;
	} else if (diffDays > 2) {
		label = `Vence en ${Math.floor(diffDays)} días`;
	} else if (diffHours >= 1) {
		const d = Math.floor(diffDays);
		const h = Math.floor(diffHours % 24);
		label = d > 0 ? `Vence en ${d}d ${h}h` : `Vence en ${h}h ${Math.floor(diffMins % 60)}m`;
		urgency = 'warning';
	} else {
		const m = Math.floor(diffMins);
		const s = Math.floor((diffMs / 1000) % 60);
		label = `Vence en ${m}m ${s}s`;
		urgency = 'error';
	}

	const color =
		urgency === 'error'
			? theme.palette.error.main
			: urgency === 'warning'
				? theme.palette.warning.main
				: theme.palette.text.secondary;

	return (
		<Stack direction="row" alignItems="center" spacing={0.5}>
			<Iconify icon="solar:calendar-date-bold" width={13} sx={{ color, flexShrink: 0 }} />
			<Typography variant="caption" sx={{ color, fontWeight: urgency !== 'normal' ? 600 : 400 }}>
				{label}
			</Typography>
		</Stack>
	);
}

// ── Scale options (horizontal cards) ─────────────────────────────────────────

type ScaleOptionsProps = {
	levels: any[];
	selected: number | null;
	disabled: boolean;
	onChange: (id: number) => void;
};

function ScaleOptions({ levels, selected, disabled, onChange }: ScaleOptionsProps) {
	const theme = useTheme();
	return (
		<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1.5, pb: 0.5 }}>
			{levels.map((level: any) => {
				const isSelected = selected === Number(level.id);
				return (
					<Box
						key={level.id}
						onClick={() => !disabled && onChange(Number(level.id))}
						sx={{
							position: 'relative',
							flex: '1 1 110px',
							minWidth: 100,
							p: 2.5,
							pt: 3,
							borderRadius: 2,
							border: `2px solid ${
								isSelected
									? theme.palette.primary.main
									: alpha(theme.palette.grey[500], 0.2)
							}`,
							bgcolor: isSelected
								? alpha(theme.palette.primary.main, 0.07)
								: alpha(theme.palette.grey[500], 0.04),
							cursor: disabled ? 'not-allowed' : 'pointer',
							opacity: disabled && !isSelected ? 0.55 : 1,
							transition: 'all 0.2s',
							textAlign: 'center',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 1,
							boxShadow: isSelected
								? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
								: 'none',
							'&:hover': disabled
								? {}
								: {
										borderColor: theme.palette.primary.main,
										bgcolor: alpha(theme.palette.primary.main, 0.05),
										transform: 'translateY(-2px)',
										boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
									},
						}}
					>
						{/* Badge check — top-right, overflowing the card */}
						{isSelected && (
							<Box
								sx={{
									position: 'absolute',
									top: -10,
									right: -10,
									width: 26,
									height: 26,
									borderRadius: '50%',
									bgcolor: 'primary.main',
									border: `2.5px solid ${theme.palette.background.paper}`,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.5)}`,
									zIndex: 1,
								}}
							>
								<Iconify icon="eva:checkmark-fill" width={14} sx={{ color: 'white' }} />
							</Box>
						)}

						<Typography
							variant="h4"
							fontWeight={700}
							sx={{ color: isSelected ? 'primary.main' : 'text.disabled', lineHeight: 1 }}
						>
							{level.value}
						</Typography>
						<Typography
							variant="body2"
							fontWeight={isSelected ? 600 : 400}
							sx={{
								color: isSelected ? 'primary.dark' : 'text.secondary',
								lineHeight: 1.3,
							}}
						>
							{level.label}
						</Typography>
					</Box>
				);
			})}
		</Box>
	);
}

// ── Sidebar content ───────────────────────────────────────────────────────────

type SidebarContentProps = {
	allSections: any[];
	selectedCompetenceId: number | null;
	currentQuestionIndex: number;
	questions: any[];
	onSelectCompetence: (id: number) => void;
	onSelectQuestion: (index: number) => void;
	theme: any;
	t: any;
};

function SidebarContent({
	allSections,
	selectedCompetenceId,
	currentQuestionIndex,
	questions,
	onSelectCompetence,
	onSelectQuestion,
	theme,
	t,
}: SidebarContentProps) {
	return (
		<>
			{/* Competences list — independently scrollable */}
			<Box sx={{ flex: 7, overflowY: 'auto', minHeight: 0, pr: 0.25 }}>
				<Stack spacing={1} sx={{ pb: 1 }}>
					{allSections.map((section: any, idx: number) => {
						const isSelected =
							selectedCompetenceId === section.id && section.type === 'competence';
						const pct =
							section.questionsCount > 0
								? Math.round((section.answeredCount / section.questionsCount) * 100)
								: (section.percentage ?? 0);

						return (
							<Box
								key={`${section.type}-${section.id}`}
								onClick={() => {
									if (section.type === 'competence') {
										onSelectCompetence(section.id);
									}
								}}
								sx={{
									px: 1.5,
									py: 1.25,
									borderRadius: 1.5,
									border: `1.5px solid ${
										isSelected
											? theme.palette.primary.main
											: alpha(theme.palette.grey[500], 0.2)
									}`,
									bgcolor: isSelected
										? alpha(theme.palette.primary.main, 0.06)
										: 'transparent',
									cursor: section.type === 'competence' ? 'pointer' : 'default',
									transition: 'all 0.18s',
									'&:hover':
										section.type === 'competence'
											? {
													borderColor: theme.palette.primary.main,
													bgcolor: alpha(theme.palette.primary.main, 0.03),
												}
											: {},
								}}
							>
								<Stack direction="row" alignItems="center" spacing={1.25}>
									{/* Number bubble — centered against text+bar block */}
									<Box
										sx={{
											width: 36,
											height: 36,
											borderRadius: '50%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											flexShrink: 0,
											bgcolor: isSelected
												? theme.palette.primary.main
												: pct === 100
													? alpha(theme.palette.success.main, 0.15)
													: alpha(theme.palette.grey[500], 0.12),
											color: isSelected
												? theme.palette.primary.contrastText
												: pct === 100
													? theme.palette.success.main
													: theme.palette.text.secondary,
										}}
									>
										{pct === 100 && !isSelected ? (
											<Iconify icon="eva:checkmark-fill" width={18} />
										) : (
											<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1 }}>
												{idx + 1}
											</Typography>
										)}
									</Box>

									{/* Name + progress bar stacked */}
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography
											variant="body2"
											fontWeight={isSelected ? 600 : 400}
											noWrap
											sx={{ mb: section.type === 'competence' ? 0.75 : 0 }}
										>
											{section.name}
										</Typography>

										{section.type === 'competence' && (
											<Stack direction="row" alignItems="center" spacing={1}>
												<LinearProgress
													variant="determinate"
													value={pct}
													sx={{
														flex: 1,
														height: 5,
														borderRadius: 1,
														bgcolor: alpha(theme.palette.grey[500], 0.12),
														'& .MuiLinearProgress-bar': {
															bgcolor:
																pct === 100
																	? theme.palette.success.main
																	: theme.palette.primary.main,
														},
													}}
												/>
												<Typography
													variant="caption"
													sx={{
														color: 'text.secondary',
														flexShrink: 0,
														fontSize: '0.72rem',
														fontWeight: 500,
													}}
												>
													{section.answeredCount}/{section.questionsCount}
												</Typography>
											</Stack>
										)}
									</Box>
								</Stack>
							</Box>
						);
					})}
				</Stack>
			</Box>

			{/* Question numbers — shown when section is selected */}
			{selectedCompetenceId !== null && questions.length > 0 && (
				<>
					<Divider sx={{ flexShrink: 0, my: 0.5 }} />
					<Box sx={{ flex: 3, minHeight: 0, display: 'flex', flexDirection: 'column', pt: 1.25, pb: 0.5 }}>

						{/* Label + legend — always visible, no scroll */}
						<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
							<Typography
								variant="caption"
								fontWeight={600}
								color="text.disabled"
								sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.62rem' }}
							>
								{t('evaluation-responses.history.questions')}
							</Typography>
							<Stack direction="row" spacing={1}>
								{[
									{ color: theme.palette.primary.main, label: t('evaluation-responses.history.current') },
									{ color: theme.palette.success.main, label: t('evaluation-responses.history.answered') },
									{ color: alpha(theme.palette.grey[500], 0.35), label: t('evaluation-responses.history.pending') },
								].map((item) => (
									<Stack key={item.label} direction="row" alignItems="center" spacing={0.4}>
										<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
										<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
											{item.label}
										</Typography>
									</Stack>
								))}
							</Stack>
						</Stack>

						{/* Bubbles — scrollable */}
						<Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.875 }}>
								{questions.map((q: any, index: number) => {
									const isAnswered = q.currentAnswer !== null;
									const isCurrent = index === currentQuestionIndex;
									return (
										<Tooltip
											key={index}
											title={`${t('evaluation-responses.history.question')} ${index + 1}`}
											placement="top"
										>
											<Box
												onClick={() => onSelectQuestion(index)}
												sx={{
													width: 34,
													height: 34,
													borderRadius: '50%',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													border: `2px solid ${
														isCurrent
															? theme.palette.primary.main
															: isAnswered
																? alpha(theme.palette.success.main, 0.5)
																: alpha(theme.palette.grey[500], 0.24)
													}`,
													bgcolor: isCurrent
														? theme.palette.primary.main
														: isAnswered
															? alpha(theme.palette.success.main, 0.12)
															: 'transparent',
													color: isCurrent
														? theme.palette.primary.contrastText
														: isAnswered
															? theme.palette.success.main
															: theme.palette.text.secondary,
													cursor: 'pointer',
													transition: 'all 0.18s',
													'&:hover': {
														transform: 'scale(1.1)',
														borderColor: theme.palette.primary.main,
													},
												}}
											>
												{isAnswered && !isCurrent ? (
													<Iconify icon="eva:checkmark-fill" width={16} />
												) : (
													<Typography sx={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1 }}>
														{index + 1}
													</Typography>
												)}
											</Box>
										</Tooltip>
									);
								})}
							</Box>
						</Box>
					</Box>
				</>
			)}
		</>
	);
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
	evaluationData: IEvaluationData | null;
	loading: boolean;
	questions: any[];
	loadingQuestions: boolean;
	selectedCompetenceId: number | null;
	onSelectCompetence: (competenceId: number) => void;
	onSaveAnswer: (answer: any) => Promise<void>;
	onFinish: () => void;
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
	onFinish,
}: Props) {
	const theme = useTheme();
	const { t } = useTranslate('performance');
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedScaleLevel, setSelectedScaleLevel] = useState<number | null>(null);
	const [comments, setComments] = useState('');
	const [saving, setSaving] = useState(false);
	const [openDrawer, setOpenDrawer] = useState(false);

	// Ref to jump to last question after loading a previous competency
	const pendingJumpToLast = useRef(false);

	const currentQuestion = questions[currentQuestionIndex];
	const isQuestionAnswered = !!currentQuestion && currentQuestion.currentAnswer !== null;

	// Sync answer state when question changes
	useEffect(() => {
		if (currentQuestion?.currentAnswer) {
			setSelectedScaleLevel(Number(currentQuestion.currentAnswer.scaleLevelId));
			setComments(currentQuestion.currentAnswer.comments || '');
		} else {
			setSelectedScaleLevel(null);
			setComments('');
		}
	}, [currentQuestion]);

	// Reset question index when section changes (skip if we want the last question)
	useEffect(() => {
		if (!pendingJumpToLast.current) {
			setCurrentQuestionIndex(0);
		}
	}, [selectedCompetenceId]);

	// Jump to last question once questions load (for "previous competency" navigation)
	useEffect(() => {
		if (pendingJumpToLast.current && questions.length > 0) {
			setCurrentQuestionIndex(questions.length - 1);
			pendingJumpToLast.current = false;
		}
	}, [questions]);

	const handleSaveAndNext = async () => {
		const isLastQuestion = currentQuestionIndex === questions.length - 1;

		const goNext = () => {
			if (!isLastQuestion) {
				setCurrentQuestionIndex(currentQuestionIndex + 1);
			} else if (!isLastCompetency) {
				onSelectCompetence(competenceOnly[currentCompetencyIndex + 1].id);
			} else {
				onFinish();
			}
		};

		if (isQuestionAnswered) {
			goNext();
			return;
		}

		if (!currentQuestion.isOptional && !selectedScaleLevel) {
			toast.warning(t('evaluation-responses.history.requiredQuestion'));
			return;
		}

		try {
			setSaving(true);
			if (selectedScaleLevel) {
				await onSaveAnswer({
					questionId: Number(currentQuestion.questionId),
					scaleLevelId: selectedScaleLevel,
					comments: comments || undefined,
				});
			}
			goNext();
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
		} else if (!isFirstCompetency) {
			pendingJumpToLast.current = true;
			onSelectCompetence(competenceOnly[currentCompetencyIndex - 1].id);
		}
	};

	const allSections = useMemo(() => {
		if (!evaluationData) return [];

		const sections: any[] = [];
		let sectionNumber = 1;

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
					percentage: competence.questionsCount > 0
						? Math.round((competence.answeredCount / competence.questionsCount) * 100)
						: 0,
				});
			});
		}

		if (evaluationData.sections.objectives) {
			evaluationData.sections.objectives.forEach((objective) => {
				sections.push({
					id: objective.objectiveId,
					type: 'objective',
					number: sectionNumber++,
					name: objective.name,
					questionsCount: 0,
					answeredCount: 0,
					percentage: 0,
				});
			});
		}

		return sections;
	}, [evaluationData]);

	const competenceOnly = allSections.filter((s) => s.type === 'competence');
	const currentCompetencyIndex = competenceOnly.findIndex((s) => s.id === selectedCompetenceId);
	const isFirstCompetency = currentCompetencyIndex === 0;
	const isLastCompetency = currentCompetencyIndex === competenceOnly.length - 1;

	const selectedSection = allSections.find(
		(s) => s.id === selectedCompetenceId && s.type === 'competence'
	);

	if (loading) return <LoadingScreen />;
	if (!evaluationData) return <EmptyContent filled title={t('evaluation-responses.messages.noData')} />;

	const { progress } = evaluationData;

	const sidebarNode = (
		<SidebarContent
			allSections={allSections}
			selectedCompetenceId={selectedCompetenceId}
			currentQuestionIndex={currentQuestionIndex}
			questions={questions}
			onSelectCompetence={onSelectCompetence}
			onSelectQuestion={setCurrentQuestionIndex}
			theme={theme}
			t={t}
		/>
	);

	return (
		<Box>
			{/* ── Main layout ─────────────────────────────────────────────── */}
			<Box
				sx={{
					display: 'flex',
					gap: 3,
					flexDirection: { xs: 'column', md: 'row' },
					alignItems: 'flex-start',
				}}
			>
				{/* Mobile: open sections drawer */}
				{isMobile && (
					<Button
						fullWidth
						variant="outlined"
						startIcon={<Iconify icon="solar:list-bold" />}
						onClick={() => setOpenDrawer(true)}
					>
						{t('evaluation-responses.history.sections')}
					</Button>
				)}

				{/* Desktop sidebar */}
				{!isMobile && (
					<Paper
						sx={{
							width: 268,
							flexShrink: 0,
							p: 1.5,
							position: 'sticky',
							top: 80,
							height: 'calc(100vh - 96px)',
							display: 'flex',
							flexDirection: 'column',
							overflow: 'hidden',
						}}
					>
						<Typography
							variant="caption"
							fontWeight={600}
							color="text.disabled"
							sx={{
								display: 'block',
								mb: 1,
								flexShrink: 0,
								textTransform: 'uppercase',
								letterSpacing: '0.06em',
								fontSize: '0.62rem',
							}}
						>
							{t('evaluation-responses.history.sections')}
						</Typography>
						{sidebarNode}
					</Paper>
				)}

				{/* Mobile drawer */}
				<Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)}>
					<Box
						sx={{
							width: 288,
							p: 2,
							display: 'flex',
							flexDirection: 'column',
							height: '100%',
							overflow: 'hidden',
						}}
					>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							sx={{ mb: 1.5, flexShrink: 0 }}
						>
							<Typography variant="subtitle2">
								{t('evaluation-responses.history.sections')}
							</Typography>
							<IconButton onClick={() => setOpenDrawer(false)} size="small">
								<Iconify icon="solar:close-circle-bold" />
							</IconButton>
						</Stack>
						<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
							<SidebarContent
								allSections={allSections}
								selectedCompetenceId={selectedCompetenceId}
								currentQuestionIndex={currentQuestionIndex}
								questions={questions}
								onSelectCompetence={(id) => {
									onSelectCompetence(id);
									setOpenDrawer(false);
								}}
								onSelectQuestion={setCurrentQuestionIndex}
								theme={theme}
								t={t}
							/>
						</Box>
					</Box>
				</Drawer>

				{/* Main content */}
				<Box sx={{ flex: 1, minWidth: 0 }}>
					{!selectedCompetenceId || loadingQuestions ? (
						<Paper sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
							{loadingQuestions ? (
								<Stack spacing={2}>
									<Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1 }} />
									<Skeleton variant="text" />
									<Skeleton variant="text" width="65%" sx={{ mx: 'auto' }} />
								</Stack>
							) : (
								<Stack spacing={2} alignItems="center" sx={{ py: 5 }}>
									<Iconify icon="solar:list-bold" width={48} sx={{ color: 'text.disabled' }} />
									<Typography variant="body1" color="text.secondary">
										{t('evaluation-responses.history.selectSectionPrompt')}
									</Typography>
								</Stack>
							)}
						</Paper>
					) : questions.length === 0 ? (
						<EmptyContent filled title={t('evaluation-responses.history.noQuestions')} />
					) : (
						<Paper
							sx={{
								p: { xs: 2.5, sm: 3.5 },
								bgcolor: alpha(theme.palette.primary.main, 0.03),
								border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
							}}
						>
							{/* Section header */}
							<Box sx={{ mb: 3 }}>
								<Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 0.75 }}>
									<Typography variant="h5" fontWeight={700}>
										{selectedSection?.name}
									</Typography>
									<Stack spacing={0.375} sx={{ flexShrink: 0, minWidth: { sm: 180 }, width: { xs: '100%', sm: 'auto' } }}>
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Typography variant="caption" color="text.secondary">
												{progress.answeredQuestions}/{progress.totalQuestions}{' '}
												{t('evaluation-responses.history.questionsAnswered')}
											</Typography>
											<Typography variant="caption" fontWeight={700} sx={{ color: progress.percentage === 100 ? 'success.main' : 'text.primary' }}>
												{progress.percentage}%
											</Typography>
										</Stack>
										<LinearProgress
											variant="determinate"
											value={progress.percentage}
											sx={{
												height: 5,
												borderRadius: 1,
												bgcolor: alpha(theme.palette.primary.main, 0.12),
												'& .MuiLinearProgress-bar': {
													bgcolor: progress.percentage === 100 ? 'success.main' : 'primary.main',
												},
											}}
										/>
									</Stack>
								</Stack>
								<Typography variant="body2" color="text.secondary">
									{t('evaluation-responses.history.section')} {selectedSection?.number}{' '}
									{t('evaluation-responses.history.of')} {allSections.length}
								</Typography>
							</Box>

							<Divider sx={{ mb: 3 }} />

							{/* Current question */}
							{currentQuestion && (
								<Box
									sx={{
										bgcolor: 'background.paper',
										borderRadius: 2,
										p: { xs: 2, sm: 2.5 },
										boxShadow: `0 2px 12px ${alpha(theme.palette.grey[500], 0.1)}`,
									}}
								>
									{/* Question label + required badge */}
									<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
										<Box
											sx={{
												display: "inline-flex",
												alignItems: "center",
												px: 1.5,
												py: 0.5,
												borderRadius: 1,
												bgcolor: alpha(theme.palette.primary.main, 0.1),
											}}
										>
											<Typography variant="caption" color="primary.dark" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
												{t('evaluation-responses.history.question')} {currentQuestionIndex + 1}
											</Typography>
										</Box>
										{!currentQuestion.isOptional && (
											<Label color="error" variant="soft">
												{t('evaluation-responses.history.required')}
											</Label>
										)}
									</Stack>

									{/* Question text */}
									<Box
										sx={{
											pl: 2.5,
											borderLeft: `4px solid ${theme.palette.primary.main}`,
											mb: 3.5,
										}}
									>
										<Typography variant="h5" sx={{ lineHeight: 1.5, fontWeight: 500 }}>
											{currentQuestion.text}
										</Typography>
									</Box>

									{isQuestionAnswered && (
										<Alert severity="info" sx={{ mb: 3 }}>
											<Typography variant="body2">
												{t('evaluation-responses.history.questionAlreadyAnswered')}
											</Typography>
										</Alert>
									)}

									{/* Scale options — horizontal cards */}
									<ScaleOptions
										levels={currentQuestion.scale.levels}
										selected={selectedScaleLevel}
										disabled={isQuestionAnswered}
										onChange={setSelectedScaleLevel}
									/>

									{/* Comments — temporalmente oculto
									<Box sx={{ mt: 3 }}>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
											{t('evaluation-responses.history.comments')}{' '}
											<Typography component="span" variant="caption" color="text.disabled">
												({t('evaluation-responses.history.optional')})
											</Typography>
										</Typography>
										<TextField
											fullWidth
											multiline
											rows={3}
											value={comments}
											onChange={(e) => !isQuestionAnswered && setComments(e.target.value)}
											placeholder={t('evaluation-responses.history.commentsPlaceholder')}
											disabled={isQuestionAnswered}
										/>
									</Box>
									*/}

									{/* Navigation */}
									<Divider sx={{ mt: 3, mb: 2.5 }} />
									<Stack
										direction="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Button
											variant="outlined"
											color="inherit"
											size="large"
											onClick={handlePrevious}
											disabled={currentQuestionIndex === 0 && isFirstCompetency}
											sx={{ px: 3.5, minWidth: 130 }}
										>
											{t('evaluation-responses.history.previous')}
										</Button>

										<LoadingButton
											variant="contained"
											size="large"
											onClick={handleSaveAndNext}
											disabled={
												!currentQuestion.isOptional &&
												!selectedScaleLevel &&
												!isQuestionAnswered
											}
											loading={saving}
											endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
											sx={{ px: 3.5, minWidth: 150 }}
										>
											{currentQuestionIndex === questions.length - 1 && isLastCompetency
												? t('evaluation-responses.history.finish')
												: t('evaluation-responses.history.continue')}
										</LoadingButton>
									</Stack>
								</Box>
							)}
						</Paper>
					)}
				</Box>
			</Box>
		</Box>
	);
}
