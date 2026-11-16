import { screen } from '@testing-library/react';
import { SlaBadge } from '../components/ui/Badges';
import { renderWithProviders } from '../test/utils';
import type { SlaState } from '../types';

const EXPECTED: [SlaState, string][] = [
  ['ok', 'On track'],
  ['at_risk', 'At risk'],
  ['breached', 'Breached'],
  ['met', 'Met'],
];

describe('SlaBadge', () => {
  it.each(EXPECTED)('renders visible text for the %s state', (state, text) => {
    renderWithProviders(<SlaBadge state={state} />);
    const el = screen.getByText(text);
    expect(el).toBeInTheDocument();
    expect(el.closest('[data-state]')).toHaveAttribute('data-state', state);
  });
});
