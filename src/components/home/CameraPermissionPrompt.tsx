'use client';

import React from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { usePermissionStore, type AppPermissionStatus } from '@/stores/permission-store';
import type { CameraStatus } from '@/hooks/useWebRTCCamera';

export interface CameraPermissionPromptProps {
  status?: CameraStatus;
  permissionStatus?: AppPermissionStatus;
  onEnableCamera?: () => void | Promise<void>;
  className?: string;
}

/**
 * CameraPermissionPrompt (Soft-Prompt Chuẩn Checked)
 * Hiển thị card chuẩn Checked khi camera chưa được cấp quyền (status: idle/unsupported, permission: prompt).
 * Thiết kế tuân thủ nghiêm ngặt: Zero Border, Zero Shadow, Zero Blur, nền #FAF8F5, nút #D9E872.
 */
export const CameraPermissionPrompt: React.FC<CameraPermissionPromptProps> = ({
  status,
  permissionStatus,
  onEnableCamera,
  className,
}) => {
  const storePermission = usePermissionStore((state) => state.permissions.camera);
  const effectivePermission = permissionStatus ?? storePermission;
  const isDenied = status === 'denied' || effectivePermission === 'denied';

  const handleEnableCamera = () => {
    usePermissionStore.getState().setHasAsked('camera', true);
    onEnableCamera?.();
  };

  const handleRetry = () => {
    onEnableCamera?.();
  };

  return (
    <div
      data-testid="camera-permission-card"
      className={cn(
        'w-[86%] max-w-[310px] bg-[#FAF8F5] rounded-[28px] p-6 flex flex-col items-center text-center gap-3 select-none',
        className
      )}
    >
      {isDenied ? (
        <>
          <div className="w-[56px] h-[56px] rounded-full bg-[#FCE8E8] flex items-center justify-center text-[#E04848]">
            <CameraOff size={26} strokeWidth={2} />
          </div>
          <span className="text-[11px] font-semibold text-[#8C8479] uppercase tracking-wider">
            Ống kính Checked
          </span>
          <h3 className="text-[17px] font-bold font-display text-[#2C2825] leading-snug">
            Chưa cấp quyền camera
          </h3>
          <p className="text-[13px] text-[#5C554D] leading-relaxed">
            Camera đang bị tắt quyền truy cập. Bạn có thể mở lại trong Cài đặt trình duyệt/iPhone để tiếp tục chụp ảnh.
          </p>
          {onEnableCamera && (
            <button
              type="button"
              onClick={handleRetry}
              className="mt-1 bg-[#D9E872] text-[#2C2825] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-transform text-sm"
            >
              Cấp quyền
            </button>
          )}
        </>
      ) : (
        <>
          <div className="w-[56px] h-[56px] rounded-full bg-[#EFECE6] flex items-center justify-center text-[#2C2825]">
            <Camera size={26} strokeWidth={2} />
          </div>
          <span className="text-[11px] font-semibold text-[#8C8479] uppercase tracking-wider">
            Ống kính Checked
          </span>
          <h3 className="text-[17px] font-bold font-display text-[#2C2825] leading-snug">
            Bật Camera để bắt đầu
          </h3>
          <p className="text-[13px] text-[#5C554D] leading-relaxed">
            Checked cần quyền truy cập camera để bạn chụp ảnh khoảnh khắc và nhận diện dinh dưỡng món ăn.
          </p>
          <button
            type="button"
            onClick={handleEnableCamera}
            className="mt-1 bg-[#D9E872] text-[#2C2825] font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-transform text-sm"
          >
            Bật Camera
          </button>
        </>
      )}
    </div>
  );
};
