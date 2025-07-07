import crypto from 'crypto';

function main() {
  const inputString = process.argv[2];

  if (!inputString) {
    console.error('Please provide a string to hash.');
    process.exit(1);
  }

  const hash = crypto.createHash('sha256').update(inputString).digest();
  const base64Hash = hash.toString('base64');

  console.log(base64Hash);
}

main();