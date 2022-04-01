import { AccountRole, SharedAccountInput } from '@typings/Account';
import { AuthorizationErrors } from '@typings/Errors';
import { ServerError } from '@utils/errors';
import { AccountModel } from '@services/account/account.model';
import { singleton } from 'tsyringe';
import { SharedAccountModel } from './sharedAccount.model';

const include = [{ model: AccountModel, as: 'account' }];

@singleton()
export class SharedAccountDB {
  async getSharedAccountsById(id: number): Promise<SharedAccountModel[]> {
    return await SharedAccountModel.findAll({
      where: { accountId: id },
      include,
    });
  }

  async getSharedAccountsByIdentifier(identifier: string): Promise<SharedAccountModel[]> {
    return await SharedAccountModel.findAll({
      where: { user: identifier },
      include,
    });
  }

  async getAuthorizedSharedAccountById(
    id: number,
    identifier: string,
    roles: AccountRole[],
  ): Promise<AccountModel | null> {
    const sharedAccount = await SharedAccountModel.findOne({
      where: { accountId: id, user: identifier },
      include,
    });

    const role = sharedAccount?.getDataValue('role');
    if (role && !roles.includes(role)) {
      throw new ServerError(AuthorizationErrors.Forbidden);
    }

    return sharedAccount?.getDataValue('account') as unknown as AccountModel;
  }

  async createSharedAccount(input: SharedAccountInput): Promise<SharedAccountModel> {
    const account = await SharedAccountModel.create(input);
    await account.setAccount(input.accountId);
    return account;
  }

  async deleteSharedAccount(id: number) {
    return await SharedAccountModel.findOne({ where: { id } });
  }
}