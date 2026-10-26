import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitleBar } from '../components/TitleBar';

describe('TitleBar Theme Switcher', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  it('renders theme switcher in TitleBar with dark mode by default', () => {
    render(<TitleBar totalNotes={5} theme="dark" />);

    // Switcher should have role="button" with title to switch mode
    const switcher = screen.getByRole('button', { name: /switch to light mode/i });
    expect(switcher).toBeDefined();
    expect(screen.getByText('Dark')).toBeDefined();
  });

  it('triggers onToggleTheme when switcher is clicked', () => {
    const handleToggle = vi.fn();
    render(<TitleBar totalNotes={5} theme="dark" onToggleTheme={handleToggle} />);

    const switcher = screen.getByRole('button', { name: /switch to light mode/i });
    fireEvent.click(switcher);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('displays Light active badge when in light mode', () => {
    render(<TitleBar totalNotes={5} theme="light" />);

    const switcher = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(switcher).toBeDefined();
    expect(screen.getByText('Light')).toBeDefined();
  });

  it('updates self-contained theme and local storage if onToggleTheme not supplied', () => {
    render(<TitleBar totalNotes={5} />);

    const switcher = screen.getByRole('button', { name: /switch to light mode/i });
    fireEvent.click(switcher);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('aura_notes_theme')).toBe('light');
  });
});
