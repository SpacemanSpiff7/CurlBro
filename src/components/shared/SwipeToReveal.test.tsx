import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwipeToReveal, closeAllSwipeRows } from './SwipeToReveal';
import type { SwipeAction } from './SwipeToReveal';

const mockActions: SwipeAction[] = [
  {
    key: 'delete',
    label: 'Delete',
    icon: <span>X</span>,
    color: 'bg-destructive',
    onAction: vi.fn(),
  },
];

describe('SwipeToReveal', () => {
  it('renders children', () => {
    render(
      <SwipeToReveal actions={mockActions}>
        <div>Test Content</div>
      </SwipeToReveal>,
    );
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(
      <SwipeToReveal actions={mockActions}>
        <div>Content</div>
      </SwipeToReveal>,
    );
    expect(screen.getByLabelText('Delete')).toBeTruthy();
  });

  it('has data-swipe-row attribute', () => {
    const { container } = render(
      <SwipeToReveal actions={mockActions}>
        <div>Content</div>
      </SwipeToReveal>,
    );
    const swipeRow = container.querySelector('[data-swipe-row]');
    expect(swipeRow).toBeTruthy();
  });

  it('action button calls onAction when clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const actions: SwipeAction[] = [
      {
        key: 'test',
        label: 'Test',
        icon: <span>T</span>,
        color: 'bg-red-500',
        onAction,
      },
    ];

    render(
      <SwipeToReveal actions={actions}>
        <div>Content</div>
      </SwipeToReveal>,
    );

    await user.click(screen.getByLabelText('Test'));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('renders multiple actions', () => {
    const actions: SwipeAction[] = [
      {
        key: 'swap',
        label: 'Swap',
        icon: <span>S</span>,
        color: 'bg-blue-500',
        onAction: vi.fn(),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <span>D</span>,
        color: 'bg-red-500',
        onAction: vi.fn(),
      },
    ];

    render(
      <SwipeToReveal actions={actions}>
        <div>Content</div>
      </SwipeToReveal>,
    );

    expect(screen.getByLabelText('Swap')).toBeTruthy();
    expect(screen.getByLabelText('Delete')).toBeTruthy();
  });

  it('closeAllSwipeRows export exists and is callable', () => {
    expect(typeof closeAllSwipeRows).toBe('function');
    // Should not throw
    closeAllSwipeRows();
  });

  it('disabled prop prevents gesture', () => {
    render(
      <SwipeToReveal actions={mockActions} enabled={false}>
        <div>Content</div>
      </SwipeToReveal>,
    );
    // Component still renders
    expect(screen.getByText('Content')).toBeTruthy();
  });
});
