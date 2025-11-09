/**
 * Field Element Tests
 */

import { FieldElement, STARK_PRIME } from '../src/field';

describe('FieldElement', () => {
  const modulus = 17n;

  test('addition', () => {
    const a = new FieldElement(5n, modulus);
    const b = new FieldElement(7n, modulus);
    const sum = a.add(b);

    expect(sum.value).toBe(12n);
  });

  test('addition with overflow', () => {
    const a = new FieldElement(15n, modulus);
    const b = new FieldElement(5n, modulus);
    const sum = a.add(b);

    expect(sum.value).toBe(3n);
  });

  test('subtraction', () => {
    const a = new FieldElement(10n, modulus);
    const b = new FieldElement(3n, modulus);
    const diff = a.sub(b);

    expect(diff.value).toBe(7n);
  });

  test('subtraction with underflow', () => {
    const a = new FieldElement(3n, modulus);
    const b = new FieldElement(10n, modulus);
    const diff = a.sub(b);

    expect(diff.value).toBe(10n);
  });

  test('multiplication', () => {
    const a = new FieldElement(4n, modulus);
    const b = new FieldElement(5n, modulus);
    const product = a.mul(b);

    expect(product.value).toBe(3n);
  });

  test('division', () => {
    const a = new FieldElement(10n, modulus);
    const b = new FieldElement(5n, modulus);
    const quotient = a.div(b);

    expect(quotient.value).toBe(2n);
  });

  test('inverse', () => {
    const a = new FieldElement(5n, modulus);
    const inv = a.inverse();
    const product = a.mul(inv);

    expect(product.value).toBe(1n);
  });

  test('power', () => {
    const a = new FieldElement(2n, modulus);
    const powered = a.pow(3n);

    expect(powered.value).toBe(8n);
  });

  test('negative power', () => {
    const a = new FieldElement(2n, modulus);
    const powered = a.pow(-1n);
    const product = a.mul(powered);

    expect(product.value).toBe(1n);
  });

  test('zero element', () => {
    const zero = FieldElement.zero(modulus);

    expect(zero.value).toBe(0n);
    expect(zero.isZero()).toBe(true);
  });

  test('one element', () => {
    const one = FieldElement.one(modulus);

    expect(one.value).toBe(1n);
  });

  test('equality', () => {
    const a = new FieldElement(5n, modulus);
    const b = new FieldElement(5n, modulus);
    const c = new FieldElement(7n, modulus);

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  test('STARK_PRIME is large', () => {
    expect(STARK_PRIME > 2n ** 250n).toBe(true);
  });
});
