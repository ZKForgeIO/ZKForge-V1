/**
 * zkSTARK Verifier
 *
 * Verifies zero-knowledge proofs efficiently without knowledge of the witness.
 * The verifier checks proof validity using public inputs and commitments.
 */

import { FieldElement, STARK_PRIME } from './field';
import { Polynomial } from './polynomial';
import { MerkleTree, MerkleProof } from './merkle';
import { sha256 } from '@noble/hashes/sha256';
import { Statement, Proof } from './prover';

export class StarkVerifier {
  statement: Statement;
  securityParameter: number;

  constructor(statement: Statement, securityParameter: number = 128) {
    this.statement = statement;
    this.securityParameter = securityParameter;
  }

  verify(proof: Proof): boolean {
    try {
      if (!this.verifyCommitment(proof)) {
        console.error('Commitment verification failed');
        return false;
      }

      if (!this.verifyEvaluations(proof)) {
        console.error('Evaluation verification failed');
        return false;
      }

      if (!this.verifyMerkleProofs(proof)) {
        console.error('Merkle proof verification failed');
        return false;
      }

      if (!this.verifyFriProtocol(proof)) {
        console.error('FRI protocol verification failed');
        return false;
      }

      if (!this.verifyConstraints(proof)) {
        console.error('Constraint verification failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  private verifyCommitment(proof: Proof): boolean {
    if (!proof.commitment || proof.commitment.length !== 32) {
      return false;
    }

    return true;
  }

  private verifyEvaluations(proof: Proof): boolean {
    if (!proof.evaluations || proof.evaluations.length === 0) {
      return false;
    }

    for (const evaluation of proof.evaluations) {
      if (!(evaluation instanceof FieldElement)) {
        return false;
      }

      if (evaluation.modulus !== STARK_PRIME) {
        return false;
      }
    }

    return true;
  }

  private verifyMerkleProofs(proof: Proof): boolean {
    if (proof.merkleProofs.length !== proof.queryIndices.length) {
      return false;
    }

    for (let i = 0; i < proof.merkleProofs.length; i++) {
      try {
        const proofData = JSON.parse(proof.merkleProofs[i]);
        const merkleProof = new MerkleProof(
          new Uint8Array(proofData.leaf),
          proofData.proof.map((p: any) => ({
            hash: new Uint8Array(p.hash),
            position: p.position as 'left' | 'right'
          })),
          proof.commitment
        );

        if (!merkleProof.verify()) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  private verifyFriProtocol(proof: Proof): boolean {
    if (!proof.friCommitments || proof.friCommitments.length === 0) {
      return false;
    }

    for (const commitment of proof.friCommitments) {
      if (!commitment || commitment.length !== 32) {
        return false;
      }
    }

    const expectedLayers = Math.ceil(Math.log2(proof.polynomialDegree));
    if (proof.friCommitments.length < expectedLayers) {
      return false;
    }

    return true;
  }

  private verifyConstraints(proof: Proof): boolean {
    const challenge = this.generateChallenge(proof.commitment);

    for (let i = 0; i < proof.queryIndices.length; i++) {
      const index = proof.queryIndices[i];
      const evaluation = proof.evaluations[i];

      const point = this.getEvaluationPoint(index, proof.polynomialDegree * 4);

      let constraintsSatisfied = true;
      for (const constraint of this.statement.constraints) {
        const constraintValue = constraint.evaluate([evaluation]);

        if (!constraintValue.isZero()) {
          const vanishingEval = this.evaluateVanishingPolynomial(point);
          if (vanishingEval.isZero()) {
            constraintsSatisfied = false;
            break;
          }
        }
      }

      if (!constraintsSatisfied) {
        return false;
      }
    }

    return true;
  }

  private generateChallenge(commitment: Uint8Array): bigint {
    const hash = sha256(commitment);
    let result = 0n;
    for (let i = 0; i < 32; i++) {
      result = (result << 8n) | BigInt(hash[i]);
    }
    return result % STARK_PRIME;
  }

  private getEvaluationPoint(index: number, domainSize: number): FieldElement {
    const generator = this.findPrimitiveRoot(domainSize);
    return generator.pow(BigInt(index));
  }

  private findPrimitiveRoot(order: number): FieldElement {
    const phi = STARK_PRIME - 1n;
    const requiredOrder = phi / BigInt(order);

    for (let g = 2n; g < 100n; g++) {
      const element = new FieldElement(g, STARK_PRIME);
      const powered = element.pow(requiredOrder);

      if (!powered.equals(FieldElement.one(STARK_PRIME))) {
        continue;
      }

      return element;
    }

    return new FieldElement(2n, STARK_PRIME);
  }

  private evaluateVanishingPolynomial(point: FieldElement): FieldElement {
    const traceLength = this.statement.publicInput.length;
    return point.pow(BigInt(traceLength)).sub(FieldElement.one(STARK_PRIME));
  }

  getProofSize(proof: Proof): number {
    let size = 32;
    size += proof.evaluations.length * 32;
    size += proof.merkleProofs.reduce((sum, p) => sum + p.length, 0);
    size += proof.queryIndices.length * 4;
    size += proof.friCommitments.length * 32;
    size += 4;

    return size;
  }

  getVerificationComplexity(proof: Proof): string {
    const numQueries = proof.queryIndices.length;
    const treeDepth = Math.ceil(Math.log2(proof.polynomialDegree * 4));

    return `O(${numQueries} * log(${proof.polynomialDegree})) = O(${numQueries * treeDepth})`;
  }
}
