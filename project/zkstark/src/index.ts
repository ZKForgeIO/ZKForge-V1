/**
 * ZKForge zkSTARK Library
 *
 * A TypeScript implementation of zkSTARK (Zero-Knowledge Scalable Transparent
 * Arguments of Knowledge) for building privacy-preserving applications.
 *
 * @module zkstark
 */

export { FieldElement, STARK_PRIME, createField } from './field';
export { Polynomial } from './polynomial';
export { MerkleTree, MerkleProof } from './merkle';
export { StarkProver, Statement, Constraint, Witness, Proof } from './prover';
export { StarkVerifier } from './verifier';

export const VERSION = '1.0.0';
