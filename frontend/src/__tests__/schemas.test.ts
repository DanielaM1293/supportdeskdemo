import { loginSchema, registerSchema, ticketSchema } from '../schemas';

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues.map((i) => i.message) ?? [];

describe('ticketSchema', () => {
  const valid = {
    title: 'Printer down',
    description: 'The printer on floor 2 does not respond.',
    category: 'hardware',
    priority: 'alta',
  };

  it('accepts a valid ticket', () => {
    expect(ticketSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short title/description and unknown enums', () => {
    const r = ticketSchema.safeParse({
      ...valid,
      title: 'ab',
      description: 'short',
      category: 'x',
      priority: 'urgent',
    });
    expect(r.success).toBe(false);
    expect(messages(r)).toEqual(
      expect.arrayContaining(['validation.titleMin', 'validation.descriptionMin']),
    );
  });

  it('rejects titles over 120 characters', () => {
    const r = ticketSchema.safeParse({ ...valid, title: 'a'.repeat(121) });
    expect(messages(r)).toContain('validation.titleMax');
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('flags empty and malformed values', () => {
    expect(messages(loginSchema.safeParse({ email: '', password: '' }))).toContain(
      'validation.required',
    );
    expect(messages(loginSchema.safeParse({ email: 'nope', password: 'x' }))).toContain(
      'validation.emailInvalid',
    );
  });
});

describe('registerSchema', () => {
  const valid = {
    name: 'Ana',
    email: 'a@b.com',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
  };
  it('accepts valid data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });
  it('requires 8+ character passwords', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' });
    expect(messages(r)).toContain('validation.passwordMin');
  });
  it('requires matching passwords', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'Different1' });
    expect(messages(r)).toContain('validation.passwordMismatch');
  });
});
