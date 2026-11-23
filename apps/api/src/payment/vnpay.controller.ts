import { Controller, Get, Query } from '@nestjs/common';
import { CheckoutService } from '../checkout/checkout.service';

// Public on purpose (no AuthGuard): VNPay calls the IPN itself and the browser lands on return before any login check.
// Both are protected by the VNPay signature instead.
@Controller('payments/vnpay')
export class VnpayController {
  /** Nhận các dịch vụ phụ thuộc do NestJS cung cấp để sử dụng trong các phương thức của lớp. */
  constructor(private readonly checkout: CheckoutService) {}
  /** Tiếp nhận yêu cầu HTTP và chuyển thông báo VNPay cho dịch vụ xác thực chữ ký và xử lý kết quả. */
  @Get('ipn') ipn(@Query() query: Record<string, unknown>) { return this.checkout.ipn(query); }
  /** Tiếp nhận yêu cầu HTTP và xác minh dữ liệu return từ VNPay để cung cấp thông tin giao dịch. */
  @Get('return') checkReturn(@Query() query: Record<string, unknown>) { return this.checkout.checkReturn(query); }
}
