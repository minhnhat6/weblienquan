/**
 * NonceScript component for secure inline scripts with CSP nonce
 * 
 * SECURITY NOTE: This component uses dangerouslySetInnerHTML intentionally.
 * It is designed for server-rendered scripts with CSP nonce protection.
 * The nonce ensures only scripts from this component execute.
 * 
 * Usage: Only pass trusted, developer-controlled script content.
 * DO NOT pass user-generated content to this component.
 */

import { headers } from 'next/headers';

interface NonceScriptProps {
  /** Script content - MUST be trusted, developer-controlled code only */
  children: string;
  id?: string;
}

/**
 * Server component that renders a script with CSP nonce
 * The nonce is automatically retrieved from request headers set by middleware
 */
export async function NonceScript({ children, id }: NonceScriptProps) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? undefined;

  // dangerouslySetInnerHTML is safe here because:
  // 1. Content is developer-provided (children prop)
  // 2. CSP nonce prevents script execution without valid nonce
  // 3. This is a server component - no client-side injection possible
  return (
    <script
      id={id}
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}

/**
 * Get the nonce for use in client components
 * Pass this to Script components or inline scripts
 */
export async function getNonce(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('x-nonce') ?? undefined;
}

export default NonceScript;
