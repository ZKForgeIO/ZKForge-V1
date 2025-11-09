/**
 * zkSTARK Prover
 *
 * Generates zero-knowledge proofs for computational statements.
 * The prover demonstrates knowledge of a witness satisfying constraints
 * without revealing the witness itself.
 */

import { FieldElement, STARK_PRIME } from './field';
import { Polynomial } from './polynomial';
import { MerkleTree } from './merkle';
import { sha256 } from '@noble/hashes/sha256';

export interface Statement {
  publicInput: FieldElement[];
  constraints: Constraint[];
}

export interface Constraint {
  evaluate: (trace: FieldElement[]) => FieldElement;
}

export interface Witness {
  privateInput: FieldElement[];
  trace: FieldElement[];
}

export interface Proof {
  commitment: Uint8Array;
  evaluations: FieldElement[];
  merkleProofs: string[];
  queryIndices: number[];
  friCommitments: Uint8Array[];
  polynomialDegree: number;
}

export class StarkProver {
  statement: Statement;
  witness: Witness;
  securityParameter: number;

  constructor(statement: Statement, witness: Witness, securityParameter: number = 128) {
    this.statement = statement;
    this.witness = witness;
    this.securityParameter = securityParameter;
  }

  generateProof(): Proof {
    const trace = this.witness.trace;

    const tracePolynomial = this.interpolateTrace(trace);

    const constraintPolynomials = this.evaluateConstraints(tracePolynomial);

    const compositionPolynomial = this.combineConstraints(constraintPolynomials);

    const domain = this.getEvaluationDomain(compositionPolynomial.degree() * 4);

    const evaluations = domain.map(point => compositionPolynomial.evaluate(point));

    const commitment = this.commitToEvaluations(evaluations);

    const challenge = this.generateChallenge(commitment);

    const numQueries = Math.ceil(this.securityParameter / Math.log2(domain.length));
    const queryIndices = this.generateQueryIndices(challenge, numQueries, domain.length);

    const queriedEvaluations = queryIndices.map(i => evaluations[i]);

    const merkleTree = new MerkleTree(
      evaluations.map(e => this.fieldToBytes(e))
    );

    const merkleProofs = queryIndices.map(i =>
      this.serializeMerkleProof(merkleTree.getProof(i))
    );

    const friCommitments = this.generateFriCommitments(
      compositionPolynomial,
      domain,
      challenge
    );

    return {
      commitment,
      evaluations: queriedEvaluations,
      merkleProofs,
      queryIndices,
      friCommitments,
      polynomialDegree: compositionPolynomial.degree()
    };
  }

  private interpolateTrace(trace: FieldElement[]): Polynomial {
    const points: [FieldElement, FieldElement][] = trace.map((value, index) => [
      new FieldElement(BigInt(index), STARK_PRIME),
      value
    ]);

    return Polynomial.interpolate(points);
  }

  private evaluateConstraints(tracePolynomial: Polynomial): Polynomial[] {
    return this.statement.constraints.map(constraint => {
      const evaluations: FieldElement[] = [];

      for (let i = 0; i < this.witness.trace.length; i++) {
        const point = new FieldElement(BigInt(i), STARK_PRIME);
        const traceValue = tracePolynomial.evaluate(point);
        evaluations.push(constraint.evaluate([traceValue]));
      }

      const points: [FieldElement, FieldElement][] = evaluations.map((value, index) => [
        new FieldElement(BigInt(index), STARK_PRIME),
        value
      ]);

      return Polynomial.interpolate(points);
    });
  }

  private combineConstraints(polynomials: Polynomial[]): Polynomial {
    if (polynomials.length === 0) {
      return Polynomial.zero(STARK_PRIME);
    }

    let result = polynomials[0];

    for (let i = 1; i < polynomials.length; i++) {
      const randomCoef = this.generateRandomFieldElement();
      result = result.add(polynomials[i].scalarMul(randomCoef));
    }

    return result;
  }

  private getEvaluationDomain(size: number): FieldElement[] {
    const domainSize = this.nextPowerOfTwo(size);
    const generator = this.findPrimitiveRoot(domainSize);
    const domain: FieldElement[] = [];

    let current = FieldElement.one(STARK_PRIME);
    for (let i = 0; i < domainSize; i++) {
      domain.push(current);
      current = current.mul(generator);
    }

    return domain;
  }

  private commitToEvaluations(evaluations: FieldElement[]): Uint8Array {
    const leaves = evaluations.map(e => this.fieldToBytes(e));
    const tree = new MerkleTree(leaves);
    return tree.getRoot();
  }

  private generateChallenge(commitment: Uint8Array): bigint {
    const hash = sha256(commitment);
    let result = 0n;
    for (let i = 0; i < 32; i++) {
      result = (result << 8n) | BigInt(hash[i]);
    }
    return result % STARK_PRIME;
  }

  private generateQueryIndices(seed: bigint, count: number, max: number): number[] {
    const indices: number[] = [];
    let current = seed;

    while (indices.length < count) {
      const hash = sha256(this.bigIntToBytes(current));
      let value = 0n;
      for (let i = 0; i < 8; i++) {
        value = (value << 8n) | BigInt(hash[i]);
      }

      const index = Number(value % BigInt(max));
      if (!indices.includes(index)) {
        indices.push(index);
      }

      current = (current + 1n) % STARK_PRIME;
    }

    return indices;
  }

  private generateFriCommitments(
    polynomial: Polynomial,
    domain: FieldElement[],
    challenge: bigint
  ): Uint8Array[] {
    const commitments: Uint8Array[] = [];
    let currentPoly = polynomial;

    while (currentPoly.degree() > 0) {
      const evaluations = domain.map(point => currentPoly.evaluate(point));
      const commitment = this.commitToEvaluations(evaluations);
      commitments.push(commitment);

      currentPoly = this.foldPolynomial(currentPoly, new FieldElement(challenge, STARK_PRIME));
    }

    return commitments;
  }

  private foldPolynomial(poly: Polynomial, alpha: FieldElement): Polynomial {
    const evenCoeffs: FieldElement[] = [];
    const oddCoeffs: FieldElement[] = [];

    for (let i = 0; i < poly.coefficients.length; i++) {
      if (i % 2 === 0) {
        evenCoeffs.push(poly.coefficients[i]);
      } else {
        oddCoeffs.push(poly.coefficients[i]);
      }
    }

    const evenPoly = new Polynomial(evenCoeffs.length > 0 ? evenCoeffs : [FieldElement.zero(STARK_PRIME)]);
    const oddPoly = new Polynomial(oddCoeffs.length > 0 ? oddCoeffs : [FieldElement.zero(STARK_PRIME)]);

    return evenPoly.add(oddPoly.scalarMul(alpha));
  }

  private nextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  private findPrimitiveRoot(order: number): FieldElement {
    const phi = STARK_PRIME - 1n;
    const requiredOrder = phi / BigInt(order);

    for (let g = 2n; g < STARK_PRIME; g++) {
      const element = new FieldElement(g, STARK_PRIME);
      const powered = element.pow(requiredOrder);

      if (!powered.equals(FieldElement.one(STARK_PRIME))) {
        continue;
      }

      const check = element.pow(requiredOrder / 2n);
      if (!check.equals(FieldElement.one(STARK_PRIME))) {
        return element;
      }
    }

    throw new Error('Could not find primitive root');
  }

  private generateRandomFieldElement(): FieldElement {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);

    let value = 0n;
    for (const byte of randomBytes) {
      value = (value << 8n) | BigInt(byte);
    }

    return new FieldElement(value, STARK_PRIME);
  }

  private fieldToBytes(element: FieldElement): Uint8Array {
    return this.bigIntToBytes(element.value);
  }

  private bigIntToBytes(value: bigint): Uint8Array {
    const hex = value.toString(16).padStart(64, '0');
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  private serializeMerkleProof(proof: any): string {
    return JSON.stringify({
      leaf: Array.from(proof.leaf),
      proof: proof.proof.map((p: any) => ({
        hash: Array.from(p.hash),
        position: p.position
      })),
      root: Array.from(proof.root)
    });
  }
}
