import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders without label', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders required indicator when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders required indicator when showRequired is true', () => {
      render(<Input label="Email" showRequired />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders error message when error prop provided', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    });

    it('renders helper text when provided', () => {
      render(<Input label="Email" helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('does not render helper text when error is present', () => {
      render(<Input label="Email" helperText="Helper" error="Error" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders left icon when provided', () => {
      render(<Input leftIcon={<span data-testid="left-icon">📧</span>} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon when provided', () => {
      render(<Input rightIcon={<span data-testid="right-icon">👁</span>} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('custom-input');
    });
  });

  describe('Interactions', () => {
    it('handles onChange events', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('updates value when typed', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'hello');

      expect(input).toHaveValue('hello');
    });

    it('handles onBlur events', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles onFocus events', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('can be focused', () => {
      render(<Input label="Test" />);
      const input = screen.getByLabelText('Test');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('handles controlled value', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(<Input value="updated" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });
  });

  describe('Accessibility', () => {
    it('has correct aria-invalid when error', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('has aria-invalid false when no error', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('has aria-describedby pointing to error', () => {
      render(<Input id="email" error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('has aria-describedby pointing to helper text', () => {
      render(<Input id="email" helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-helper');
    });

    it('label and input are properly associated', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('generates unique id when not provided', () => {
      render(<Input label="Test" />);
      const input = screen.getByLabelText('Test');
      expect(input.id).toBeTruthy();
      expect(input.id).toContain('input-');
    });

    it('uses provided id', () => {
      render(<Input label="Test" id="my-input" />);
      const input = screen.getByLabelText('Test');
      expect(input.id).toBe('my-input');
    });
  });

  describe('Input Types', () => {
    it('supports email type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('supports password type', () => {
      render(<Input type="password" data-testid="password-input" />);
      const input = screen.getByTestId('password-input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('supports number type', () => {
      render(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('supports tel type', () => {
      render(<Input type="tel" data-testid="tel-input" />);
      expect(screen.getByTestId('tel-input')).toHaveAttribute('type', 'tel');
    });

    it('supports url type', () => {
      render(<Input type="url" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'url');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards placeholder', () => {
      render(<Input placeholder="Enter value" />);
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });

    it('forwards disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('forwards readOnly', () => {
      render(<Input readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('forwards maxLength', () => {
      render(<Input maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
    });

    it('forwards minLength', () => {
      render(<Input minLength={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minLength', '5');
    });

    it('forwards pattern', () => {
      render(<Input pattern="[A-Za-z]+" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    it('forwards autoComplete', () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autoComplete', 'email');
    });

    it('forwards autoFocus', () => {
      render(<Input autoFocus />);
      expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });

    it('forwards data attributes', () => {
      render(<Input data-testid="test-input" />);
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('adds error class to container when error is present', () => {
      const { container } = render(<Input error="Error" />);
      const inputContainer = container.querySelector('[class*="hasError"]');
      expect(inputContainer).toBeInTheDocument();
    });

    it('error message has alert role', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('error message has correct id for aria-describedby', () => {
      render(<Input id="test" error="Error message" />);
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('id', 'test-error');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });
  });
});
