import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets an in-house chat carry an image.
 *
 * The messaging pipeline had nowhere to put media: `ReplyDto` accepted only
 * text and the entity had no column, so an attachment could be uploaded and
 * then had nowhere to land. These two columns are that landing spot, and they
 * travel over the socket because `emitMessage` broadcasts the saved entity.
 */
export class AddChatMessageMedia1791600000000 implements MigrationInterface {
  name = 'AddChatMessageMedia1791600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "mediaUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "mediaMimeType" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "mediaMimeType"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "mediaUrl"`);
  }
}