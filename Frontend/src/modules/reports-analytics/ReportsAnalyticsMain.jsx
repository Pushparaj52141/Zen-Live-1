import { useReportsAnalyticsController } from "./hooks/useReportsAnalyticsController";

export default function ReportsAnalyticsMain() {
  const { title, message } = useReportsAnalyticsController();
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{title}</h1>
      <p>{message}</p>
    </div>
  );
}
