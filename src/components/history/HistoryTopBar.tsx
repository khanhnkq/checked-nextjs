'use client';

import React, { useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptics } from '@/lib/utils/haptics';
import type { FriendOption } from '@/components/home';

export interface HistoryTopBarProps {
  friends?: FriendOption[];
  selectedFilterId?: string | null;
  onSelectFilter: (id: string | null) => void;
  onBackClick: () => void;
  onCalendarClick?: () => void;
  onAddFriendClick?: () => void;
  currentUserAvatar?: string | null;
  className?: string;
}

/**
 * HistoryTopBar - Header của màn hình Lịch sử khoảnh khắc
 * 1:1 tương đương HomeTopBar nhưng có nút Back bên trái và Dropdown lọc người gửi
 */
export const HistoryTopBar: React.FC<HistoryTopBarProps> = ({
  friends = [],
  selectedFilterId = null,
  onSelectFilter,
  onBackClick,
  onCalendarClick,
  onAddFriendClick,
  currentUserAvatar,
  className,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Tìm tên và avatar đang chọn cho Pill Button
  const selectedFriend = friends.find((f) => f.id === selectedFilterId);

  let filterTitle = 'Tất cả';
  let filterAvatar: string | null = null;
  let isAll = true;

  if (selectedFilterId === 'me') {
    filterTitle = 'Bạn';
    filterAvatar = currentUserAvatar || null;
    isAll = false;
  } else if (selectedFriend) {
    filterTitle = selectedFriend.name;
    filterAvatar = selectedFriend.avatarUrl || null;
    isAll = false;
  }

  const handleToggleDropdown = () => {
    haptics.click();
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSelectOption = (id: string | null) => {
    haptics.click();
    onSelectFilter(id);
    setIsDropdownOpen(false);
  };

  const handleAddFriend = () => {
    haptics.click();
    setIsDropdownOpen(false);
    onAddFriendClick?.();
  };

  return (
    <header
      className={cn(
        'relative w-full h-[52px] px-4 flex items-center justify-between select-none z-30',
        className
      )}
    >
      {/* 1. Nút Back quay về màn hình camera chính */}
      <button
        type="button"
        onClick={onBackClick}
        aria-label="Quay lại"
        className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform"
      >
        <ArrowLeft size={20} strokeWidth={2.2} />
      </button>

      {/* 2. Nút Dropdown Pill Filter căn giữa */}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleDropdown}
          aria-label="Lọc người gửi khoảnh khắc"
          className="h-[38px] px-3 rounded-full bg-white flex items-center gap-2 active:scale-95 transition-transform"
        >
          {/* Avatar hoặc Icon Users */}
          {filterAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={filterAvatar}
              alt={filterTitle}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : isAll ? (
            <Users size={16} className="text-[#141613] flex-shrink-0" />
          ) : (
            <div
              aria-hidden="true"
              className="w-5 h-5 rounded-full bg-[#DFDACD] flex items-center justify-center text-[10px] font-bold text-[#141613]"
            >
              {filterTitle.charAt(0).toUpperCase()}
            </div>
          )}

          <span className="text-[13px] font-bold font-display text-[#141613] tracking-tight max-w-[120px] truncate">
            {filterTitle}
          </span>

          <ChevronDown
            size={14}
            className={cn(
              'text-[#63685F] transition-transform duration-200',
              isDropdownOpen && 'rotate-180'
            )}
            strokeWidth={2.5}
          />
        </button>

        {/* Dropdown Menu nổi */}
        {isDropdownOpen && (
          <>
            {/* Backdrop đóng menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />

            {/* Danh sách các tùy chọn */}
            <div className="absolute top-[46px] left-1/2 -translate-x-1/2 w-[200px] rounded-2xl bg-white p-1.5 flex flex-col gap-1 z-50">
              {/* Tùy chọn 1: Tất cả */}
              <button
                type="button"
                onClick={() => handleSelectOption(null)}
                className={cn(
                  'w-full h-[40px] px-3 rounded-xl flex items-center gap-2.5 text-left text-[13px] font-semibold font-display active:bg-[#F2F2F4] transition-colors',
                  selectedFilterId === null
                    ? 'bg-[#EDE9DF] text-[#141613]'
                    : 'text-[#63685F]'
                )}
              >
                <Users size={16} />
                <span>Tất cả</span>
              </button>

              {/* Tùy chọn 2: Bạn (Chính mình) */}
              <button
                type="button"
                onClick={() => handleSelectOption('me')}
                className={cn(
                  'w-full h-[40px] px-3 rounded-xl flex items-center gap-2.5 text-left text-[13px] font-semibold font-display active:bg-[#F2F2F4] transition-colors',
                  selectedFilterId === 'me'
                    ? 'bg-[#EDE9DF] text-[#141613]'
                    : 'text-[#63685F]'
                )}
              >
                {currentUserAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUserAvatar}
                    alt=""
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full bg-[#D4EB70] flex items-center justify-center text-[10px] font-bold text-[#141613]"
                  >
                    B
                  </div>
                )}
                <span>Bạn</span>
              </button>

              {/* Tùy chọn 3: Danh sách bạn bè */}
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => handleSelectOption(friend.id)}
                  className={cn(
                    'w-full h-[40px] px-3 rounded-xl flex items-center gap-2.5 text-left text-[13px] font-semibold font-display active:bg-[#F2F2F4] transition-colors',
                    selectedFilterId === friend.id
                      ? 'bg-[#EDE9DF] text-[#141613]'
                      : 'text-[#63685F]'
                  )}
                >
                  {friend.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={friend.avatarUrl}
                      alt=""
                      aria-hidden="true"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-5 h-5 rounded-full bg-[#DFDACD] flex items-center justify-center text-[10px] font-bold text-[#141613]"
                    >
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate">{friend.name}</span>
                </button>
              ))}

              {/* Tùy chọn 4: Thêm bạn */}
              {onAddFriendClick && (
                <button
                  type="button"
                  onClick={handleAddFriend}
                  className="w-full h-[40px] px-3 rounded-xl flex items-center gap-2.5 text-left text-[13px] font-semibold font-display text-[#141613] active:bg-[#F2F2F4] transition-colors"
                >
                  <Plus size={16} />
                  <span>Thêm bạn</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 3. Nút Calendar / Lịch khoảnh khắc */}
      <button
        type="button"
        onClick={onCalendarClick}
        aria-label="Xem theo lịch"
        className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-[#141613] active:scale-95 transition-transform"
      >
        <Calendar size={18} strokeWidth={2.2} />
      </button>
    </header>
  );
};
