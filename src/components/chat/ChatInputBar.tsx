'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, CornerUpLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { MessageResponse } from '@/types/chat';

export interface ChatInputBarProps {
  value?: string;
  onChange?: (value: string) => void;
  replyingTo?: MessageResponse | null;
  onSend?: (content: string) => void | Promise<void>;
  onCancelReply?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * ChatInputBar
 * - Thanh nhập tin nhắn chuẩn 1:1 iOS ChatInputBar
 * - Banner trích dẫn tin nhắn đang trả lời (Reply Preview) kèm nút Hủy (X)
 * - Ô nhập văn bản bo tròn tự co giãn
 * - Nút Gửi tròn màu Matcha Glow (#D4EB70), tự vô hiệu hóa khi rỗng
 * - Tự động phát hiện trạng thái gõ phím kèm debounce 2.5 giây
 * - Xử lý phím tắt: Enter gửi tin nhắn, Shift+Enter xuống dòng
 * - Zero Border, Zero Shadow
 */
export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  value,
  onChange,
  replyingTo,
  onSend,
  onCancelReply,
  onTypingChange,
  onTyping,
  placeholder = 'Nhập tin nhắn...',
  disabled = false,
  className,
}) => {
  const [internalText, setInternalText] = useState('');
  const text = value !== undefined ? value : internalText;
  const isTypingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canSend = Boolean(text.trim().length > 0 && !disabled);

  const emitTyping = useCallback(
    (typing: boolean) => {
      if (isTypingRef.current !== typing) {
        isTypingRef.current = typing;
        onTypingChange?.(typing);
        onTyping?.(typing);
      }
    },
    [onTypingChange, onTyping]
  );

  const stopTypingImmediately = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    emitTyping(false);
  }, [emitTyping]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (value === undefined) {
      setInternalText(newText);
    }
    onChange?.(newText);

    if (newText.trim().length > 0) {
      emitTyping(true);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        emitTyping(false);
        debounceTimerRef.current = null;
      }, 2500);
    } else {
      stopTypingImmediately();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    haptics.click();
    stopTypingImmediately();
    onSend?.(trimmed);

    if (value === undefined) {
      setInternalText('');
    }
    onChange?.('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancelReply = () => {
    haptics.click();
    onCancelReply?.();
  };

  return (
    <div
      data-testid="chat-input-bar"
      className={cn('w-full flex flex-col bg-canvas select-none', className)}
    >
      {/* 1. Banner xem trước tin nhắn đang trả lời */}
      {replyingTo && (
        <div
          data-testid="reply-preview-banner"
          className="w-full flex items-center justify-between px-4 py-2 bg-surface-subtle/50 transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CornerUpLeft size={16} className="text-text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-[11px] text-text-primary leading-tight">
                Đang trả lời:
              </span>
              <span className="text-[12px] text-text-secondary truncate leading-tight">
                {replyingTo.content}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancelReply}
            aria-label="Hủy trả lời"
            data-testid="cancel-reply-button"
            className="w-7 h-7 rounded-full bg-surface text-text-secondary flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. Hàng nhập liệu chính */}
      <div className="w-full flex items-end gap-2 px-3 py-2 bg-canvas">
        {/* Ô nhập Text tự động co giãn */}
        <div className="flex-1 bg-surface rounded-[22px] px-4 py-2 flex items-center min-h-[44px]">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent resize-none outline-none font-sans text-[15px] text-text-primary placeholder:text-text-secondary/60 max-h-28 leading-snug overflow-y-auto no-scrollbar"
          />
        </div>

        {/* Nút Gửi tròn Matcha Glow 44x44 */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Gửi"
          data-testid="send-message-button"
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 select-none',
            canSend
              ? 'bg-primary text-dark-surface active:scale-95 cursor-pointer'
              : 'bg-surface text-text-secondary/40 cursor-not-allowed opacity-50'
          )}
        >
          <Send size={18} strokeWidth={2.3} className="mr-0.5" />
        </button>
      </div>
    </div>
  );
};
