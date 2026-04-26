import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  ping(): { module: string; status: 'ready' } {
    return { module: 'admin', status: 'ready' };
  }
}
