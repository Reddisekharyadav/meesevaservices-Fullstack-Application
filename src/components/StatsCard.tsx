interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: "blue" | "green" | "yellow" | "purple" | "red";
}

const colorClasses = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  yellow: "bg-yellow-50 text-yellow-600",
  purple: "bg-purple-50 text-purple-600",
  red: "bg-red-50 text-red-600",
};

export default function StatsCard({
  title,
  value,
  icon,
  color = "blue",
}: StatsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorClasses[color]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
