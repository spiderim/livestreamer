interface ChatMessageProps {
  userName: string;
  userImage: string | null;
  content: string;
  timestamp: number;
}

export function ChatMessage({
  userName,
  userImage,
  content,
}: ChatMessageProps) {
  return (
    <div className="flex items-start gap-2 py-1 px-1 rounded hover:bg-gray-50 group">
      {userImage ? (
        <img
          src={userImage}
          alt={userName}
          className="h-6 w-6 rounded-full flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex-shrink-0 mt-0.5">
          {userName[0]?.toUpperCase()}
        </div>
      )}
      <p className="text-sm leading-snug min-w-0">
        <span className="font-semibold text-gray-900 mr-1.5 text-xs">
          {userName}
        </span>
        <span className="text-gray-700 break-words">{content}</span>
      </p>
    </div>
  );
}
