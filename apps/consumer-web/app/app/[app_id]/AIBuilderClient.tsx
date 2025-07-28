"use client";

import ResizablePanels, {
  LeftPanel,
  RightPanel,
} from "@/components/ResizablePanels";
import { useState } from "react";
import AIBuilderHeader from "./AIBuilderHeader";
import ChatPanel from "./ChatPanel";
import SitePreviewPanel from "./SitePreviewPanel";

interface MessageData {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIBuilderClientProps {
  appId: string;
}

export default function AIBuilderClient({ appId }: AIBuilderClientProps) {
  const [messages, setMessages] = useState<MessageData[]>([
    {
      id: "1",
      content:
        "Hi! I'm your AI assistant. Describe the site you'd like to build and I'll help you create it.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: MessageData = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: MessageData = {
        id: (Date.now() + 1).toString(),
        content:
          "Great idea! I'm working on creating that for you. Let me generate the code and preview...",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <AIBuilderHeader appId={appId} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          defaultLeftWidth={50}
          minLeftWidth={250}
          maxLeftWidth={690}
        >
          <LeftPanel>
            <ChatPanel
              messages={messages}
              inputMessage={inputMessage}
              isGenerating={isGenerating}
              onInputChange={setInputMessage}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
            />
          </LeftPanel>

          <RightPanel>
            <SitePreviewPanel />
          </RightPanel>
        </ResizablePanels>
      </div>
    </div>
  );
}
