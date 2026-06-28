/**
 * PAGE TESTS — Screening.jsx
 * Run: npm run test:pages
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageContext } from '../../context/LanguageContext';
import Screening from '../../pages/Screening';

// Mock react-i18next so useTranslation() works in tests
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'screening.title': 'AI Breast Cancer Screening',
        'screening.subtitle': 'A tool for early diagnosis.',
        'screening.clear': 'Clear Form',
        'screening.demoData': 'Fill Demo Data',
        'screening.analyze': 'Analyze Data',
        'screening.analyzing': 'Analyzing Tissue...',
        'screening.newScan': 'New Scan',
        'screening.ready': 'Ready for Analysis',
        'screening.readyDesc': 'Complete the form.',
        'screening.diagnosisTitle': 'Predicted Diagnosis',
        'screening.malignant': 'Malignant',
        'screening.benign': 'Benign',
        'screening.nextSteps': 'Suggested Next Steps:',
        'screening.stepConsult': 'Consult an oncologist.',
        'screening.stepBiopsy': 'Perform biopsy.',
        'screening.stepFollowUp': 'Follow-up in 6 months.',
        'screening.stepRecord': 'Save result.',
        'screening.disclaimerTitle': 'Medical Disclaimer',
        'screening.disclaimerText': 'AI results for guidance only.',
      };
      return map[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock the AI service — we never make real ML calls in tests
vi.mock('../../services/aiService');
import { predictTumor } from '../../services/aiService';

function renderScreening(language = 'en') {
  return render(
    <LanguageContext.Provider value={{ language, toggleLanguage: vi.fn() }}>
      <Screening />
    </LanguageContext.Provider>
  );
}

beforeEach(() => {
  predictTumor.mockReset();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Screening — Rendering', () => {

  it('SC-01 | renders exactly 30 number input fields (3 groups × 10 features)', () => {
    renderScreening();
    const inputs = screen.getAllByPlaceholderText('0.00');
    expect(inputs).toHaveLength(30);
  });

  it('SC-02 | renders the Analyze button', () => {
    renderScreening();
    expect(screen.getByRole('button', { name: /analyze data/i })).toBeInTheDocument();
  });

  it('SC-03 | renders Fill Demo Data button', () => {
    renderScreening();
    expect(screen.getByRole('button', { name: /fill demo data/i })).toBeInTheDocument();
  });

  it('SC-04 | disclaimer section is always visible', () => {
    renderScreening();
    expect(screen.getByText(/medical disclaimer/i)).toBeInTheDocument();
  });

  it('SC-05 | Clear Form button is NOT shown when form is empty', () => {
    renderScreening();
    expect(screen.queryByRole('button', { name: /clear form/i })).not.toBeInTheDocument();
  });

});

// ─── Demo Data & Clear ────────────────────────────────────────────────────────

describe('Screening — Demo Data & Clear', () => {

  it('SC-06 | Fill Demo Data populates all 30 fields with numbers', async () => {
    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));

    const inputs = screen.getAllByPlaceholderText('0.00');
    inputs.forEach(input => {
      expect(input.value).not.toBe('');
    });
  });

  it('SC-07 | Clear Form button appears after filling data', async () => {
    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    expect(screen.getByRole('button', { name: /clear form/i })).toBeInTheDocument();
  });

  it('SC-08 | Clear Form resets all 30 fields to empty', async () => {
    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /clear form/i }));

    const inputs = screen.getAllByPlaceholderText('0.00');
    inputs.forEach(input => {
      expect(input.value).toBe('');
    });
  });

  it('SC-09 | Clear Form button disappears after clearing', async () => {
    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /clear form/i }));
    expect(screen.queryByRole('button', { name: /clear form/i })).not.toBeInTheDocument();
  });

});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('Screening — Validation', () => {

  it('SC-10 | submitting with empty fields shows validation error', async () => {
    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() =>
      expect(screen.getByText(/valid numbers/i)).toBeInTheDocument()
    );
  });

  it('SC-10b | predictTumor is NOT called when fields are empty', async () => {
    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() => expect(predictTumor).not.toHaveBeenCalled());
  });

});

// ─── Results ─────────────────────────────────────────────────────────────────

describe('Screening — Results', () => {

  it('SC-11 | valid data → calls predictTumor exactly once', async () => {
    predictTumor.mockResolvedValue({ diagnosis: 'benign', confidence: 0.97 });

    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() => expect(predictTumor).toHaveBeenCalledTimes(1));
  });

  it('SC-12 | malignant result → red Malignant badge shown', async () => {
    predictTumor.mockResolvedValue({ diagnosis: 'malignant', confidence: 0.92 });

    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() =>
      expect(screen.getByText(/malignant/i)).toBeInTheDocument()
    );
  });

  it('SC-13 | benign result → green Benign badge shown', async () => {
    predictTumor.mockResolvedValue({ diagnosis: 'benign', confidence: 0.97 });

    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() =>
      expect(screen.getByText(/benign/i)).toBeInTheDocument()
    );
  });

  it('SC-14 | API error → error message shown in result panel', async () => {
    predictTumor.mockRejectedValue(new Error('Connection failed'));

    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() =>
      expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
    );
  });

  it('SC-15 | after result, "New Scan" button resets form and result', async () => {
    predictTumor.mockResolvedValue({ diagnosis: 'benign', confidence: 0.9 });

    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() => screen.getByText(/benign/i));
    await userEvent.click(screen.getByRole('button', { name: /new scan/i }));

    // Result should be gone and form should be clear
    expect(screen.queryByText(/benign/i)).not.toBeInTheDocument();
    const inputs = screen.getAllByPlaceholderText('0.00');
    inputs.forEach(input => expect(input.value).toBe(''));
  });

});

// ─── Loading State ────────────────────────────────────────────────────────────

describe('Screening — Loading State', () => {

  it('SC-16 | loading spinner shown while analyzing', async () => {
    // Delay response to catch loading state
    predictTumor.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ diagnosis: 'benign' }), 300)));

    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));
    await userEvent.click(screen.getByRole('button', { name: /analyze data/i }));

    await waitFor(() =>
      expect(screen.getByText(/analyzing tissue/i)).toBeInTheDocument()
    );
  });

  it('SC-17 | Analyze button is disabled while loading', async () => {
    predictTumor.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ diagnosis: 'benign' }), 300)));

    renderScreening();
    await userEvent.click(screen.getByRole('button', { name: /fill demo data/i }));

    const analyzeBtn = screen.getByRole('button', { name: /analyze data/i });
    await userEvent.click(analyzeBtn);

    await waitFor(() => expect(analyzeBtn).toBeDisabled());
  });

});
