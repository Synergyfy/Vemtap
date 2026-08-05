import { Entity, Column, Index, OneToMany, BeforeInsert } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';
import { generateUniqueCode } from '../../../common/utils/random.util';

@Entity('clusters')
export class Cluster extends AbstractBaseEntity {
  @ApiProperty({ example: 'Banex Market', description: 'Cluster display name' })
  @Column()
  name: string;

  @ApiProperty({
    example: 'CL-9XZ7KL2PQ',
    description: 'Unique code representing the cluster QR code',
  })
  @Index('idx_clusters_unique_code', { unique: true })
  @Column()
  uniqueCode: string;

  @ApiProperty({ example: 'Market deals around Banex Plaza', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 9.0489, nullable: true })
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({ example: 7.4894, nullable: true })
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Index('idx_clusters_location', { spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: any;

  @ApiProperty({
    example: 500,
    description: 'Cluster boundary radius in meters (used for auto-assignment)',
  })
  @Column({ type: 'int', default: 500 })
  radiusMeters: number;

  @ApiProperty({ example: true, description: 'Whether the cluster is live' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the cluster QR code can be scanned',
  })
  @Column({ default: true })
  qrIsActive: boolean;

  @ApiProperty({
    description: 'UUID of the admin who created the cluster',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @ApiProperty({
    example: 0,
    description: 'Total number of times the cluster QR has been scanned',
  })
  @Column({ type: 'int', default: 0 })
  scanCount: number;

  @OneToMany(() => Branch, (branch) => branch.cluster)
  branches: Branch[];

  @BeforeInsert()
  generateUniqueCode() {
    if (!this.uniqueCode) {
      this.uniqueCode = `CL-${generateUniqueCode(9)}`;
    }
  }
}
