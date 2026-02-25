'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
	QuotingProvider,
	useCurrentStep,
	useQuoting,
} from '@/context/quotingContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function QuotingHeader() {
	const {
		nextStep,
		prevStep,
		canProceed,
		goToStep,
		currentStep: stepNumber,
		steps,
	} = useQuoting();
	const { progress, isFirst, isLast } = useCurrentStep();

	return (
		<div className='bg-white border-b mx-auto p-4 md:p-6'>
			<h1 className='text-xl md:text-3xl font-bold text-center mb-2'>
				Cotizador CutForge
			</h1>

			{/* Progress bar */}
			<div className='flex justify-center items-center mb-4'>
				<div className='w-full max-w-md'>
					<div className='flex justify-between items-center mb-2 text-xs md:text-sm'>
						<span className='font-medium text-foreground'>
							Paso {stepNumber + 1} de {steps.length}
						</span>
						<span className='text-muted-foreground'>
							{Math.round(progress)}% completado
						</span>
					</div>
					<Progress value={progress} className='h-2' />
				</div>
			</div>

			{/* Mobile navigation - stacked with current step indicator */}
			<div className='flex md:hidden flex-col gap-3'>
				{/* Current step name */}
				<div className='flex justify-center'>
					<div className='px-4 py-2 bg-primary/10 rounded-lg border border-primary/30'>
						<span className='text-sm font-medium text-primary'>
							{steps[stepNumber]?.name}
						</span>
					</div>
				</div>

				{/* Navigation buttons - full width */}
				<div className='flex gap-3'>
					<Button
						variant='outline'
						onClick={prevStep}
						disabled={isFirst}
						className='flex-1 min-h-[44px]'
					>
						<ChevronLeft className='w-4 h-4 mr-1' />
						Anterior
					</Button>
					<Button
						onClick={nextStep}
						disabled={isLast || !canProceed(stepNumber + 1)}
						className='flex-1 min-h-[44px]'
					>
						{isLast ? 'Finalizar' : 'Siguiente'}
						<ChevronRight className='w-4 h-4 ml-1' />
					</Button>
				</div>
			</div>

			{/* Desktop navigation - full stepper */}
			<div className='hidden md:flex justify-between items-center gap-4'>
				<Button
					variant='outline'
					onClick={prevStep}
					disabled={isFirst}
					className='flex items-center gap-2 min-h-[44px]'
				>
					<ChevronLeft className='w-4 h-4' />
					<span>Anterior</span>
				</Button>

				<div className='flex space-x-4 flex-1 justify-center'>
					{steps.map((step, index) => {
						const clickable = index < stepNumber || canProceed(index);
						return (
							<div
								key={step.id}
								className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer
									${
										index === stepNumber
											? 'bg-primary/10 text-primary border border-primary/30'
											: index < stepNumber
											? 'bg-success/20 text-success'
											: canProceed(index)
											? 'bg-muted text-foreground hover:bg-muted/80'
											: 'bg-muted/50 text-muted-foreground/70 cursor-not-allowed'
									}`}
								onClick={() => clickable && goToStep(step.id)}
								role='button'
								tabIndex={clickable ? 0 : -1}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && clickable) goToStep(step.id);
								}}
							>
								<div
									className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
										index === stepNumber
											? 'bg-primary text-white'
											: step.completed
											? 'bg-success text-white'
											: 'bg-muted-foreground/30 text-muted-foreground'
									}`}
								>
									{step.completed ? '✓' : index + 1}
								</div>
								<span className='text-sm font-medium'>{step.name}</span>
							</div>
						);
					})}
				</div>

				<Button
					onClick={nextStep}
					disabled={isLast || !canProceed(stepNumber + 1)}
					className='flex items-center gap-2 min-h-[44px]'
				>
					<span>{isLast ? 'Finalizar' : 'Siguiente'}</span>
					<ChevronRight className='w-4 h-4' />
				</Button>
			</div>
		</div>
	);
}

function QuotingLayoutContent({ children }: { children: React.ReactNode }) {
	return (
		<div className='bg-muted/50 min-h-screen'>
			<QuotingHeader />
			<main className='max-w-6xl mx-auto px-4 py-6 md:py-8'>{children}</main>
		</div>
	);
}

export default function QuotingContent({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<QuotingProvider>
			<QuotingLayoutContent>{children}</QuotingLayoutContent>
		</QuotingProvider>
	);
}
