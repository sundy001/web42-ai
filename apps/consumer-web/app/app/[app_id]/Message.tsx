interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Message({ content, isUser, timestamp }: MessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="text-sm">{content}</p>
        <p className="text-xs opacity-70 mt-1">
          {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}