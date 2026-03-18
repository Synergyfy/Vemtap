import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../../users/entities/user.entity';
import { BranchesService } from '../../branches/branches.service';

@Injectable()
export class MessagingHelperService {
  constructor(private readonly branchesService: BranchesService) {}

  /**
   * Resolves the branch ID based on the user's role and the provided branch ID.
   * Logic:
   * - Admin: Must provide a branchId.
   * - Owner/Manager: Uses provided branchId (if authorized) or defaults to their primary branchId.
   * - Staff/Agent: Always uses their own branchId.
   */
  async resolveBranchId(user: User, providedBranchId?: string): Promise<string> {
    if (user.role === UserRole.ADMIN) {
      if (!providedBranchId) {
        throw new BadRequestException('Branch ID is required for admin');
      }
      return providedBranchId;
    }

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      // If no branchId provided, use their primary branchId
      if (!providedBranchId) return user.branchId;

      // If branchId provided, verify they have access to it
      const hasAccess = await this.branchesService.checkBranchAccess(user, providedBranchId);
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this branch');
      }
      return providedBranchId;
    }

    // Staff/Agents can only access their own branch
    return user.branchId;
  }
}
