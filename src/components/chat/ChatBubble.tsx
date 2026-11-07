'use client';

import React, { useState } from 'react';
import { CornerUpLeft, Trash2, RotateCcw, Check, CheckCheck, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { MessageResponse } from '@/types/chat';

export interface ChatBubbleProps {
  message: MessageResponse;
  isMine: boolean;
  replyToMessage?: MessageResponse | { id?: string; content: string; senderName?: string } | null;
  onReply?: (message: MessageResponse) => void;
  onRevoke?: (message: MessageResponse) => void;
  onDeleteForMe?: (message: MessageResponse) => void;
  className?: string;
}

/**
 * Định dạng thời gian HH:mm chuẩn tin nhắn chat
 */
function formatBubbleTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * ChatBubble
 * - Bong bóng tin nhắn chuẩn 1:1 iOS ChatBubble
 * - Căn phải cho tin của tôi (rounded-[20px] rounded-br-[6px], bg-primary, text-dark-surface)
 * - Căn trái cho tin của đối phương (rounded-[20px] rounded-bl-[6px], bg-surface, text-text-primary)
 * - Trạng thái thu hồi: chữ nghiêng "Tin nhắn đã được thu hồi", nền mờ subtle
 * - Thẻ trích dẫn tin nhắn trả lời (Reply Quote)
 * - Ảnh đính kèm phản hồi (Photo Context)
 * - Trạng thái đã xem "Đã xem" / CheckCheck / Check
 * - Các hành động: Trả lời, Thu hồi (trong 60p của tôi), Xóa ở phía tôi
 * - Zero Border, Zero Shadow
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isMine,
  replyToMessage,
  onReply,
  onRevoke,
  onDeleteForMe,
  className,
}) => {
  const [showActions, setShowActions] = useState(false);

  const isRevoked = Boolean(message.isRevoked || message.type === 'SYSTEM');
  const formattedTime = formatBubbleTime(message.sentAt);

  // Kiểm tra điều kiện thu hồi (tin của tôi, chưa thu hồi, trong vòng 60 phút)
  const canRevoke = (() => {
    if (!isMine || isRevoked || !onRevoke) return false;
    const sentTime = new Date(message.sentAt).getTime();
    if (isNaN(sentTime)) return true;
    const diffMinutes = (Date.now() - sentTime) / (1000 * 60);
    return diffMinutes <= 60;
  })();

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.click();
    setShowActions(false);
    onReply?.(message);
  };

  const handleRevoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.click();
    setShowActions(false);
    onRevoke?.(message);
  };

  const handleDeleteForMe = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.click();
    setShowActions(false);
    onDeleteForMe?.(message);
  };

  const toggleActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions((prev) => !prev);
  };

  return (
    <div
      data-testid="chat-bubble"
      className={cn(
        'w-full flex items-end gap-1.5 px-4 py-1 group select-none',
        isMine ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {/* Nút bật menu hành động cho tin nhắn của đối phương */}
      {!isMine && !isRevoked && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleActions}
            aria-label="Tùy chọn tin nhắn"
            className="p-1 rounded-full bg-surface text-text-secondary active:scale-95 transition-transform"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}

      {/* Cụm bong bóng tin nhắn chính */}
      <div
        className={cn(
          'flex flex-col max-w-[78%] min-w-0',
          isMine ? 'items-end' : 'items-start'
        )}
      >
        {/* Khung nội dung tin nhắn */}
        <div
          data-testid="chat-bubble-content"
          className={cn(
            'flex flex-col p-3 transition-colors',
            isRevoked
              ? 'rounded-[18px] bg-surface/70 text-text-secondary'
              : isMine
                ? 'rounded-[20px] rounded-br-[6px] bg-primary text-dark-surface'
                : 'rounded-[20px] rounded-bl-[6px] bg-surface text-text-primary'
          )}
        >
          {/* 1. Thẻ trích dẫn tin nhắn (Reply Quote Preview) */}
          {replyToMessage && (
            <div
              data-testid="reply-quote-preview"
              className={cn(
                'flex items-stretch gap-2 mb-2 px-2.5 py-1.5 rounded-[10px] text-left select-none',
                isMine ? 'bg-dark-surface/10' : 'bg-canvas'
              )}
            >
              <div
                className={cn(
                  'w-1 rounded-full shrink-0',
                  isMine ? 'bg-dark-surface/60' : 'bg-primary'
                )}
              />
              <div className="flex flex-col min-w-0 py-0.5">
                <span
                  className={cn(
                    'text-[11px] font-semibold leading-tight',
                    isMine ? 'text-dark-surface/80' : 'text-text-primary'
                  )}
                >
                  Trả lời tin nhắn
                </span>
                <span className="text-[12px] text-text-secondary truncate leading-tight">
                  {replyToMessage.content}
                </span>
              </div>
            </div>
          )}

          {/* 2. Ảnh phản hồi nếu có photoContext */}
          {message.photoContext?.photoUrl && (
            <div className="w-[200px] h-[200px] rounded-[16px] overflow-hidden mb-2 bg-surface-subtle shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.photoContext.photoUrl}
                alt="Ảnh đính kèm"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 3. Nội dung văn bản */}
          {isRevoked ? (
            <div className="flex items-center gap-1.5 italic text-[14px]">
              <RotateCcw size={14} className="shrink-0" />
              <span>Tin nhắn đã được thu hồi</span>
            </div>
          ) : (
            <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap break-words select-text">
              {message.content}
            </p>
          )}
        </div>

        {/* 4. Dòng trạng thái: Thời gian gửi & Trạng thái đã xem */}
        <div
          className={cn(
            'flex items-center gap-1 px-1 mt-1 text-[11px] text-text-secondary select-none',
            isMine ? 'justify-end' : 'justify-start'
          )}
        >
          <span data-testid="chat-bubble-time">{formattedTime}</span>

          {isMine && !isRevoked && (
            <>
              {message.readAt ? (
                <span
                  data-testid="read-receipt"
                  className="font-semibold text-text-primary flex items-center gap-0.5 text-[10px]"
                >
                  <CheckCheck size={12} strokeWidth={2.5} className="text-[#4E8752]" />
                  <span>Đã xem</span>
                </span>
              ) : (
                <Check
                  size={11}
                  strokeWidth={2.5}
                  data-testid="sent-receipt"
                  className="text-text-secondary"
                />
              )}
            </>
          )}
        </div>

        {/* 5. Menu / Nút thao tác nhanh (Trả lời, Thu hồi, Xóa ở phía tôi) */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 transition-opacity duration-150',
            showActions ? 'opacity-100 flex' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {onReply && !isRevoked && (
            <button
              type="button"
              onClick={handleReply}
              aria-label="Trả lời"
              title="Trả lời"
              className="p-1 rounded-full bg-surface text-text-secondary active:scale-95 transition-transform"
            >
              <CornerUpLeft size={13} />
            </button>
          )}

          {canRevoke && (
            <button
              type="button"
              onClick={handleRevoke}
              aria-label="Thu hồi"
              title="Thu hồi"
              className="p-1 rounded-full bg-surface text-[#FF6954] active:scale-95 transition-transform"
            >
              <RotateCcw size={13} />
            </button>
          )}

          {onDeleteForMe && (
            <button
              type="button"
              onClick={handleDeleteForMe}
              aria-label="Xóa ở phía tôi"
              title="Xóa ở phía tôi"
              className="p-1 rounded-full bg-surface text-text-secondary active:scale-95 transition-transform"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Nút bật menu hành động cho tin nhắn của tôi */}
      {isMine && !isRevoked && (
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={toggleActions}
            aria-label="Tùy chọn tin nhắn"
            className="p-1 rounded-full bg-surface text-text-secondary active:scale-95 transition-transform"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
