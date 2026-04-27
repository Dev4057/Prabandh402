// What it does: Mockable DNS TXT checker; in Phase 1 it simulates success if the TXT would match the expected public key/payment.
// Real-world role: Stands in for the DNS proof that your domain really binds to your attestation key/payment address. Replace with a real DNS/DNSSEC lookup later.



// Mockable DNS TXT checker. In Phase 1 we simulate success if the TXT is formatted correctly.
import { promises as dns } from "dns";

export interface DnsCheckInput {
  host: string;
  expectedPublicKey: string;
  expectedPayment: string;
}

export interface DnsCheckResult {
  ok: boolean;
  reason?: string;
}

// In Phase 2: Actual DNS TXT lookup.
// We strip protocol/ports (e.g., http://localhost:4001 -> localhost) and query the real internet.
export async function checkDnsTxt(input: DnsCheckInput): Promise<DnsCheckResult> {
  try {
    // 1. Clean the host (remove http:// and ports)
    let cleanHost = input.host;
    if (cleanHost.startsWith("http")) {
      cleanHost = new URL(cleanHost).hostname;
    }

    // 2. Local-dev escape hatch
    if (cleanHost === "localhost" || cleanHost === "127.0.0.1") {
      console.log(`[DNS MOCK] Skipping global DNS check for local host: ${cleanHost}`);
      return { ok: true };
    }

    // 3. DO THE REAL DNS QUERY on the internet
    console.log(`[DNS REAL] Querying TXT records for ${cleanHost}...`);
    const records = await dns.resolveTxt(cleanHost);
    
    // DNS returning TXT records often splits long strings into arrays of strings. Join them.
    const flatRecords = records.map(chunk => chunk.join(''));
    
    // 4. Look for exactly our EIP-8004 pattern
    // e.g. "eip8004=pubkey:0x123...,payment:0xabc..."
    const found = flatRecords.find(txt => 
      txt.includes(`pubkey:${input.expectedPublicKey}`) && 
      txt.includes(`payment:${input.expectedPayment}`)
    );

    if (found) {
      console.log(`[DNS REAL] Success! Found matching EIP-8004 signature for ${cleanHost}`);
      return { ok: true };
    }

    return { ok: false, reason: "TXT record missing or EIP-8004 payload mismatched" };
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
       return { ok: false, reason: "No TXT records found for host." };
    }
    return { ok: false, reason: `DNS query failed: ${error.message}` };
  }
}