import Link from "next/link";

export default function WordMark({ className = "text-3xl" }: { className?: string }) {
  return (
    <Link href="/" className={`wordmark inline-block leading-[0.9] ${className}`}>
      BidYourDapp!
      <span className="wordmark-accent">#1</span>
    </Link>
  );
}
