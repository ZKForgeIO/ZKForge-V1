/**
 * Finite Field Arithmetic for zkSTARK
 *
 * Implements arithmetic operations over a prime field F_p.
 * This is the foundation for all zkSTARK operations.
 */

export class FieldElement {
  value: bigint;
  modulus: bigint;

  constructor(value: bigint, modulus: bigint) {
    this.modulus = modulus;
    this.value = this.mod(value);
  }

  private mod(n: bigint): bigint {
    const result = n % this.modulus;
    return result >= 0n ? result : result + this.modulus;
  }

  add(other: FieldElement): FieldElement {
    if (this.modulus !== other.modulus) {
      throw new Error('Cannot add elements from different fields');
    }
    return new FieldElement(this.value + other.value, this.modulus);
  }

  sub(other: FieldElement): FieldElement {
    if (this.modulus !== other.modulus) {
      throw new Error('Cannot subtract elements from different fields');
    }
    return new FieldElement(this.value - other.value, this.modulus);
  }

  mul(other: FieldElement): FieldElement {
    if (this.modulus !== other.modulus) {
      throw new Error('Cannot multiply elements from different fields');
    }
    return new FieldElement(this.value * other.value, this.modulus);
  }

  div(other: FieldElement): FieldElement {
    if (this.modulus !== other.modulus) {
      throw new Error('Cannot divide elements from different fields');
    }
    return this.mul(other.inverse());
  }

  pow(exponent: bigint): FieldElement {
    if (exponent < 0n) {
      return this.inverse().pow(-exponent);
    }

    let result = new FieldElement(1n, this.modulus);
    let base = this;
    let exp = exponent;

    while (exp > 0n) {
      if (exp % 2n === 1n) {
        result = result.mul(base);
      }
      base = base.mul(base);
      exp = exp / 2n;
    }

    return result;
  }

  inverse(): FieldElement {
    if (this.value === 0n) {
      throw new Error('Cannot invert zero');
    }

    const [gcd, x] = this.extendedGcd(this.value, this.modulus);

    if (gcd !== 1n) {
      throw new Error('Element is not invertible');
    }

    return new FieldElement(x, this.modulus);
  }

  private extendedGcd(a: bigint, b: bigint): [bigint, bigint] {
    if (b === 0n) {
      return [a, 1n];
    }

    let [oldR, r] = [a, b];
    let [oldS, s] = [1n, 0n];

    while (r !== 0n) {
      const quotient = oldR / r;
      [oldR, r] = [r, oldR - quotient * r];
      [oldS, s] = [s, oldS - quotient * s];
    }

    return [oldR, oldS];
  }

  neg(): FieldElement {
    return new FieldElement(-this.value, this.modulus);
  }

  equals(other: FieldElement): boolean {
    return this.value === other.value && this.modulus === other.modulus;
  }

  isZero(): boolean {
    return this.value === 0n;
  }

  toString(): string {
    return this.value.toString();
  }

  static zero(modulus: bigint): FieldElement {
    return new FieldElement(0n, modulus);
  }

  static one(modulus: bigint): FieldElement {
    return new FieldElement(1n, modulus);
  }
}

/**
 * Standard prime field for zkSTARK
 * Using a 256-bit prime for strong security
 */
export const STARK_PRIME = 2n ** 251n + 17n * 2n ** 192n + 1n;

export function createField(value: bigint): FieldElement {
  return new FieldElement(value, STARK_PRIME);
}
