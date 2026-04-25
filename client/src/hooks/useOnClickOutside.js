import { useEffect } from 'react';

/**
 * useOnClickOutside - Custom Hook (Chuẩn UI/UX FSD)
 * 
 * @description Hook quyền năng chuyên trị việc tự động ĐÓNG các thành phần giao diện
 * nổi (floating UI) như: Dropdown, Modal Menu, Custom Select, hay Filter Drawer khi 
 * người dùng vô tình bấm/chạm ra các vùng khoảng trống bên ngoài phần tử đó.
 * 
 * Thiết kế này hỗ trợ chặt chẽ cả click chuột (`mousedown`) trên PC và 
 * thao tác chạm cảm ứng (`touchstart`) trên Mobile, Tablet.
 * 
 * @param {React.RefObject} ref - Cái mỏ neo (useRef) móc vào thẻ <div> bọc ngoài cùng của Modal/Drawer
 * @param {Function} handler - Hàm gọi khi phát hiện click lọt ra ngoài (thường là setState(false))
 * 
 * @example
 * const modalRef = useRef();
 * useOnClickOutside(modalRef, () => setIsModalOpen(false));
 * 
 * return <div ref={modalRef}>Nội dung Modal sẽ không đóng nếu bấm vào đây</div>
 */
export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    // 1. Khai báo cái bẫy bắt sự kiện (Listener)
    const listener = (event) => {
      // NGUYÊN TẮC: Nếu thẻ <div> Ref chưa tồn tại (chưa render), 
      // HOẶC cú click của user NẰM TRONG VÙNG của thẻ <div> Ref --> Bắt buộc bỏ qua!
      if (!ref.current || ref.current.contains(event.target)) {
        return; // Thoát thuật toán, không làm gì cả
      }
      
      // Mọi trường hợp click lọt ra khỏi cái <div> đều kích hoạt lệnh đóng ngay
      handler(event);
    };

    // 2. Kích hoạt radar: Gắn hai bộ định vị lên toàn bộ bề mặt DOM của Window:
    // Dùng `mousedown` thay cho `click` để radar bắt chuẩn xác tín hiệu lúc user MỚI NHẤN XUỐNG
    document.addEventListener('mousedown', listener);
    // Tính năng xịn: Hỗ trợ ngón tay chạm của điện thoại / Tablet
    document.addEventListener('touchstart', listener);

    // 3. Quy tắc dọn dẹp bộ nhớ (Tránh rò rỉ Memory Leak khi component chứa Ref này bị xoá mất)
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Chỉ làm mới bẫy radar nếu cái Thẻ <div> hoặc Lệnh đóng bị đổi mới
}
