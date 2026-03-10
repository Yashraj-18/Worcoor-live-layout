'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error is already captured, no logging needed
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f1117] flex 
      items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-xl font-semibold 
          text-white">
          Something went wrong
        </h2>
        <p className="text-gray-400 text-sm max-w-md">
          An unexpected error occurred. 
          Please try again.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 
            text-white rounded-md text-sm 
            hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
