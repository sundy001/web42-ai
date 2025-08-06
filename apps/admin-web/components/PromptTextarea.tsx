"use client";

import { useEffect, useState } from "react";

interface PromptTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onSubmit?: () => void;
}

export function PromptTextarea({
  value,
  onChange,
  disabled,
  onSubmit,
}: PromptTextareaProps) {
  const [placeholder, setPlaceholder] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  // Typing effect for placeholder
  useEffect(() => {
    const placeholders = [
      "A modern portfolio website for a photographer with a gallery...",
      "An e-commerce site for handmade jewelry with shopping cart...",
      "A restaurant website with menu, reservations, and reviews...",
      "A personal blog with dark mode and comment system...",
      "A startup landing page with pricing and testimonials...",
    ];

    let currentPlaceholderIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typeTimeoutId: NodeJS.Timeout;
    let cursorTimeoutId: NodeJS.Timeout;

    // Cursor blinking effect
    const blinkCursor = () => {
      setShowCursor((prev) => !prev);
      cursorTimeoutId = setTimeout(blinkCursor, 530);
    };

    const typeEffect = () => {
      const currentFullText = placeholders[currentPlaceholderIndex];
      if (!currentFullText) return;

      if (!isDeleting) {
        // Typing
        const currentText = currentFullText.slice(0, currentCharIndex + 1);
        setPlaceholder(currentText);
        currentCharIndex++;

        if (currentCharIndex === currentFullText.length) {
          // Pause at the end before deleting
          isDeleting = true;
          typeTimeoutId = setTimeout(typeEffect, 2000);
        } else {
          typeTimeoutId = setTimeout(typeEffect, 50);
        }
      } else {
        // Deleting
        const currentText = currentFullText.slice(0, currentCharIndex - 1);
        setPlaceholder(currentText);
        currentCharIndex--;

        if (currentCharIndex === 0) {
          // Move to next placeholder
          isDeleting = false;
          currentPlaceholderIndex =
            (currentPlaceholderIndex + 1) % placeholders.length;
          typeTimeoutId = setTimeout(typeEffect, 500);
        } else {
          typeTimeoutId = setTimeout(typeEffect, 30);
        }
      }
    };

    typeEffect();
    blinkCursor();

    return () => {
      if (typeTimeoutId) clearTimeout(typeTimeoutId);
      if (cursorTimeoutId) clearTimeout(cursorTimeoutId);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onSubmit && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <textarea
      placeholder={`${placeholder}${showCursor ? "\u2588" : ""}`}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChange(e.target.value)
      }
      onKeyDown={handleKeyDown}
      className="w-full min-h-[60px] text-lg resize-none rounded-lg border-0 p-0 focus:outline-none transition-all duration-200 placeholder:text-gray-400 text-white px-4 py-3"
      disabled={disabled}
    />
  );
}
