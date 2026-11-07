'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/auth-store';
import {
  ChatRoomTopBar,
  ChatBubble,
  PartnerTypingBubble,
  ChatInputBar,
  ChatMessagesSkeleton,
} from '@/components/chat';
import type { MessageResponse } from '@/types/chat';

/**
 * Phòng Chat 1-on-1 (/messages/[id])
 * Chuẩn 1:1 Parity với iOS ChatView.swift
 * - Header thanh tiêu đề ChatRoomTopBar: Avatar 38px, Tên bạn bè, trạng thái typing / online
 * - Khung xương chuyển động ChatMessagesSkeleton khi tải tin nhắn lần đầu
 * - Nút "Tải thêm tin nhắn cũ" phân trang lùi cursor (reverse cursor pagination)
 * - Bong bóng tin nhắn ChatBubble với các tính năng trả lời, thu hồi, xóa ở phía tôi, photo context
 * - Bong bóng đối phương đang soạn tin PartnerTypingBubble với 3 chấm Matcha Glow
 * - Thanh nhập liệu ChatInputBar với banner trích dẫn trả lời, tự co giãn, gửi tin nhắn
 * - Cuộn tự động mượt mà đến neo cuối phòng (bottom anchor) khi có tin nhắn mới hoặc typing
 * - Nguyên tắc thiết kế: Zero Border, Zero Shadow
 */
export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();

  const targetId = typeof params?.id === 'string'
    ? params.id
    : Array.isArray(params?.id)
      ? params.id[0]
      : '';

  const user = useAuthStore((s) => s.user);

  const {
    conversation,
    messages,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    replyingToMessage,
    setReplyingToMessage,
    isPartnerTyping,
    sendTyping,
  } = useChat({ targetId });

  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const initialScrollDoneRef = useRef(false);
  const prevIsPartnerTypingRef = useRef(false);

  // Cuộn tự động mượt mà tới cuối danh sách tin nhắn
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (typeof bottomAnchorRef.current?.scrollIntoView === 'function') {
      bottomAnchorRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Đặt lại các cờ cuộn khi đổi phòng chat
  useEffect(() => {
    initialScrollDoneRef.current = false;
    lastMessageIdRef.current = null;
    prevIsPartnerTypingRef.current = false;
  }, [targetId]);

  // Cuộn đáy khi tải xong lần đầu, khi có tin mới ở đáy, hoặc khi đối tác bắt đầu soạn tin
  useEffect(() => {
    if (isLoadingInitial) {
      return;
    }

    const currentLastMessage = messages[messages.length - 1];
    const currentLastMessageId = currentLastMessage?.id ?? null;

    // 1. Lần đầu tải xong danh sách tin nhắn
    if (!initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      lastMessageIdRef.current = currentLastMessageId;
      prevIsPartnerTypingRef.current = isPartnerTyping;
      scrollToBottom('auto');
      return;
    }

    // 2. Có tin nhắn mới được thêm vào đáy danh sách
    if (currentLastMessageId && currentLastMessageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = currentLastMessageId;
      prevIsPartnerTypingRef.current = isPartnerTyping;
      scrollToBottom('smooth');
      return;
    }

    // Cập nhật ref nếu mảng tin rỗng hoặc tin nhắn cũ được thêm vào đầu (loadMoreMessages)
    lastMessageIdRef.current = currentLastMessageId;

    // 3. Đối phương bắt đầu soạn tin
    if (isPartnerTyping && !prevIsPartnerTypingRef.current) {
      scrollToBottom('smooth');
    }
    prevIsPartnerTypingRef.current = isPartnerTyping;
  }, [messages, isPartnerTyping, isLoadingInitial, scrollToBottom]);

  // Xử lý nút quay lại
  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/messages');
    }
  }, [router]);

  // Điều hướng xem trang cá nhân của bạn chat
  const handlePartnerClick = useCallback(() => {
    if (conversation?.partner?.username) {
      router.push(`/u/${conversation.partner.username}`);
    }
  }, [conversation?.partner?.username, router]);

  // Xử lý gửi tin nhắn (kèm quote reply nếu đang trả lời)
  const handleSend = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;

      if (replyingToMessage) {
        await sendMessage(text, { replyToMessageId: replyingToMessage.id });
        setReplyingToMessage(null);
      } else {
        await sendMessage(text);
      }
      scrollToBottom('smooth');
    },
    [sendMessage, replyingToMessage, setReplyingToMessage, scrollToBottom]
  );

  // Bản đồ tìm kiếm nhanh tin nhắn được trích dẫn trả lời
  const replyMap = useMemo(() => {
    const map = new Map<string, MessageResponse>();
    for (const msg of messages) {
      map.set(msg.id, msg);
    }
    return map;
  }, [messages]);

  // Thông tin đối tác an toàn khi chưa tải xong cuộc trò chuyện
  const partner = conversation?.partner ?? {
    id: targetId,
    username: '',
    displayName: 'Trò chuyện',
    avatarUrl: null,
    isOnline: false,
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-canvas text-text-primary flex flex-col items-center overflow-hidden select-none">
      <main
        data-testid="chat-room-page"
        className="w-full max-w-md mx-auto flex flex-col h-full relative"
      >
        {/* 1. Thanh tiêu đề phòng chat */}
        <ChatRoomTopBar
          partner={partner}
          isPartnerTyping={isPartnerTyping}
          onBack={handleBack}
          onPartnerClick={handlePartnerClick}
        />

        {/* 2. Vùng danh sách tin nhắn cuộn */}
        <div
          data-testid="chat-messages-container"
          className="flex-1 overflow-y-auto w-full px-0 py-2 flex flex-col min-h-0 space-y-1"
        >
          {isLoadingInitial && messages.length === 0 ? (
            <ChatMessagesSkeleton />
          ) : (
            <>
              {/* Nút tải thêm tin nhắn cũ khi còn trang trước */}
              {hasMore && (
                <div className="w-full flex justify-center py-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => loadMoreMessages()}
                    disabled={isLoadingMore}
                    data-testid="load-more-messages-button"
                    className="px-3.5 py-1.5 text-xs font-medium text-text-secondary bg-surface rounded-full transition-transform active:scale-95 disabled:opacity-50 select-none"
                  >
                    {isLoadingMore ? 'Đang tải...' : 'Tải thêm tin nhắn cũ'}
                  </button>
                </div>
              )}

              {/* Danh sách các bong bóng tin nhắn */}
              {messages.map((message) => {
                const isMine = Boolean(user?.id && message.senderId === user.id);
                const replyToMsg = message.replyToMessageId
                  ? replyMap.get(message.replyToMessageId) ?? null
                  : null;

                return (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isMine={isMine}
                    replyToMessage={replyToMsg}
                    onReply={() => setReplyingToMessage(message)}
                    onRevoke={() => deleteMessage(message.id, 'FOR_EVERYONE')}
                    onDeleteForMe={() => deleteMessage(message.id, 'FOR_ME')}
                  />
                );
              })}

              {/* Bong bóng báo đối phương đang soạn tin */}
              {isPartnerTyping && <PartnerTypingBubble />}

              {/* Neo cuộn đáy phòng chat */}
              <div
                ref={bottomAnchorRef}
                data-testid="chat-bottom-anchor"
                className="h-px w-full shrink-0"
              />
            </>
          )}
        </div>

        {/* 3. Thanh nhập tin nhắn */}
        <ChatInputBar
          replyingTo={replyingToMessage}
          onCancelReply={() => setReplyingToMessage(null)}
          onSend={handleSend}
          onTypingChange={(isTyping) => sendTyping(isTyping)}
        />
      </main>
    </div>
  );
}
