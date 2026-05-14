import { useAnnouncementsController } from "./hooks/useAnnouncementsController";

export default function AnnouncementsMain() {
  const { title, message } = useAnnouncementsController();
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{title}</h1>
      <p>{message}</p>
    </div>
  );
}
