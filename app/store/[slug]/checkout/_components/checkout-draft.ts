"use client";

// An unfinished checkout, kept on this device (sessionStorage: this tab only,
// gone when it closes). Paying by wallet or InstaPay sends the shopper to
// another app to transfer, and phones often reload the page when they come
// back — without this they'd find an empty form and their screenshot gone.
// Cleared once the order is placed. Never throws: storage may be blocked or full.

const formKey = (slug: string) => `casho:checkout:${slug}`;
const transferPrefix = (slug: string) => `casho:transfer:${slug}:`;

export type CheckoutDraft = {
  fields: Record<string, string>;
  paymentMethod?: string;
  /** The transfer window was open. */
  paying?: boolean;
};

export type TransferDraft = {
  payer: string;
  image?: { name: string; type: string; data: string } | null;
};

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Blocked or over quota (a large screenshot): the page still works, it just won't survive a reload.
  }
}

export const readCheckoutDraft = (slug: string) => read<CheckoutDraft>(formKey(slug));
export const writeCheckoutDraft = (slug: string, draft: CheckoutDraft) => write(formKey(slug), draft);
export const readTransferDraft = (slug: string, method: string) => read<TransferDraft>(transferPrefix(slug) + method);
export const writeTransferDraft = (slug: string, method: string, draft: TransferDraft) => write(transferPrefix(slug) + method, draft);

/** The order is placed: forget the form and every transfer window. */
export function clearCheckoutDrafts(slug: string) {
  try {
    sessionStorage.removeItem(formKey(slug));
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(transferPrefix(slug))) sessionStorage.removeItem(key);
    }
  } catch {
    // Nothing to clean when storage is blocked.
  }
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function dataUrlToFile(data: string, name: string, type: string): Promise<File | null> {
  try {
    const blob = await (await fetch(data)).blob();
    return new File([blob], name, { type: type || blob.type });
  } catch {
    return null;
  }
}
