import React, { useState } from 'react'
import { BookOpen, Copy, Check, Shield } from 'lucide-react'

export const DocumentationView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const snippets = [
    {
      title: '1. Install DDS Auth Backend SDK',
      method: 'NPM',
      endpoint: 'npm install @dds/auth-sdk',
      description: 'Add the official DDS Auth Node.js SDK to your third-party backend.',
      code: `npm install @dds/auth-sdk`
    },
    {
      title: '2. Initialize SDK in Backend',
      method: 'NODE.JS',
      endpoint: 'Server-Side Initialization',
      description: 'Initialize the SDK with your Client ID and Client Secret in your Express/Node.js backend.',
      code: `import { DDSAuth } from '@dds/auth-sdk';

const dds = new DDSAuth({
  clientId: process.env.DDS_CLIENT_ID,         // e.g. "dds_client_demoshop"
  clientSecret: process.env.DDS_CLIENT_SECRET, // e.g. "dds_secret_demoshop_live_9f82k"
  baseURL: process.env.DDS_AUTH_URL || 'http://localhost:5000'
});`
    },
    {
      title: '3. Request Mobile Verification',
      method: 'POST /api/v1/verifications',
      endpoint: 'dds.verification.request()',
      description: 'Request authorization for a registered mobile number. If the user is registered in DDS, returns a pending requestId and verification challenge code.',
      code: `try {
  const result = await dds.verification.request({
    mobileId: '+918637628773', // Canonical E.164 format
    origin: 'http://localhost:5175'
  });

  console.log(result);
  // Output: { success: true, requestId: "req_7f82k9", status: "pending", verificationCode: "697219" }
} catch (err) {
  if (err.code === 'MOBILE_NOT_REGISTERED') {
    console.error('User has not registered this mobile number in DDS.');
  }
}`
    },
    {
      title: '4. Check Verification Status',
      method: 'GET /api/v1/verifications/:requestId',
      endpoint: 'dds.verification.status()',
      description: 'Poll verification status until user approves the code in their DDS Mobile App.',
      code: `const statusResult = await dds.verification.status('req_7f82k9');

console.log(statusResult);
// Output when user approves:
// { success: true, requestId: "req_7f82k9", status: "verified" }`
    },
    {
      title: '5. React Frontend Integration',
      method: 'REACT',
      endpoint: 'npm install @dds/auth-react',
      description: 'Frontend integration helpers for React applications connecting to your merchant backend.',
      code: `import { DDSProvider, useDDSVerification } from '@dds/auth-react';

function Checkout() {
  const { initiateVerification, status, loading } = useDDSVerification({
    merchantApiUrl: 'http://localhost:5001'
  });

  return (
    <button onClick={() => initiateVerification('+918637628773')}>
      Verify with DDS
    </button>
  );
}`
    }
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123C35] bg-[#EEF2EC] px-2.5 py-0.5 rounded-full mb-1 border border-[#D8E0DA]">
          <BookOpen className="w-3.5 h-3.5 text-[#2F8F6B]" />
          <span>DDS Auth SDK Guide</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#102F2A] tracking-tight">DDS Auth SDK Integration</h2>
        <p className="text-xs text-[#64746E] mt-0.5">
          Integrate secure server-to-server mobile verification using the official <strong className="text-[#123C35]">@dds/auth-sdk</strong> and <strong className="text-[#123C35]">@dds/auth-react</strong>
        </p>
      </div>

      {/* Security Best Practices Card */}
      <div className="bg-[#123C35] text-white rounded-3xl p-6 shadow-md space-y-2 border border-[#102F2A]">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#6F9584]" />
          <h3 className="font-bold text-sm text-white">Security Best Practice: Server-Side Only Secrets</h3>
        </div>
        <p className="text-xs text-[#DCE8E1] leading-relaxed">
          Never expose your <code className="bg-[#102F2A] px-1.5 py-0.5 rounded font-mono text-[#DCE8E1]">Client Secret</code> in frontend browser code. Always route verification calls through your own backend server using the DDS Auth SDK.
        </p>
      </div>

      <div className="space-y-6">
        {snippets.map((snip, idx) => (
          <div key={idx} className="bg-white border border-[#D8E0DA] rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#102F2A]">{snip.title}</h3>
                <p className="text-xs text-[#64746E] mt-0.5">{snip.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EEF2EC] text-[#123C35] px-2.5 py-1 rounded-full font-mono border border-[#D8E0DA]">
                  {snip.method}
                </span>
                <code className="text-xs font-mono text-[#102F2A] bg-[#F7F8F3] px-2 py-1 rounded-lg border border-[#D8E0DA]">
                  {snip.endpoint}
                </code>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 bg-[#102F2A] text-[#DCE8E1] rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-[#123C35]">
                {snip.code}
              </pre>
              <button
                onClick={() => handleCopy(snip.code, idx)}
                className="absolute top-3 right-3 p-2 bg-[#123C35] hover:bg-[#102F2A] text-[#DCE8E1] rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors border border-[#6F9584]/30"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2F8F6B]" />
                    <span className="text-[#2F8F6B] text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
