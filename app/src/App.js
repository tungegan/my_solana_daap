import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import idl from "./my_solana_dapp.json"; // The path to your JSON IDL file

const programID = new PublicKey(idl.metadata.address);
const network = "http://127.0.0.1:8899"; // Adjust for your environment: local, devnet, or mainnet-beta
const opts = { preflightCommitment: "processed" };

const App = () => {
  const wallet = useAnchorWallet();
  const { connected } = useWallet();
  const [greetingAccountPublicKey, setGreetingAccountPublicKey] =
    useState(null);
  const [error, setError] = useState("");

  const getProvider = () => {
    if (!wallet) return null;
    const connection = new Connection(network, opts.preflightCommitment);
    return new AnchorProvider(connection, wallet, opts.preflightCommitment);
  };

  const createGreeting = async () => {
    setError("");
    if (!connected) {
      setError("Wallet is not connected.");
      return;
    }
    const provider = getProvider();
    if (!provider) {
      setError("Provider is not available.");
      return;
    }
    const program = new Program(idl, programID, provider);
    try {
      const greetingAccount = Keypair.generate();
      await program.rpc.createGreeting({
        accounts: {
          greetingAccount: greetingAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [greetingAccount],
      });
      console.log("Greeting account created!");
      setGreetingAccountPublicKey(greetingAccount.publicKey.toString());
    } catch (err) {
      console.error("Error creating greeting account:", err);
      setError("Failed to create greeting account. Please try again.");
    }
  };

  const incrementGreeting = async () => {
    setError("");
    if (!connected) {
      setError("Wallet is not connected.");
      return;
    }
    if (!greetingAccountPublicKey) {
      setError("Greeting account not created or public key not set.");
      return;
    }
    const provider = getProvider();
    if (!provider) {
      setError("Provider is not available.");
      return;
    }
    const program = new Program(idl, programID, provider);
    try {
      await program.rpc.incrementGreeting({
        accounts: {
          greetingAccount: new PublicKey(greetingAccountPublicKey),
          user: provider.wallet.publicKey,
        },
        signers: [],
      });
      console.log("Greeting incremented!");
    } catch (err) {
      console.error("Error incrementing greeting:", err);
      setError("Failed to increment greeting. Please try again.");
    }
  };

  return (
    <div>
      <WalletMultiButton />
      <WalletDisconnectButton />
      <button onClick={createGreeting}>Create Greeting</button>
      {greetingAccountPublicKey && (
        <button onClick={incrementGreeting}>Increment Greeting</button>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default App;
