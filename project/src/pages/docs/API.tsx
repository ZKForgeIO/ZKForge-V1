import DocsLayout from '../../components/DocsLayout';

export default function API() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          API Reference
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Complete reference for ZKForge's authentication and data APIs
        </p>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Authentication API</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-[#17ff9a]/10 text-[#17ff9a] font-mono text-sm">POST</span>
              <code className="text-gray-300">/auth/signup</code>
            </div>
            <p className="text-gray-300 mb-4">Create a new user account with ZK credentials</p>

            <h4 className="text-white font-bold mb-2">Request Body</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "username": "string"
}`}
              </pre>
            </div>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "success": true,
  "userId": "uuid",
  "username": "string",
  "publicKey": "hex_string",
  "solanaAddress": "base58_string",
  "zkSecretKey": "hex_string",
  "solanaSecretKey": "base58_string"
}`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-[#17ff9a]/10 text-[#17ff9a] font-mono text-sm">POST</span>
              <code className="text-gray-300">/auth/signin</code>
            </div>
            <p className="text-gray-300 mb-4">Authenticate using ZK secret key</p>

            <h4 className="text-white font-bold mb-2">Request Body</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "zkSecretKey": "hex_string"
}`}
              </pre>
            </div>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "success": true,
  "userId": "uuid",
  "username": "string",
  "publicKey": "hex_string",
  "solanaAddress": "base58_string"
}`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-mono text-sm">POST</span>
              <code className="text-gray-300">/auth/signout</code>
            </div>
            <p className="text-gray-300 mb-4">End current session and clear credentials</p>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Profile API</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-mono text-sm">GET</span>
              <code className="text-gray-300">/profiles/:userId</code>
            </div>
            <p className="text-gray-300 mb-4">Retrieve user profile information</p>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "id": "uuid",
  "username": "string",
  "bio": "string | null",
  "profile_picture_url": "string | null",
  "solana_address": "base58_string",
  "is_online": boolean,
  "last_seen": "timestamp",
  "created_at": "timestamp"
}`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 font-mono text-sm">PUT</span>
              <code className="text-gray-300">/profiles/:userId</code>
            </div>
            <p className="text-gray-300 mb-4">Update user profile</p>

            <h4 className="text-white font-bold mb-2">Request Body</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "bio": "string",
  "profile_picture_url": "string",
  "is_online": boolean
}`}
              </pre>
            </div>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "success": true
}`}
              </pre>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Transaction API</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-mono text-sm">GET</span>
              <code className="text-gray-300">/transactions</code>
            </div>
            <p className="text-gray-300 mb-4">List all transactions (paginated)</p>

            <h4 className="text-white font-bold mb-2">Query Parameters</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`limit: number (default: 50)
offset: number (default: 0)
status: 'pending' | 'completed' | 'failed'
address: base58_string`}
              </pre>
            </div>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "send" | "receive",
    "amount": number,
    "currency": "string",
    "from_address": "base58_string",
    "to_address": "base58_string",
    "status": "string",
    "transaction_hash": "hex_string",
    "description": "string",
    "created_at": "timestamp"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-[#17ff9a]/10 text-[#17ff9a] font-mono text-sm">POST</span>
              <code className="text-gray-300">/transactions</code>
            </div>
            <p className="text-gray-300 mb-4">Create a new transaction</p>

            <h4 className="text-white font-bold mb-2">Request Body</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "type": "send" | "receive",
  "amount": number,
  "currency": "string",
  "from_address": "base58_string",
  "to_address": "base58_string",
  "description": "string"
}`}
              </pre>
            </div>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "id": "uuid",
  "transaction_hash": "hex_string",
  "status": "pending"
}`}
              </pre>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Messaging API</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-mono text-sm">GET</span>
              <code className="text-gray-300">/messages/lounge</code>
            </div>
            <p className="text-gray-300 mb-4">Get recent lounge messages</p>

            <h4 className="text-white font-bold mb-2">Query Parameters</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`limit: number (default: 100)`}
              </pre>
            </div>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`[
  {
    "id": "uuid",
    "user_id": "uuid",
    "username": "string",
    "content": "string",
    "created_at": "timestamp"
  }
]`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-[#17ff9a]/10 text-[#17ff9a] font-mono text-sm">POST</span>
              <code className="text-gray-300">/messages/lounge</code>
            </div>
            <p className="text-gray-300 mb-4">Send a message to the lounge</p>

            <h4 className="text-white font-bold mb-2">Request Body</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "content": "string"
}`}
              </pre>
            </div>

            <h4 className="text-white font-bold mb-2">Response</h4>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`{
  "id": "uuid",
  "created_at": "timestamp"
}`}
              </pre>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Real-time Subscriptions</h2>
        <p className="text-gray-300 mb-4">
          ZKForge uses Supabase Realtime for live data updates. Subscribe to channels to receive
          instant notifications of changes.
        </p>

        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-6 mb-8 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">
{`// Subscribe to new transactions
const channel = supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions'
  }, (payload) => {
    console.log('New transaction:', payload.new);
  })
  .subscribe();

// Subscribe to lounge messages
const loungeChannel = supabase
  .channel('lounge_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'lounge_messages'
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();`}
          </pre>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Error Codes</h2>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <span className="font-mono text-red-400">400</span>
              <span className="text-gray-300">Bad Request - Invalid input data</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <span className="font-mono text-red-400">401</span>
              <span className="text-gray-300">Unauthorized - Authentication failed</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <span className="font-mono text-red-400">403</span>
              <span className="text-gray-300">Forbidden - Insufficient permissions</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <span className="font-mono text-red-400">404</span>
              <span className="text-gray-300">Not Found - Resource does not exist</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <span className="font-mono text-red-400">409</span>
              <span className="text-gray-300">Conflict - Username already taken</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <span className="font-mono text-red-400">429</span>
              <span className="text-gray-300">Too Many Requests - Rate limit exceeded</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <span className="font-mono text-red-400">500</span>
              <span className="text-gray-300">Internal Server Error - Server-side issue</span>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Next: Technology Stack</h3>
          <p className="text-gray-300">
            Explore the complete technology stack powering ZKForge.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
