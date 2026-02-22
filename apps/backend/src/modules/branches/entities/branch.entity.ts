import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Business } from '../../businesses/entities/business.entity';
import { User } from '../../users/entities/user.entity';
import { Visit } from '../../visitors/entities/visit.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { MessageCampaign } from '../../messaging/entities/message-campaign.entity';

@Entity('branches')
export class Branch extends AbstractBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Business, (business) => business.branches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column()
  businessId: string;

  @OneToMany(() => User, (user) => user.branch)
  staff: User[];

  @OneToMany(() => Visit, (visit) => visit.branch)
  visits: Visit[];

  @OneToMany(() => Campaign, (campaign) => campaign.branch)
  campaigns: Campaign[];

  @OneToMany(() => MessageCampaign, (mc) => mc.branch)
  messageCampaigns: MessageCampaign[];
}
