import { createRequire } from "module";
import http from "http";

const require = createRequire(import.meta.url);

function ping() {
  return new Promise((resolve) => {
    const req = http.request({ method: "POST", host: "localhost", port: 8545, path: "/" }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.end(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "web3_clientVersion", params: [] }));
  });
}

const ok = await ping();
if (!ok) {
  console.log("Hardhat node is NOT running at http://localhost:8545");
  process.exit(1);
} else {
  console.log("Hardhat node is running.");
}


