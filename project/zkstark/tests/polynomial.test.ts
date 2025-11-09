/**
 * Polynomial Tests
 */

import { FieldElement } from '../src/field';
import { Polynomial } from '../src/polynomial';

describe('Polynomial', () => {
  const modulus = 17n;

  test('evaluation', () => {
    const coeffs = [
      new FieldElement(1n, modulus),
      new FieldElement(2n, modulus),
      new FieldElement(3n, modulus)
    ];
    const poly = new Polynomial(coeffs);

    const x = new FieldElement(2n, modulus);
    const result = poly.evaluate(x);

    expect(result.value).toBe(0n);
  });

  test('addition', () => {
    const p1 = new Polynomial([
      new FieldElement(1n, modulus),
      new FieldElement(2n, modulus)
    ]);
    const p2 = new Polynomial([
      new FieldElement(3n, modulus),
      new FieldElement(4n, modulus)
    ]);

    const sum = p1.add(p2);

    expect(sum.coefficients[0].value).toBe(4n);
    expect(sum.coefficients[1].value).toBe(6n);
  });

  test('multiplication', () => {
    const p1 = new Polynomial([
      new FieldElement(1n, modulus),
      new FieldElement(2n, modulus)
    ]);
    const p2 = new Polynomial([
      new FieldElement(3n, modulus),
      new FieldElement(4n, modulus)
    ]);

    const product = p1.mul(p2);

    expect(product.coefficients.length).toBe(3);
    expect(product.coefficients[0].value).toBe(3n);
    expect(product.coefficients[1].value).toBe(10n);
    expect(product.coefficients[2].value).toBe(8n);
  });

  test('interpolation', () => {
    const points: [FieldElement, FieldElement][] = [
      [new FieldElement(0n, modulus), new FieldElement(1n, modulus)],
      [new FieldElement(1n, modulus), new FieldElement(2n, modulus)],
      [new FieldElement(2n, modulus), new FieldElement(5n, modulus)]
    ];

    const poly = Polynomial.interpolate(points);

    for (const [x, y] of points) {
      expect(poly.evaluate(x).equals(y)).toBe(true);
    }
  });

  test('degree', () => {
    const poly = new Polynomial([
      new FieldElement(1n, modulus),
      new FieldElement(2n, modulus),
      new FieldElement(3n, modulus)
    ]);

    expect(poly.degree()).toBe(2);
  });

  test('zero polynomial', () => {
    const zero = Polynomial.zero(modulus);

    expect(zero.isZero()).toBe(true);
    expect(zero.degree()).toBe(0);
  });
});
