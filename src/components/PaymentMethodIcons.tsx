import type { PaymentMethodId } from "@/lib/constants";

export function PaymentMethodIcon({
  method,
  className = "h-10 w-10",
}: {
  method: PaymentMethodId;
  className?: string;
}) {
  switch (method) {
    case "upi":
      return <UpiIcon className={className} />;
    case "cash":
      return <CashIcon className={className} />;
    case "card":
      return <CardIcon className={className} />;
    case "netbanking":
      return <NetBankingIcon className={className} />;
  }
}

function UpiIcon({ className }: { className?: string }) {
  return (
    <span className={`inline-grid place-items-center overflow-hidden rounded-xl bg-white ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/payment/upi.png"
        alt=""
        aria-hidden="true"
        className="h-[78%] w-[78%] object-contain"
        draggable={false}
      />
    </span>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#E8F5E9" />
      <rect x="6" y="11" width="28" height="18" rx="3" fill="#2E7D32" />
      <rect x="8" y="13" width="24" height="14" rx="2" fill="#66BB6A" />
      <circle cx="20" cy="20" r="5.2" fill="#FFF8E1" />
      <text
        x="20"
        y="23.2"
        textAnchor="middle"
        fill="#1B5E20"
        fontSize="9"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        ₹
      </text>
      <circle cx="11" cy="20" r="1.4" fill="#C8E6C9" />
      <circle cx="29" cy="20" r="1.4" fill="#C8E6C9" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#E3F2FD" />
      <rect x="5" y="11" width="30" height="19" rx="3.5" fill="url(#cardGrad)" />
      <rect x="5" y="16.5" width="30" height="4" fill="#0D47A1" opacity="0.55" />
      <rect x="8" y="23" width="7" height="4.5" rx="0.8" fill="#FFD54F" />
      <rect x="17" y="24.2" width="6" height="1.8" rx="0.5" fill="#fff" opacity="0.85" />
      <rect x="24.5" y="24.2" width="6" height="1.8" rx="0.5" fill="#fff" opacity="0.7" />
      <defs>
        <linearGradient id="cardGrad" x1="5" y1="11" x2="35" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E88E5" />
          <stop offset="1" stopColor="#0D47A1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NetBankingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#FFF3E0" />
      <path d="M8 16.5 20 9l12 7.5v2.2H8V16.5Z" fill="#EF6C00" />
      <rect x="10" y="19" width="4.2" height="9" rx="0.6" fill="#FB8C00" />
      <rect x="17.9" y="19" width="4.2" height="9" rx="0.6" fill="#FB8C00" />
      <rect x="25.8" y="19" width="4.2" height="9" rx="0.6" fill="#FB8C00" />
      <rect x="8" y="28.2" width="24" height="2.4" rx="0.8" fill="#E65100" />
      <circle cx="20" cy="14.2" r="1.5" fill="#FFF8E1" />
    </svg>
  );
}
