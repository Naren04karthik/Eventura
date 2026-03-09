interface CompletionStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
}

interface ProfileCompletionCardProps {
  status: CompletionStatus;
}

function toLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default function ProfileCompletionCard({ status }: ProfileCompletionCardProps) {
  const progressColor = status.isComplete ? 'bg-green-600' : 'bg-blue-600';

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Profile Completion</h3>
        <span className="text-lg font-bold text-blue-600">{status.completionPercentage}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${status.completionPercentage}%` }}
        />
      </div>

      {status.isComplete ? (
        <p className="mt-2 text-xs font-medium text-green-700">Your profile is complete.</p>
      ) : (
        <p className="mt-2 text-xs text-gray-600">
          Missing: {status.missingFields.map(toLabel).join(', ')}
        </p>
      )}
    </div>
  );
}
