import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTicketMessageSenderNullable1775929435640 implements MigrationInterface {
  name = 'MakeTicketMessageSenderNullable1775929435640';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" DROP CONSTRAINT "FK_ddea80824c24d270ef2cb4cb0ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" ALTER COLUMN "senderId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" ADD CONSTRAINT "FK_ddea80824c24d270ef2cb4cb0ba" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" DROP CONSTRAINT "FK_ddea80824c24d270ef2cb4cb0ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" ALTER COLUMN "senderId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_messages" ADD CONSTRAINT "FK_ddea80824c24d270ef2cb4cb0ba" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
