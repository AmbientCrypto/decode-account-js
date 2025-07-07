import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import layout from 'buffer-layout';

// --- Data Structures ---

const PUBKEY_BYTES = 32;
const MAX_IPFS_CID_LENGTH = 96;
const VERIFIERS_PER_AUCTION = 1;

const publicKey = (property = 'publicKey') => {
  return layout.blob(PUBKEY_BYTES, property);
};

const JobRequestStatus = {
    0: 'WaitingForOutput',
    1: 'OutputReceived',
    2: 'OutputVerified',
};

const JobVerificationStateEnum = {
    0: 'NotStarted',
    1: 'InProgress',
    2: 'Completed',
};

const VerificationStateLayout = layout.struct(
  [
    layout.blob(32, 'merkle_root'),
    layout.seq(publicKey(), VERIFIERS_PER_AUCTION, 'assigned_verifiers'),
    layout.seq(layout.nu64(), VERIFIERS_PER_AUCTION * 2, 'assigned_verifiers_token_ranges'),
    layout.seq(layout.nu64(), VERIFIERS_PER_AUCTION, 'verifier_states'),
    layout.seq(layout.nu64(), VERIFIERS_PER_AUCTION, 'verified_tokens'),
  ],
  'verification'
);

const JobRequestLayout = layout.struct([
  publicKey('bundle'),
  layout.nu64('max_price_per_output_token'),
  layout.nu64('max_output_tokens'),
  layout.nu64('context_length_tier'),
  layout.nu64('expiry_duration_tier'),
  publicKey('authority'),
  layout.blob(PUBKEY_BYTES, 'input_hash'),
  layout.blob(MAX_IPFS_CID_LENGTH, 'output_ipfs_cid'),
  layout.blob(PUBKEY_BYTES, 'seed'),
  layout.nu64('bump'),
  layout.nu64('output_token_count'),
  layout.nu64('input_token_count'),
  layout.nu64('status'),
  VerificationStateLayout,
]);


// --- Main Logic ---

async function main() {
  const accountId = process.argv[2];
  if (!accountId) {
    console.error('Please provide a JobRequest account ID.');
    process.exit(1);
  }

  try {
    const VALIDATOR = 'https://bootstrap-1.7n3i8m4.xyz';
    const connection = new Connection(VALIDATOR);
    const accountInfo = await connection.getAccountInfo(new PublicKey(accountId));

    if (!accountInfo) {
      throw new Error('Account not found.');
    }

    const decodedData = JobRequestLayout.decode(accountInfo.data);

    // Display decoded data
    console.log(`bundle: ${bs58.encode(decodedData.bundle)}`);
    console.log(`input hash: ${Buffer.from(decodedData.input_hash).toString('base64')}`);
    console.log(`max output tokens: ${decodedData.max_output_tokens}`);
    console.log(`output token count: ${decodedData.output_token_count}`);
    console.log(`input token count: ${decodedData.input_token_count}`);
    console.log(`job status: ${JobRequestStatus[decodedData.status]}`);
    console.log(`merkle root: ${Buffer.from(decodedData.verification.merkle_root).toString('base64')}`);
    console.log(`status: ${JobRequestStatus[decodedData.status]}`);
    console.log(`verified tokens: [${decodedData.verification.verified_tokens.join(', ')}]`);
    
    const assignedVerifiers = decodedData.verification.assigned_verifiers.map(v => bs58.encode(v));
    console.log(`assigned verifiers: [${assignedVerifiers.join(', ')}]`);
    
    const verificationStates = decodedData.verification.verifier_states.map(s => JobVerificationStateEnum[s]);
    console.log(`verification states: [${verificationStates.join(', ')}]`);

  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();