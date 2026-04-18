import { useState, useCallback } from 'react';

// Hook mở modal đơn giản, trả về visible, open, close, toggle
export default function useModal(defaultVisible = false) {
  const [visible, setVisible] = useState(defaultVisible);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible((v) => !v), []);
  return { visible, open, close, toggle };
}
