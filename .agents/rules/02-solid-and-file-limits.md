# Rule: SOLID Principles & File Line Limit (Max 700 Lines)

## Trigger
Áp dụng cho mọi file mã nguồn (`.ts`, `.tsx`, `.js`, `.jsx`).

## Bắt buộc
1. **Giới hạn số dòng cứng**:
   - Tối đa 700 dòng code trên mỗi file.
   - Khi một file vượt quá 500-600 dòng, phải tách nhỏ:
     - Tách các sub-components vào thư mục con cùng cấp hoặc `components/`.
     - Tách hooks nghiệp vụ vào `hooks/use[Feature].ts`.
     - Tách types/interfaces vào `types/`.
     - Tách helper logic vào `lib/utils/`.
2. **SOLID Principles**:
   - **SRP**: Một component chỉ làm đúng một việc; không trộn lẫn quản lý WebSocket với logic hiển thị camera.
   - **OCP**: Sử dụng composition props (`children`, `renderAction`) để dễ mở rộng mà không sửa code lõi.
   - **LSP**: Các client/adapters phải có interface rõ ràng để có thể tráo đổi bằng Mock Service trong Unit Test.
   - **ISP**: Không tạo interface "thùng rác" gom mọi thứ. Chia nhỏ interface.
   - **DIP**: High-level components phụ thuộc vào custom hooks/abstractions, không trực tiếp fetch hay socket thô.

