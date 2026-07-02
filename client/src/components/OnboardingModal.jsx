import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useFocusTrap from '../hooks/useFocusTrap';
import '../styles/onboarding.css';

const steps = [
  {
    title: 'Start with your Profile',
    description:
      'Set your weekly target hours, preferred study time, and availability first. AI uses this information to suggest more realistic tasks.',
  },
  {
    title: 'Create a Learning Goal',
    description:
      'Go to the Goals page and define what you want to learn. Add a deadline so the app can help schedule tasks properly.',
  },
  {
    title: 'Use AI Suggest Task',
    description:
      'If you are unsure where to start, use AI Suggest Task. AI will break your goal into smaller tasks with dates, slots, duration, and rationale.',
  },
  {
    title: 'Review before accepting',
    description:
      'AI suggestions are not saved automatically. You can accept, reject, or edit tasks, so final control stays with you.',
  },
  {
    title: 'Plan with Calendar and Progress',
    description:
      'Use the Calendar to view or drag tasks into different slots. Use Progress to track completed learning hours and weekly progress.',
  },
];

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const onboardingModalRef = useFocusTrap(true, () => finishTutorial());

  const isLastStep = activeStep === steps.length - 1;
  const currentStep = steps[activeStep];

  function finishTutorial(path = null) {
    localStorage.removeItem('showOnboarding');
    onClose?.();

    if (path) {
      navigate(path);
    }
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true">
      <div
        ref={onboardingModalRef}
        className="onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className="onboarding-close"
          onClick={() => finishTutorial()}
          aria-label="Close onboarding tutorial"
          title="Close"
        >
          ×
        </button>

        <div className="onboarding-header">
          <span className="onboarding-badge">New User Guide</span>
          <h2 id="onboarding-title">Welcome to PlanIt</h2>
          <p>
            Before creating goals, set your profile preferences so the AI can
            generate better learning tasks.
          </p>
        </div>

        <div className="onboarding-progress" aria-label="Tutorial progress">
          {steps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              className={index === activeStep ? 'active' : ''}
              onClick={() => setActiveStep(index)}
              aria-label={`Go to tutorial step ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="onboarding-step-card">
          <span>Step {activeStep + 1}</span>
          <h3>{currentStep.title}</h3>
          <p>{currentStep.description}</p>
        </div>

        <div className="onboarding-feature-grid">
          <div>
            <strong>Profile</strong>
            <p>Set preferences and availability.</p>
          </div>

          <div>
            <strong>Goals</strong>
            <p>Create goals and tasks.</p>
          </div>

          <div>
            <strong>AI</strong>
            <p>Break goals into task suggestions.</p>
          </div>

          <div>
            <strong>Calendar</strong>
            <p>Plan weekly learning schedule.</p>
          </div>
        </div>

        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-secondary-button"
            onClick={() => finishTutorial()}
          >
            Skip for now
          </button>

          <div className="onboarding-right-actions">
            {activeStep > 0 && (
              <button
                type="button"
                className="onboarding-secondary-button"
                onClick={() => setActiveStep((prev) => prev - 1)}
              >
                Back
              </button>
            )}

            {isLastStep ? (
              <button
                type="button"
                className="onboarding-primary-button"
                onClick={() => finishTutorial('/profile')}
              >
                Go to Profile
              </button>
            ) : (
              <button
                type="button"
                className="onboarding-primary-button"
                onClick={() => setActiveStep((prev) => prev + 1)}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}