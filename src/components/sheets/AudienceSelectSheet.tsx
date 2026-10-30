'use client';

import React, { useState, useEffect } from 'react';
import { Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import { BaseBottomSheet, BottomSheetCard } from './BaseBottomSheet';

export interface AudienceFriendItem {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface AudienceSelectSheetProps {
  isOpen: boolean;
  friends?: AudienceFriendItem[];
  initialScope?: 'ALL_FRIENDS' | 'SELECTED_FRIENDS';
  initialRecipientIds?: string[];
  onConfirm: (scope: 'ALL_FRIENDS' | 'SELECTED_FRIENDS', recipientIds?: string[]) => void;
  onDismiss: () => void;
  className?: string;
}

const EMPTY_RECIPIENTS: string[] = [];

/**
 * AudienceSelectSheet (Chọn đối tượng bạn bè nhận ảnh khoảnh khắc)
 * - Tất cả bạn bè (ALL_FRIENDS - Mặc định)
 * - Bạn bè cụ thể (SELECTED_FRIENDS) với danh sách chọn bạn bè
 * - Tuân thủ tuyệt đối quy tắc Design System: Zero Border, Zero Blur, Zero Shadow
 */
export const AudienceSelectSheet: React.FC<AudienceSelectSheetProps> = ({
  isOpen,
  friends = [],
  initialScope = 'ALL_FRIENDS',
  initialRecipientIds = EMPTY_RECIPIENTS,
  onConfirm,
  onDismiss,
  className,
}) => {
  const [scope, setScope] = useState<'ALL_FRIENDS' | 'SELECTED_FRIENDS'>(initialScope);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialRecipientIds);

  useEffect(() => {
    if (isOpen) {
      setScope(initialScope);
      setSelectedIds(initialRecipientIds.length > 0 ? initialRecipientIds : []);
    }
  }, [isOpen, initialScope]);

  const handleSelectScope = (newScope: 'ALL_FRIENDS' | 'SELECTED_FRIENDS') => {
    haptics.light();
    setScope(newScope);
  };

  const handleToggleFriend = (id: string) => {
    haptics.light();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    haptics.medium();
    if (scope === 'ALL_FRIENDS') {
      onConfirm('ALL_FRIENDS', undefined);
    } else {
      onConfirm('SELECTED_FRIENDS', selectedIds);
    }
    onDismiss();
  };

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title="Người nhận ảnh"
      icon={<Users size={18} strokeWidth={2.4} />}
      actionTitle="Xác nhận & Cập nhật"
      onAction={handleConfirm}
      className={className}
    >
      {/* 1. Card Tùy chọn phạm vi bạn bè */}
      <BottomSheetCard title="PHẠM VI CHIA SẺ">
        <div className="flex flex-col gap-2">
          {/* Lựa chọn 1: Tất cả bạn bè */}
          <button
            type="button"
            onClick={() => handleSelectScope('ALL_FRIENDS')}
            aria-label="Tất cả bạn bè"
            className={cn(
              'w-full flex items-center justify-between p-3.5 rounded-[18px] transition-all active:scale-[0.99] text-left',
              scope === 'ALL_FRIENDS'
                ? 'bg-[#D4EB70] text-[#141613]'
                : 'bg-[#F4F1EA] text-[#141613]/70 hover:bg-[#EDE9DF]'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                  scope === 'ALL_FRIENDS' ? 'bg-[#141613] text-white' : 'bg-black/5 text-[#141613]'
                )}
              >
                <Users size={18} strokeWidth={2.4} />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold tracking-tight">Tất cả bạn bè</span>
                <span className="text-[12px] opacity-70">Gửi cho mọi người</span>
              </div>
            </div>

            {scope === 'ALL_FRIENDS' && (
              <div className="w-6 h-6 rounded-full bg-[#141613] text-white flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </button>

          {/* Lựa chọn 2: Bạn bè cụ thể */}
          <button
            type="button"
            onClick={() => handleSelectScope('SELECTED_FRIENDS')}
            aria-label="Bạn cụ thể"
            className={cn(
              'w-full flex items-center justify-between p-3.5 rounded-[18px] transition-all active:scale-[0.99] text-left',
              scope === 'SELECTED_FRIENDS'
                ? 'bg-[#D4EB70] text-[#141613]'
                : 'bg-[#F4F1EA] text-[#141613]/70 hover:bg-[#EDE9DF]'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                  scope === 'SELECTED_FRIENDS'
                    ? 'bg-[#141613] text-white'
                    : 'bg-black/5 text-[#141613]'
                )}
              >
                <Users size={18} strokeWidth={2.4} />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold tracking-tight">Bạn cụ thể</span>
                <span className="text-[12px] opacity-70">
                  {selectedIds.length > 0 ? `Đã chọn ${selectedIds.length} người` : 'Chọn người nhận'}
                </span>
              </div>
            </div>

            {scope === 'SELECTED_FRIENDS' && (
              <div className="w-6 h-6 rounded-full bg-[#141613] text-white flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </button>
        </div>
      </BottomSheetCard>

      {/* 2. Card Danh sách bạn bè để tích chọn (Khi scope === 'SELECTED_FRIENDS') */}
      {scope === 'SELECTED_FRIENDS' && (
        <BottomSheetCard title={`DANH SÁCH BẠN BÈ (${friends.length})`}>
          {friends.length === 0 ? (
            <p className="text-[13px] text-[#141613]/50 py-2 text-center">Chưa có bạn bè</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
              {friends.map((friend) => {
                const isChecked = selectedIds.includes(friend.id);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => handleToggleFriend(friend.id)}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-[14px] transition-colors active:scale-[0.99]',
                      isChecked ? 'bg-[#D4EB70]/40' : 'hover:bg-black/5'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-[#DFDACD] flex items-center justify-center text-[#141613] font-bold text-xs shrink-0 overflow-hidden">
                        {friend.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={friend.avatarUrl}
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          friend.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-[14px] font-semibold text-[#141613] truncate">
                        {friend.name}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                        isChecked ? 'bg-[#141613] text-white' : 'bg-black/10'
                      )}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </BottomSheetCard>
      )}
    </BaseBottomSheet>
  );
};
