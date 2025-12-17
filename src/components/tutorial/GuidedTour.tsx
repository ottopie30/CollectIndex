'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

// Tour step definition
type TourStep = {
    target: string // CSS selector
    title: string
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right'
}

// Default tour steps for first-time users
export const defaultTourSteps: TourStep[] = [
    {
        target: '[data-tour="search"]',
        title: 'Recherche de Cartes',
        content: 'Utilisez la barre de recherche pour trouver n\'importe quelle carte Pokémon. Tapez le nom du Pokémon ou le numéro de la carte.',
        position: 'bottom'
    },
    {
        target: '[data-tour="score-gauge"]',
        title: 'Score de Spéculation',
        content: 'Ce score de 0 à 100 indique le niveau de spéculation. Vert = investissement sûr, Rouge = spéculation élevée.',
        position: 'right'
    },
    {
        target: '[data-tour="dimensions"]',
        title: 'Les 5 Dimensions',
        content: 'Notre algorithme analyse 5 dimensions: Volatilité, Croissance, Rareté, Sentiment, et Macro pour calculer le score.',
        position: 'left'
    },
    {
        target: '[data-tour="price-chart"]',
        title: 'Historique des Prix',
        content: 'Visualisez l\'évolution du prix sur 90 jours pour identifier les tendances et les anomalies.',
        position: 'top'
    }
]

// Context for tour state
type TourContextType = {
    isActive: boolean
    currentStep: number
    steps: TourStep[]
    startTour: (steps?: TourStep[]) => void
    endTour: () => void
    nextStep: () => void
    prevStep: () => void
    skipTour: () => void
}

const TourContext = createContext<TourContextType | null>(null)

export function useTour() {
    const context = useContext(TourContext)
    if (!context) {
        throw new Error('useTour must be used within a TourProvider')
    }
    return context
}

// Tour Provider Component
export function TourProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [steps, setSteps] = useState<TourStep[]>(defaultTourSteps)

    const startTour = (customSteps?: TourStep[]) => {
        setSteps(customSteps || defaultTourSteps)
        setCurrentStep(0)
        setIsActive(true)
    }

    const endTour = () => {
        setIsActive(false)
        setCurrentStep(0)
        // Mark tour as completed in localStorage
        localStorage.setItem('altum_tour_completed', 'true')
    }

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            endTour()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const skipTour = () => {
        endTour()
    }

    return (
        <TourContext.Provider value={{
            isActive,
            currentStep,
            steps,
            startTour,
            endTour,
            nextStep,
            prevStep,
            skipTour
        }}>
            {children}
            {isActive && <TourOverlay />}
        </TourContext.Provider>
    )
}

// Tour Overlay Component
function TourOverlay() {
    const { currentStep, steps, nextStep, prevStep, skipTour, endTour } = useTour()
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })

    const step = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1

    useEffect(() => {
        const element = document.querySelector(step.target)
        if (element) {
            const rect = element.getBoundingClientRect()
            setPosition({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
            })

            // Scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [step.target])

    // Calculate tooltip position
    const getTooltipStyle = () => {
        const padding = 20
        const tooltipWidth = 320

        switch (step.position) {
            case 'bottom':
                return {
                    top: position.top + position.height + padding,
                    left: position.left + (position.width / 2) - (tooltipWidth / 2)
                }
            case 'top':
                return {
                    top: position.top - padding - 180,
                    left: position.left + (position.width / 2) - (tooltipWidth / 2)
                }
            case 'left':
                return {
                    top: position.top + (position.height / 2) - 80,
                    left: position.left - tooltipWidth - padding
                }
            case 'right':
            default:
                return {
                    top: position.top + (position.height / 2) - 80,
                    left: position.left + position.width + padding
                }
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/70 z-[9998]" onClick={skipTour} />

            {/* Spotlight on target element */}
            <div
                className="fixed z-[9999] pointer-events-none"
                style={{
                    top: position.top - 8,
                    left: position.left - 8,
                    width: position.width + 16,
                    height: position.height + 16,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                    borderRadius: '12px',
                    border: '2px solid rgba(147, 51, 234, 0.8)'
                }}
            />

            {/* Tooltip */}
            <div
                className="fixed z-[10000] w-80 glass rounded-2xl p-6 border border-purple-500/30"
                style={getTooltipStyle()}
            >
                {/* Close button */}
                <button
                    onClick={skipTour}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Progress indicator */}
                <div className="flex items-center gap-2 mb-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentStep ? 'bg-purple-500' : 'bg-white/20'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/70 text-sm mb-6">{step.content}</p>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Précédent
                    </button>

                    <button
                        onClick={isLastStep ? endTour : nextStep}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        {isLastStep ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Terminer
                            </>
                        ) : (
                            <>
                                Suivant
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}

// Component to trigger tour for first-time users
export function FirstTimeTourTrigger() {
    const { startTour, isActive } = useTour()

    useEffect(() => {
        const tourCompleted = localStorage.getItem('altum_tour_completed')
        if (!tourCompleted && !isActive) {
            // Delay to let the page render
            const timer = setTimeout(() => startTour(), 1500)
            return () => clearTimeout(timer)
        }
    }, [startTour, isActive])

    return null
}

// Button component to manually start tour
export function StartTourButton() {
    const { startTour } = useTour()

    return (
        <button
            onClick={() => startTour()}
            className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
        >
            Voir le tutorial
        </button>
    )
}
