import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to Disc Golf Journey</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">
        Track your achievements, celebrate your progress, and become a better disc golfer.
        From your first par to your hundredth ace, we're here to document your journey.
      </p>
      <div className="flex gap-4">
        <Link href="/register">
          <Button size="lg">Start Your Journey</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg">Continue Journey</Button>
        </Link>
      </div>
    </div>
  );
}
