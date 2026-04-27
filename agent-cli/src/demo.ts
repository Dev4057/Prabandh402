// What it does: A CLI script that drives the happy path:
// Fetches a SID from the registry.
// Calls provider /booking to get a signed 402 payload.
// Verifies the 402 signature with the SID public key.
// Mocks payment (produces a fake tx hash) and calls the provider callback.
// Verifies the provider’s signed receipt.
// Real-world role: Minimal agent discovery → trust verification → payment ask → “payment” → receipt verification.


// What? The most important demo script: shows the “customer” buying a service, step by step!

// What it does:

// Fetches a list of providers from the registry
// Picks one (in code: just picks the first)
// Books a service with the provider
// Gets a “Payment Required” (HTTP 402) reply
// Checks/Verifies the reply (Did a real Provider really send this? Is the payment address correct?)
// “Pays” (sends a fake transaction, can be a real payment in the future)
// Asks Provider for a Receipt (proves service was delivered)
// Verifies the Receipt signature
// Why?
// In real life: “If Amazon Alexa wants to book a truck, it should check the provider is real, pay instantly, and get proof without humans.” This script shows all that happening, automated!

// Links with?

// Talks to registry (to find providers)
// Talks to provider-stub (to book/pay)
// Uses SID (service identity) to check who’s legit


import "dotenv/config";
import { verifyPayload } from "../../provider-stub/src/crypto.js";
import { Sid } from "../../registry/src/sid.js";
import { createWalletClient, http, publicActions, encodeFunctionData, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

type SidRow = { payload: Sid };

async function main() {
  const registryUrl = process.env.AGENT_REGISTRY_URL || "http://localhost:4000";
  const providerUrl = process.env.AGENT_PROVIDER_URL || "http://localhost:4001";

  // Check for Agent's blockchain wallet
  if (!process.env.AGENT_PAYMENT_PRIVATE_KEY) {
    console.warn("⚠️ Warning: AGENT_PAYMENT_PRIVATE_KEY is not set in .env");
    console.warn("⚠️ The transaction step will fail unless you provide a Sepolia private key loaded with test ETH.");
  }

  console.log("1) Fetch SID from registry");
  const sidRow = await fetch(`${registryUrl}/search`)
    .then((r) => r.json())
    .then((rows: SidRow[]) => rows[0]);
  if (!sidRow) throw new Error("No SID in registry; submit one first.");
  const sid: Sid = sidRow.payload;
  console.log("   service_id:", sid.service_id);

  console.log("2) Call provider /booking to get 402 payload");
  const bookingResp = await fetch(`${providerUrl}/booking`, { method: "POST" });
  const booking = await bookingResp.json();
  console.log("   402 payload:", booking);

  console.log("3) Verify 402 signature with SID public key");
  const ok = await verifyPayload(
    {
      booking_id: booking.booking_id,
      network: booking.network,
      token: booking.token,
      amount: booking.amount,
      payment_address: booking.payment_address,
      nonce: booking.nonce,
      expires_at: booking.expires_at,
      callback_url: booking.callback_url,
      facilitator_url: booking.facilitator_url,
      host: booking.host,
    },
    booking.signature,
    sid.verification.public_key
  );
  if (!ok) throw new Error("402 signature invalid");
  console.log("   402 signature valid ✓");

  console.log("4) Initiating real blockchain payment on Base Sepolia...");
  let mockTxHash = "0x" + "ab".repeat(32);

  if (process.env.AGENT_PAYMENT_PRIVATE_KEY) {
    try {
      // Create Viem Account
      const account = privateKeyToAccount(process.env.AGENT_PAYMENT_PRIVATE_KEY as `0x${string}`);
      
      // Setup Viem Client connecting to Base Sepolia
      const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http() // Can swap to RPC url (Alchemy/Infura)
      }).extend(publicActions);

      console.log(`   Executing payment from Agent wallet: ${account.address}`);
      console.log(`   Sending ${booking.amount} USDC on Base Sepolia to Provider: ${booking.payment_address}`);

      // The ABI strictly needed for transferring an ERC20 token
      const erc20TransferAbi = [
        {
          name: 'transfer',
          type: 'function',
          inputs: [
            { name: 'recipient', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ] as const;

      // USDC has 6 decimal places (unlike ETH which has 18)
      const amountToPay = parseUnits(booking.amount, 6);

      // Execute a smart contract call to the USDC token address
      const hash = await client.sendTransaction({
         to: booking.token as `0x${string}`, // The USDC token address
         data: encodeFunctionData({
           abi: erc20TransferAbi,
           functionName: 'transfer',
           args: [booking.payment_address as `0x${string}`, amountToPay]
         })
      });

      console.log(`   Transaction broadcast! Hash: ${hash}`);
      console.log(`   Waiting for the block to be mined... (this takes ~5-15 seconds)`);
      
      
      // Wait for it to be confirmed by miners
      const receipt = await client.waitForTransactionReceipt({ hash });
      console.log(`   Transaction confirmed in block ${receipt.blockNumber} ✓`);
      
      // Update our mockTxHash with the real, verifiable hash
      mockTxHash = receipt.transactionHash;

    } catch (e: any) {
      console.error("   Blockchain transaction failed. Does the Agent wallet have testnet Base Sepolia ETH (for gas) AND USDC?", e.message);
      console.log("   Falling back to mock payment hash to continue the demo framework...");
    }
  } else {
    console.log("   No AGENT_PAYMENT_PRIVATE_KEY found. Simulating an instant payment...");
  }

  console.log("5) Sending confirmation to Provider callback");
  const callbackResp = await fetch(booking.callback_url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      tx_hash: mockTxHash,
      booking_id: booking.booking_id,
      nonce: booking.nonce,
      amount: booking.amount,
    }),
  });
  const callback = await callbackResp.json();
  console.log("   receipt payload:", callback);

  console.log("6) Verify final receipt signature");
  const receiptOk = await verifyPayload(callback.receipt, callback.signature, sid.verification.public_key);
  if (!receiptOk) throw new Error("Receipt signature invalid");
  console.log("   Receipt signature valid ✓");
  console.log("Demo complete: booking confirmed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});