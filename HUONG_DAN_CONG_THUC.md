# Hướng dẫn nhập công thức toán học

## Cú pháp cơ bản

Ứng dụng hỗ trợ nhập **text thường kết hợp với công thức toán học** sử dụng cú pháp LaTeX.

### 1. Công thức inline (trong dòng)

- **Cú pháp**: `$...$`
- **Ví dụ**: `Giải phương trình $x^2 + 2x + 1 = 0$ với x thuộc R`
- **Hiển thị**: Giải phương trình _x² + 2x + 1 = 0_ với x thuộc R

### 2. Công thức block (xuống dòng riêng)

- **Cú pháp**: `$$...$$`
- **Ví dụ**: `$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$`
- **Hiển thị**: Công thức sẽ hiện ở dòng riêng, căn giữa

## Công thức toán học thường dùng

### Số mũ và chỉ số

- Số mũ: `$x^2$`, `$x^{10}$`
- Chỉ số dưới: `$x_1$`, `$x_{10}$`
- Kết hợp: `$x_1^2$`

### Phân số

- Phân số đơn giản: `$\frac{2}{3}$`
- Phân số phức tạp: `$\frac{x^2 + 1}{x - 1}$`

### Căn bậc

- Căn bậc hai: `$\sqrt{4}$`
- Căn bậc n: `$\sqrt[3]{8}$`, `$\sqrt[n]{x}$`

### Tích phân và đạo hàm

- Tích phân: `$\int_0^1 x^2 dx$`
- Tích phân kép: `$\int\int f(x,y) dx dy$`
- Đạo hàm: `$f'(x)$`, `$f''(x)$`
- Đạo hàm riêng: `$\frac{\partial f}{\partial x}$`

### Giới hạn và tổng

- Giới hạn: `$\lim_{x \to 0} \frac{\sin x}{x}$`
- Tổng: `$\sum_{i=1}^{n} i$`
- Tích: `$\prod_{i=1}^{n} i$`

### Hàm lượng giác

- `$\sin(x)$`, `$\cos(x)$`, `$\tan(x)$`
- `$\arcsin(x)$`, `$\arccos(x)$`, `$\arctan(x)$`

### Ký hiệu đặc biệt

- Vô cực: `$\infty$`
- Pi: `$\pi$`
- Alpha, beta, gamma: `$\alpha$`, `$\beta$`, `$\gamma$`
- Thuộc: `$x \in \mathbb{R}$`
- Không thuộc: `$x \notin \mathbb{N}$`
- Tập hợp: `$\mathbb{N}$`, `$\mathbb{Z}$`, `$\mathbb{Q}$`, `$\mathbb{R}$`, `$\mathbb{C}$`

### Dấu ngoặc

- Ngoặc tròn: `$(x + y)$`
- Ngoặc vuông: `$[x + y]$`
- Ngoặc nhọn: `$\{x + y\}$`
- Ngoặc tự động co dãn: `$\left( \frac{x}{y} \right)$`

### Ma trận

```
$$
\begin{bmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{bmatrix}
$$
```

## Ví dụ câu hỏi hoàn chỉnh

### Câu hỏi 1

**Nội dung**: `Giải phương trình $x^2 - 5x + 6 = 0$`

**Đáp án**:

- A: `$x = 1$`
- B: `$x = 2, 3$`
- C: `$x = -2, -3$`
- D: `Vô nghiệm`

### Câu hỏi 2

**Nội dung**: `Tính tích phân $$\int_0^{\pi} \sin(x) dx$$`

**Đáp án**:

- A: `$0$`
- B: `$1$`
- C: `$2$`
- D: `$\pi$`

### Câu hỏi 3

**Nội dung**: `Cho hàm số $f(x) = x^3 - 3x + 1$. Tìm đạo hàm $f'(x)$`

**Đáp án**:

- A: `$f'(x) = 3x^2 - 3$`
- B: `$f'(x) = 3x^2$`
- C: `$f'(x) = x^2 - 3$`
- D: `$f'(x) = 3x - 3$`

## Lưu ý quan trọng

1. **Luôn bọc công thức trong `$...$` hoặc `$$...$$`** - Nếu không, công thức sẽ hiển thị như text thường
2. **Dấu cách trong text thường được giữ nguyên** - Chỉ cần nhập bình thường
3. **Có thể kết hợp nhiều công thức trong một câu** - Ví dụ: `Với $x > 0$ và $y < 0$, tính $x + y$`
4. **Xem trước trực tiếp** - Hệ thống sẽ hiển thị preview khi bạn nhập

## Công cụ hỗ trợ

- **Các nút công thức mẫu** trong giao diện thêm câu hỏi giúp chèn nhanh công thức thông dụng
- **Preview real-time** giúp kiểm tra công thức trước khi lưu
- Tham khảo thêm tại: https://katex.org/docs/supported.html
